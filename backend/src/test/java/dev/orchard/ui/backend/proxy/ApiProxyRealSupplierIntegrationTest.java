package dev.orchard.ui.backend.proxy;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import dev.orchard.ui.backend.security.FenceRegistrations;
import dev.orchard.ui.backend.security.TestFenceRegistrations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "orchard.fence.issuer-uri=http://fence.test")
@AutoConfigureMockMvc
class ApiProxyRealSupplierIntegrationTest {

    static ConfigurableApplicationContext stubCore;
    static int stubPort;

    @TestBean(methodName = "dev.orchard.ui.backend.security.TestFenceRegistrations#fenceRegistrations")
    FenceRegistrations fenceRegistrations;

    private final MockMvc mvc;
    private final OAuth2AuthorizedClientRepository authorizedClients;
    private final FilterChainProxy filterChainProxy;

    ApiProxyRealSupplierIntegrationTest(MockMvc mvc, OAuth2AuthorizedClientRepository authorizedClients, FilterChainProxy filterChainProxy) {
        this.mvc = mvc;
        this.authorizedClients = authorizedClients;
        this.filterChainProxy = filterChainProxy;
    }

    @BeforeAll
    static void startStubCore() {
        stubCore = new SpringApplicationBuilder(StubCoreApplication.class)
            .profiles("stub")
            .properties("server.port=0")
            .run("--server.port=0");
        stubPort = stubCore.getEnvironment().getProperty("local.server.port", Integer.class);
    }

    @AfterAll
    static void stopStubCore() {
        if (stubCore != null) {
            stubCore.close();
        }
    }

    @DynamicPropertySource
    static void coreBaseUrl(DynamicPropertyRegistry registry) {
        registry.add("orchard.core.base-url", () -> "http://localhost:" + stubPort);
    }

    private static OAuth2AuthenticationToken principal() {
        var user = new DefaultOAuth2User(AuthorityUtils.createAuthorityList("ROLE_USER"),
            java.util.Map.of("sub", "user"), "sub");
        return new OAuth2AuthenticationToken(user, user.getAuthorities(), "fence");
    }

    @Test
    void relaysTokenStoredByTheLoginRepository() throws Exception {
        OAuth2AuthenticationToken principal = principal();
        MockHttpSession session = new MockHttpSession();
        OAuth2AccessToken token = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "real-t",
            Instant.now().minusSeconds(5), Instant.now().plusSeconds(300));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);
        authorizedClients.saveAuthorizedClient(
            new OAuth2AuthorizedClient(TestFenceRegistrations.FENCE, "user", token), principal,
            request, new MockHttpServletResponse());

        mvc.perform(get("/api/echo-header").session(session).with(authentication(principal)))
            .andExpect(status().isOk())
            .andExpect(content().string("Bearer real-t"));
    }

    @Test
    void loginFilterUsesTheSharedRepository() {
        List<Filter> filters = filterChainProxy.getFilterChains().stream()
            .flatMap(c -> c.getFilters().stream())
            .toList();
        OAuth2LoginAuthenticationFilter login = filters.stream()
            .filter(OAuth2LoginAuthenticationFilter.class::isInstance)
            .map(OAuth2LoginAuthenticationFilter.class::cast)
            .findFirst().orElseThrow();
        assertThat(ReflectionTestUtils.getField(login, "authorizedClientRepository")).isSameAs(authorizedClients);
    }
}
