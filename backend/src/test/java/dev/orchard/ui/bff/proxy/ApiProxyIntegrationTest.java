package dev.orchard.ui.bff.proxy;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = dev.orchard.ui.bff.BffApplication.class)
class ApiProxyIntegrationTest {

    static ConfigurableApplicationContext stubCore;
    static int stubPort;

    @LocalServerPort
    int bffPort;

    private final HttpClient client = HttpClient.newHttpClient();

    @BeforeAll
    static void startStubCore() {
        stubCore = new SpringApplicationBuilder(StubCoreApplication.class)
            .profiles("stub")
            .properties("server.port=0")
            .run("--server.port=0");
        stubPort = stubCore.getEnvironment()
            .getProperty("local.server.port", Integer.class);
    }

    @AfterAll
    static void stopStubCore() {
        if (stubCore != null) {
            stubCore.close();
        }
    }

    @DynamicPropertySource
    static void coreBaseUrl(DynamicPropertyRegistry registry) {
        registry.add("orchard.core.base-url", () -> "http://localhost:" + stubPort);
    }

    @Test
    void upstreamUnauthorizedStatusIsPassedThrough() throws Exception {
        var resp = client.send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + bffPort + "/api/secure")).GET().build(),
            HttpResponse.BodyHandlers.ofString());
        assertThat(resp.statusCode()).isEqualTo(401);
        assertThat(resp.body()).isEqualTo("nope");
    }

    @Test
    void customRequestHeaderIsForwarded() throws Exception {
        var resp = client.send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + bffPort + "/api/echo-header"))
                .header("X-Cultivator-Id", "cultivator-42").GET().build(),
            HttpResponse.BodyHandlers.ofString());
        assertThat(resp.statusCode()).isEqualTo(200);
        assertThat(resp.body()).isEqualTo("cultivator-42");
    }

    @Test
    void sseEventsArriveIncrementally() throws Exception {
        var resp = client.send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + bffPort + "/api/groves/abc/events"))
                .header("Accept", MediaType.TEXT_EVENT_STREAM_VALUE).GET().build(),
            HttpResponse.BodyHandlers.ofLines());

        assertThat(resp.statusCode()).isEqualTo(200);
        assertThat(resp.headers().firstValue("Content-Type").orElse(""))
            .contains(MediaType.TEXT_EVENT_STREAM_VALUE);

        // Record the arrival nanoTime of each data: line as the stream drains lazily.
        // ofLines() yields lines incrementally, so timestamps reflect real receipt order.
        List<Long> arrivalNanos = new ArrayList<>();
        try (Stream<String> lines = resp.body()) {
            lines.filter(l -> l.startsWith("data:"))
                 .forEach(l -> arrivalNanos.add(System.nanoTime()));
        }

        assertThat(arrivalNanos).hasSizeGreaterThanOrEqualTo(3);

        // A buffered proxy delivers all events at stream-close (~0 ms spread).
        // A streaming proxy delivers them incrementally (~800 ms spread for 5×200 ms stub).
        // Require >= 500 ms between first and last received event to prove incremental delivery.
        long spanMs = Duration.ofNanos(arrivalNanos.getLast() - arrivalNanos.getFirst()).toMillis();
        assertThat(spanMs)
            .as("first→last event span should be >= 500 ms for a streaming proxy (got %d ms)", spanMs)
            .isGreaterThanOrEqualTo(500);
    }
}
