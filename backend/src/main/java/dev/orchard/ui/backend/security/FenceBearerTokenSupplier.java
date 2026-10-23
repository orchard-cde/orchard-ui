package dev.orchard.ui.backend.security;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;

import dev.orchard.ui.backend.proxy.BearerTokenSupplier;

class FenceBearerTokenSupplier implements BearerTokenSupplier {

    private final FenceProperties properties;
    private final OAuth2AuthorizedClientManager manager;
    private final OAuth2AuthorizedClientRepository authorizedClients;

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
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest.withClientRegistrationId(FenceRegistrations.ID)
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
        authorizedClients.removeAuthorizedClient(FenceRegistrations.ID,
            SecurityContextHolder.getContext().getAuthentication(), request, response);
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
