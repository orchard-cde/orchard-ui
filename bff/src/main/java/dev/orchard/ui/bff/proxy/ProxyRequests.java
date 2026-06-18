package dev.orchard.ui.bff.proxy;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Shared proxy utilities.
 */
public final class ProxyRequests {

    private ProxyRequests() {}

    /**
     * Builds the absolute upstream URI for a proxied request: the configured base URL
     * (path prefix preserved) + the original request path + the original query string,
     * with NO URI-template interpretation of '{'/'}' (transparent proxy of the client's
     * already-encoded request target).
     */
    public static URI upstreamUri(String baseUrl, HttpServletRequest request) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String query = request.getQueryString();
        return URI.create(base + request.getRequestURI() + (query != null ? "?" + query : ""));
    }
}
