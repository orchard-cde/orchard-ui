package dev.orchard.ui.backend.dev;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import dev.orchard.ui.backend.proxy.ProxyRequests;

/**
 * Dev-profile only: proxies all non-/api, non-/actuator routes to a running {@code next dev} so
 * HMR works. /api/** is still owned by
 * {@link dev.orchard.ui.backend.proxy.ApiProxyController}; the static SpaResourceConfig is
 * {@code @Profile("!dev")} and inactive here.
 */
@RestController
@Profile("dev")
public class DevUiProxyController {

    private final RestClient nextClient;
    private final String nextUrl;

    public DevUiProxyController(@Value("${orchard.dev.next-url}") String nextUrl) {
        this.nextUrl = nextUrl;
        this.nextClient = RestClient.builder()
            .requestFactory(new JdkClientHttpRequestFactory())
            .build();
    }

    // Everything except /api/** and /actuator/** (those are matched by more specific handlers).
    @RequestMapping("/**")
    public void proxyToNext(HttpServletRequest request, HttpServletResponse response) throws IOException {
        URI target = ProxyRequests.upstreamUri(nextUrl, request);

        nextClient.method(HttpMethod.valueOf(request.getMethod()))
            .uri(target)
            .exchange((req, res) -> {
                response.setStatus(res.getStatusCode().value());
                res.getHeaders().forEach((name, values) -> {
                    if (!name.equalsIgnoreCase("transfer-encoding") && !name.equalsIgnoreCase("content-length")) {
                        values.forEach(v -> response.addHeader(name, v));
                    }
                });
                try (InputStream in = res.getBody(); OutputStream out = response.getOutputStream()) {
                    in.transferTo(out);
                }
                return null;
            });
    }
}
