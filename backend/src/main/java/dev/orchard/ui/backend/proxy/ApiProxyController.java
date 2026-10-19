package dev.orchard.ui.backend.proxy;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.util.List;
import java.util.Set;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

/**
 * Reverse-proxies every method on /api/** to orchard core, streaming the response so SSE
 * (text/event-stream) is delivered incrementally. Request headers (incl. Authorization) and
 * the response status are passed through; hop-by-hop headers are dropped (spec D4). With auth on,
 * browser Authorization/Cookie and upstream Set-Cookie are dropped and the session's bearer is attached.
 */
@RestController
public class ApiProxyController {

    // Hop-by-hop + framing headers we must not copy across the proxy boundary.
    private static final Set<String> SKIP_REQUEST_HEADERS =
        Set.of("host", "content-length", "connection", "keep-alive", "transfer-encoding",
            "proxy-authenticate", "proxy-authorization", "te", "trailer", "upgrade");
    private static final Set<String> SKIP_RESPONSE_HEADERS =
        Set.of("content-length", "connection", "keep-alive", "transfer-encoding",
            "proxy-authenticate", "proxy-authorization", "te", "trailer", "upgrade");

    private static final Set<String> SESSION_REQUEST_HEADERS = Set.of("authorization", "cookie");

    private final RestClient coreRestClient;
    private final String coreBaseUrl;
    private final BearerTokenSupplier tokens;

    public ApiProxyController(RestClient coreRestClient,
                              @Value("${orchard.core.base-url}") String coreBaseUrl,
                              ObjectProvider<BearerTokenSupplier> tokens) {
        this.coreRestClient = coreRestClient;
        this.coreBaseUrl = coreBaseUrl;
        this.tokens = tokens.getIfAvailable(() -> BearerTokenSupplier.NONE);
    }

    @RequestMapping("/api/**")
    public void proxy(HttpServletRequest request, HttpServletResponse response) throws IOException {
        boolean authOn = tokens.authEnabled();
        String bearer = null;
        if (authOn) {
            bearer = tokens.accessToken(request, response).orElse(null);
            if (bearer == null) {
                tokens.discard(request, response);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        String authorization = bearer == null ? null : "Bearer " + bearer;

        URI target = ProxyRequests.upstreamUri(coreBaseUrl, request);

        byte[] body = StreamUtils.copyToByteArray(request.getInputStream());

        RestClient.RequestBodySpec spec = coreRestClient
            .method(HttpMethod.valueOf(request.getMethod()))
            .uri(target)
            .headers(h -> copyRequestHeaders(request, h, authOn, authorization));
        if (body.length > 0) {
            spec.body(body);
        }

        spec.exchange((clientRequest, clientResponse) -> {
            int status = clientResponse.getStatusCode().value();
            if (authOn && status == HttpServletResponse.SC_UNAUTHORIZED) {
                tokens.discard(request, response);
            }
            response.setStatus(status);
            copyResponseHeaders(clientResponse.getHeaders(), response, authOn);
            try (InputStream in = clientResponse.getBody();
                 OutputStream out = response.getOutputStream()) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) != -1) {
                    out.write(buf, 0, n);
                    out.flush(); // flush each chunk so SSE is not buffered
                }
            }
            return null;
        });
    }

    private void copyRequestHeaders(HttpServletRequest request, HttpHeaders out, boolean authOn,
                                    String authorization) {
        var names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            String lower = name.toLowerCase();
            if (SKIP_REQUEST_HEADERS.contains(lower) || (authOn && SESSION_REQUEST_HEADERS.contains(lower))) {
                continue;
            }
            out.addAll(name, List.of(java.util.Collections.list(request.getHeaders(name)).toArray(String[]::new)));
        }
        if (authorization != null) {
            out.set(HttpHeaders.AUTHORIZATION, authorization);
        }
    }

    private void copyResponseHeaders(HttpHeaders upstream, HttpServletResponse response, boolean authOn) {
        upstream.forEach((name, values) -> {
            String lower = name.toLowerCase();
            if (SKIP_RESPONSE_HEADERS.contains(lower) || (authOn && lower.equals("set-cookie"))) {
                return;
            }
            for (String value : values) {
                response.addHeader(name, value);
            }
        });
    }
}
