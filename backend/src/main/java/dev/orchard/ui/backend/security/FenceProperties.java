package dev.orchard.ui.backend.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties("orchard.fence")
public record FenceProperties(String issuerUri, String clientId, String clientSecret) {

    public boolean enabled() {
        return StringUtils.hasText(issuerUri);
    }

    public boolean confidential() {
        return StringUtils.hasText(clientSecret);
    }
}
