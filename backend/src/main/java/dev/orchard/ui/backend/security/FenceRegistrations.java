package dev.orchard.ui.backend.security;

import java.util.Optional;

import org.springframework.security.oauth2.client.registration.ClientRegistration;

public interface FenceRegistrations {

    Optional<ClientRegistration> fence();
}
