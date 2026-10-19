package dev.orchard.ui.backend.proxy;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import dev.orchard.ui.backend.security.FenceRegistrations;
import dev.orchard.ui.backend.security.TestFenceRegistrations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "orchard.fence.issuer-uri=http://fence.test")
@AutoConfigureMockMvc
class ApiProxyAuthOnIntegrationTest {

    static ConfigurableApplicationContext stubCore;
    static int stubPort;

    @TestBean(methodName = "dev.orchard.ui.backend.security.TestFenceRegistrations#fenceRegistrations")
    FenceRegistrations fenceRegistrations;

    @TestBean(methodName = "dev.orchard.ui.backend.proxy.ScriptedBearerTokenSupplier#bearerTokenSupplier")
    BearerTokenSupplier bearerTokenSupplier;

    @Autowired
    MockMvc mvc;

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

    @BeforeEach
    void reset() {
        ScriptedBearerTokenSupplier.INSTANCE.reset("t1");
        StubCoreApplication.HITS.set(0);
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor login() {
        return oidcLogin().clientRegistration(TestFenceRegistrations.FENCE);
    }

    @Test
    void relaysSessionBearer() throws Exception {
        mvc.perform(get("/api/echo-header").with(login()))
            .andExpect(status().isOk())
            .andExpect(content().string("Bearer t1"));
    }

    @Test
    void dropsBrowserAuthorization() throws Exception {
        mvc.perform(get("/api/echo-header").with(login()).header(HttpHeaders.AUTHORIZATION, "Bearer evil"))
            .andExpect(content().string("Bearer t1"));
    }

    @Test
    void dropsBrowserCookies() throws Exception {
        mvc.perform(get("/api/echo-cookie").with(login())
                .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "abc"))
                .header(HttpHeaders.COOKIE, "other=1"))
            .andExpect(content().string("none"));
    }

    @Test
    void dropsUpstreamSetCookie() throws Exception {
        MvcResult result = mvc.perform(get("/api/sets-cookie").with(login()))
            .andExpect(status().isOk())
            .andReturn();
        assertThat(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE)).noneMatch(v -> v.contains("core=1"));
    }

    @Test
    void supplierEmptyIs401AndDiscards() throws Exception {
        ScriptedBearerTokenSupplier.INSTANCE.reset(null);
        mvc.perform(get("/api/echo-header").with(login()))
            .andExpect(status().isUnauthorized());
        assertThat(StubCoreApplication.HITS.get()).isZero();
        assertThat(ScriptedBearerTokenSupplier.INSTANCE.discards.get()).isEqualTo(1);
    }

    @Test
    void upstream401Discards() throws Exception {
        mvc.perform(get("/api/secure").with(login()))
            .andExpect(status().isUnauthorized());
        assertThat(ScriptedBearerTokenSupplier.INSTANCE.discards.get()).isEqualTo(1);
    }

    @Test
    void sseRelaysBearer() throws Exception {
        MvcResult result = mvc.perform(get("/api/echo-header-sse").with(login())
                .accept("text/event-stream"))
            .andReturn();
        if (result.getRequest().isAsyncStarted()) {
            result = mvc.perform(asyncDispatch(result)).andReturn();
        }
        assertThat(result.getResponse().getContentAsString()).contains("data:Bearer t1");
    }
}
