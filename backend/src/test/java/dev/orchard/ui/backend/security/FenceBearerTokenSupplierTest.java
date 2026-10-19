package dev.orchard.ui.backend.security;

import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.oauth2.client.ClientAuthorizationException;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2Error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FenceBearerTokenSupplierTest {

    private final OAuth2AuthorizedClientManager manager = mock(OAuth2AuthorizedClientManager.class);
    private final OAuth2AuthorizedClientRepository repository = mock(OAuth2AuthorizedClientRepository.class);
    private final FenceProperties enabled = new FenceProperties("http://fence.test", "orchard-ui", null);
    private final FenceBearerTokenSupplier supplier = new FenceBearerTokenSupplier(enabled, manager, repository);
    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @BeforeEach
    void signIn() {
        SecurityContextHolder.getContext().setAuthentication(
            new TestingAuthenticationToken("user", "n", AuthorityUtils.NO_AUTHORITIES));
    }

    @AfterEach
    void signOut() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void missingAuthenticationIsEmpty() {
        SecurityContextHolder.clearContext();
        assertThat(supplier.accessToken(request, response)).isEmpty();
    }

    @Test
    void authorizationFailureIsEmpty() {
        when(manager.authorize(any(OAuth2AuthorizeRequest.class)))
            .thenThrow(new ClientAuthorizationException(new OAuth2Error("invalid_grant"), "fence"));
        assertThat(supplier.accessToken(request, response)).isEmpty();
    }

    @Test
    void nullClientIsEmpty() {
        assertThat(supplier.accessToken(request, response)).isEmpty();
    }

    @Test
    void validClientYieldsTokenValue() {
        OAuth2AccessToken token = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "t1",
            Instant.now(), Instant.now().plusSeconds(60));
        OAuth2AuthorizedClient client = new OAuth2AuthorizedClient(TestFenceRegistrations.FENCE, "user", token);
        when(manager.authorize(any(OAuth2AuthorizeRequest.class))).thenReturn(client);
        assertThat(supplier.accessToken(request, response)).contains("t1");
    }

    @Test
    void discardRemovesClientAndInvalidatesSession() {
        var session = request.getSession(true);
        supplier.discard(request, response);
        verify(repository).removeAuthorizedClient(eq("fence"), any(), eq(request), eq(response));
        assertThat(((org.springframework.mock.web.MockHttpSession) session).isInvalid()).isTrue();
    }

    @Test
    void authEnabledFollowsProperties() {
        assertThat(supplier.authEnabled()).isTrue();
        assertThat(new FenceBearerTokenSupplier(new FenceProperties(null, "orchard-ui", null),
            manager, repository).authEnabled()).isFalse();
    }
}
