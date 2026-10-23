package dev.orchard.ui.backend.proxy;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

final class NoAuthBearerTokenSupplier implements BearerTokenSupplier {

    @Override
    public boolean authEnabled() {
        return false;
    }

    @Override
    public Optional<String> accessToken(HttpServletRequest request, HttpServletResponse response) {
        return Optional.empty();
    }

    @Override
    public void discard(HttpServletRequest request, HttpServletResponse response) {
    }
}
