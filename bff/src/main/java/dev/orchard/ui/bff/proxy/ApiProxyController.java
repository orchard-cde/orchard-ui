package dev.orchard.ui.bff.proxy;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.util.List;
import java.util.Set;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Reverse-proxies every method on /api/** to orchard core, streaming the response so SSE
 * (text/event-stream) is delivered incrementally. Request headers (incl. X-Cultivator-Id) and
 * the response status are passed through; hop-by-hop headers are dropped (spec D4).
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

    private final RestClient coreRestClient;

    public ApiProxyController(RestClient coreRestClient) {
        this.coreRestClient = coreRestClient;
    }

    @RequestMapping("/api/**")
    public void proxy(HttpServletRequest request, HttpServletResponse response) throws IOException {
        URI target = UriComponentsBuilder.fromUriString(request.getRequestURI())
            .query(request.getQueryString())
            .build(true)
            .toUri();

        byte[] body = StreamUtils.copyToByteArray(request.getInputStream());

        RestClient.RequestBodySpec spec = coreRestClient
            .method(HttpMethod.valueOf(request.getMethod()))
            .uri(target)
            .headers(h -> copyRequestHeaders(request, h));
        if (body.length > 0) {
            spec.body(body);
        }

        spec.exchange((clientRequest, clientResponse) -> {
            response.setStatus(clientResponse.getStatusCode().value());
            copyResponseHeaders(clientResponse.getHeaders(), response);
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

    private void copyRequestHeaders(HttpServletRequest request, HttpHeaders out) {
        var names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            if (SKIP_REQUEST_HEADERS.contains(name.toLowerCase())) {
                continue;
            }
            out.addAll(name, List.of(java.util.Collections.list(request.getHeaders(name)).toArray(String[]::new)));
        }
    }

    private void copyResponseHeaders(HttpHeaders upstream, HttpServletResponse response) {
        upstream.forEach((name, values) -> {
            if (SKIP_RESPONSE_HEADERS.contains(name.toLowerCase())) {
                return;
            }
            for (String value : values) {
                response.addHeader(name, value);
            }
        });
    }
}
