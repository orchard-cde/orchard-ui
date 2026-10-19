package dev.orchard.ui.backend.security;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.ClientAuthorizationException;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.stereotype.Component;

import dev.orchard.ui.backend.proxy.BearerTokenSupplier;

@Component
public class FenceBearerTokenSupplier implements BearerTokenSupplier {

    private static final String REGISTRATION_ID = "fence";

    private final FenceProperties properties;
    private final OAuth2AuthorizedClientManager manager;
    private final OAuth2AuthorizedClientRepository authorizedClients;

    @Autowired
    public FenceBearerTokenSupplier(FenceProperties properties, FenceRegistrations registrations) {
        this.properties = properties;
        if (properties.enabled()) {
            this.authorizedClients = new HttpSessionOAuth2AuthorizedClientRepository();
            DefaultOAuth2AuthorizedClientManager defaultManager = new DefaultOAuth2AuthorizedClientManager(
                new InMemoryClientRegistrationRepository(registrations.fence().orElseThrow()), authorizedClients);
            defaultManager.setAuthorizedClientProvider(OAuth2AuthorizedClientProviderBuilder.builder()
                .authorizationCode()
                .refreshToken()
                .build());
            this.manager = defaultManager;
        } else {
            this.authorizedClients = null;
            this.manager = null;
        }
    }

    FenceBearerTokenSupplier(FenceProperties properties, OAuth2AuthorizedClientManager manager,
            OAuth2AuthorizedClientRepository authorizedClients) {
        this.properties = properties;
        this.manager = manager;
        this.authorizedClients = authorizedClients;
    }

    @Override
    public boolean authEnabled() {
        return properties.enabled();
    }

    @Override
    public Optional<String> accessToken(HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return Optional.empty();
        }
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest.withClientRegistrationId(REGISTRATION_ID)
            .principal(authentication)
            .attribute(HttpServletRequest.class.getName(), request)
            .attribute(HttpServletResponse.class.getName(), response)
            .build();
        try {
            OAuth2AuthorizedClient client = manager.authorize(authorizeRequest);
            return client == null ? Optional.empty() : Optional.of(client.getAccessToken().getTokenValue());
        } catch (OAuth2AuthorizationException e) {
            return Optional.empty();
        }
    }

    @Override
    public void discard(HttpServletRequest request, HttpServletResponse response) {
        authorizedClients.removeAuthorizedClient(REGISTRATION_ID,
            SecurityContextHolder.getContext().getAuthentication(), request, response);
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
