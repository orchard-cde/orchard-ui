package dev.orchard.ui.backend.auth;

import dev.orchard.ui.backend.security.FenceProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class SessionController {

    private final FenceProperties properties;

    SessionController(FenceProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/auth/session")
    SessionStatus session(Authentication authentication, HttpServletRequest request) {
        if (request.getAttribute(CsrfToken.class.getName()) instanceof CsrfToken token) {
            token.getToken();
        }
        boolean authenticated = properties.enabled()
            && authentication != null
            && authentication.isAuthenticated()
            && !(authentication instanceof AnonymousAuthenticationToken);
        return new SessionStatus(properties.enabled(), authenticated);
    }

    record SessionStatus(boolean enabled, boolean authenticated) {
    }
}
