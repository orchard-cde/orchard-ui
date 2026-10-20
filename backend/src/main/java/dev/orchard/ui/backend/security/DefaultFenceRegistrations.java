package dev.orchard.ui.backend.security;

import java.util.Optional;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.stereotype.Component;

@Component
class DefaultFenceRegistrations implements FenceRegistrations {

    private final Optional<ClientRegistration> fence;

    DefaultFenceRegistrations(FenceProperties properties) {
        this.fence = properties.enabled()
            ? Optional.of(configure(ClientRegistrations.fromIssuerLocation(properties.issuerUri()), properties).build())
            : Optional.empty();
    }

    static ClientRegistration.Builder configure(ClientRegistration.Builder builder, FenceProperties properties) {
        return builder
            .registrationId(ID)
            .clientId(properties.clientId())
            .clientSecret(properties.clientSecret())
            .clientAuthenticationMethod(properties.confidential()
                ? ClientAuthenticationMethod.CLIENT_SECRET_BASIC
                : ClientAuthenticationMethod.NONE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .scope("openid", "profile", "email");
    }

    @Override
    public Optional<ClientRegistration> fence() {
        return fence;
    }
}
