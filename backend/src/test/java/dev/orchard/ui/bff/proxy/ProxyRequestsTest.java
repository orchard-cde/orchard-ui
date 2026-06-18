package dev.orchard.ui.bff.proxy;

import java.net.URI;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ProxyRequestsTest {

    private static MockHttpServletRequest req(String requestUri, String queryString) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setRequestURI(requestUri);
        r.setQueryString(queryString);
        return r;
    }

    @Test
    void baseWithNoPathAndSimplePath() {
        URI result = ProxyRequests.upstreamUri("http://localhost:8081", req("/api/groves/abc", null));
        assertThat(result).isEqualTo(URI.create("http://localhost:8081/api/groves/abc"));
    }

    @Test
    void basePathPrefixIsPreserved() {
        // #3: a base URL with a path prefix must not be dropped
        URI result = ProxyRequests.upstreamUri("http://core-host/v2", req("/api/groves/abc", null));
        assertThat(result.toString()).isEqualTo("http://core-host/v2/api/groves/abc");
    }

    @Test
    void trailingSlashOnBaseIsNormalized() {
        URI result = ProxyRequests.upstreamUri("http://core-host/v2/", req("/api/x", null));
        assertThat(result.toString()).isEqualTo("http://core-host/v2/api/x");
    }

    @Test
    void encodedQueryIsPreservedWithoutDoubleEncoding() {
        // #1: already-encoded query string must not be re-encoded (%20 must not become %2520)
        URI result = ProxyRequests.upstreamUri("http://localhost:8081", req("/api/search", "q=hello%20world"));
        assertThat(result.toString()).contains("q=hello%20world");
        assertThat(result.toString()).doesNotContain("%2520");
    }

    @Test
    void nullQueryProducesNoTrailingQuestionMark() {
        URI result = ProxyRequests.upstreamUri("http://localhost:8081", req("/api/groves", null));
        assertThat(result.toString()).doesNotContain("?");
    }

    @Test
    void encodedBracesInQueryArePreservedVerbatim() {
        // Documents #1 fix intent: literal '%7B'/'}' in query survive without template expansion
        URI result = ProxyRequests.upstreamUri("http://localhost:8081", req("/api/search", "filter=%7Bstatus%7D"));
        assertThat(result.toString()).contains("filter=%7Bstatus%7D");
    }
}
