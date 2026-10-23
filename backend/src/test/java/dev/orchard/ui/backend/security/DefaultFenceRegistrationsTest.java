package dev.orchard.ui.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DefaultFenceRegistrationsTest {

    private static ClientRegistration build(FenceProperties properties) {
        ClientRegistration.Builder base = ClientRegistration.withRegistrationId("placeholder")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationUri("http://issuer/authorize")
            .tokenUri("http://issuer/token");
        return DefaultFenceRegistrations.configure(base, properties).build();
    }

    @Test
    void secretSelectsClientSecretBasic() {
        ClientRegistration registration = build(new FenceProperties("http://issuer", "orchard-ui", "s"));

        assertThat(registration.getClientAuthenticationMethod()).isEqualTo(ClientAuthenticationMethod.CLIENT_SECRET_BASIC);
        assertThat(registration.getRegistrationId()).isEqualTo("fence");
        assertThat(registration.getScopes()).containsExactlyInAnyOrder("openid", "profile", "email");
    }

    @Test
    void blankSecretSelectsNone() {
        ClientRegistration registration = build(new FenceProperties("http://issuer", "orchard-ui", ""));

        assertThat(registration.getClientAuthenticationMethod()).isEqualTo(ClientAuthenticationMethod.NONE);
        assertThat(registration.getRegistrationId()).isEqualTo("fence");
        assertThat(registration.getScopes()).containsExactlyInAnyOrder("openid", "profile", "email");
    }

    @Test
    void discoveryFailureFailsFast() {
        FenceProperties properties = new FenceProperties("http://127.0.0.1:9", "orchard-ui", "");

        assertThatThrownBy(() -> new DefaultFenceRegistrations(properties)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void disabledSkipsDiscovery() {
        assertThat(new DefaultFenceRegistrations(new FenceProperties("", "orchard-ui", "")).fence()).isEmpty();
    }
}
