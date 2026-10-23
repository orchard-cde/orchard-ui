package dev.orchard.ui.backend.proxy;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface BearerTokenSupplier {

    boolean authEnabled();

    Optional<String> accessToken(HttpServletRequest request, HttpServletResponse response);

    void discard(HttpServletRequest request, HttpServletResponse response);
}
