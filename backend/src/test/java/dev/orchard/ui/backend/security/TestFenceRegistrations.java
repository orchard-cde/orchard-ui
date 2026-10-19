package dev.orchard.ui.backend.security;

import java.util.Map;
import java.util.Optional;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

public final class TestFenceRegistrations {

    public static final ClientRegistration FENCE = ClientRegistration.withRegistrationId("fence")
        .clientId("orchard-ui")
        .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
        .scope("openid", "profile", "email")
        .authorizationUri("http://fence.test/oauth2/authorize")
        .tokenUri("http://fence.test/oauth2/token")
        .jwkSetUri("http://fence.test/oauth2/jwks")
        .userNameAttributeName("sub")
        .providerConfigurationMetadata(Map.of("end_session_endpoint", "http://fence.test/connect/logout"))
        .build();

    private TestFenceRegistrations() {
    }

    public static FenceRegistrations fenceRegistrations() {
        return () -> Optional.of(FENCE);
    }
}
