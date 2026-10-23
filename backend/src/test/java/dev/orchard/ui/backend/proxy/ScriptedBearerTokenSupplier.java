package dev.orchard.ui.backend.proxy;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

class ScriptedBearerTokenSupplier implements BearerTokenSupplier {

    static final ScriptedBearerTokenSupplier INSTANCE = new ScriptedBearerTokenSupplier();

    volatile String token;
    final AtomicInteger discards = new AtomicInteger();

    static BearerTokenSupplier bearerTokenSupplier() {
        return INSTANCE;
    }

    void reset(String nextToken) {
        token = nextToken;
        discards.set(0);
    }

    @Override
    public boolean authEnabled() {
        return true;
    }

    @Override
    public Optional<String> accessToken(HttpServletRequest request, HttpServletResponse response) {
        return Optional.ofNullable(token);
    }

    @Override
    public void discard(HttpServletRequest request, HttpServletResponse response) {
        discards.incrementAndGet();
    }
}
