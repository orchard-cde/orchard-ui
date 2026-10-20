package dev.orchard.ui.backend.security;

import java.util.Optional;

import org.springframework.security.oauth2.client.registration.ClientRegistration;

public interface FenceRegistrations {

    String ID = "fence";

    Optional<ClientRegistration> fence();
}
