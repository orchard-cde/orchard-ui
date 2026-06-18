package dev.orchard.ui.backend.dev;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = dev.orchard.ui.backend.BackendApplication.class)
@ActiveProfiles("dev")
class DevUiProxyTest {

    static ConfigurableApplicationContext stubNext;
    static int nextPort;

    @LocalServerPort
    int backendPort;

    private final HttpClient client = HttpClient.newHttpClient();

    @BeforeAll
    static void startStubNext() {
        stubNext = new SpringApplicationBuilder(StubNextApp.class)
            .properties("server.port=0", "spring.config.name=stub-next")
            .run("--server.port=0");
        nextPort = stubNext.getEnvironment().getProperty("local.server.port", Integer.class);
    }

    @AfterAll
    static void stopStubNext() {
        if (stubNext != null) {
            stubNext.close();
        }
    }

    @DynamicPropertySource
    static void wire(DynamicPropertyRegistry registry) {
        registry.add("orchard.dev.next-url", () -> "http://localhost:" + nextPort);
        // core base-url is unused by this test but must resolve for the context to start
        registry.add("orchard.core.base-url", () -> "http://localhost:" + nextPort);
    }

    @Test
    void nonApiRouteIsProxiedToNextDev() throws Exception {
        var resp = client.send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + backendPort + "/groves")).GET().build(),
            HttpResponse.BodyHandlers.ofString());
        assertThat(resp.statusCode()).isEqualTo(200);
        assertThat(resp.body()).isEqualTo("next-dev-home");
    }

    @Test
    void actuatorHealthIsNotShadowedByProxy() throws Exception {
        var resp = client.send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + backendPort + "/actuator/health")).GET().build(),
            HttpResponse.BodyHandlers.ofString());
        assertThat(resp.statusCode()).isEqualTo(200);
        // Actuator health returns JSON with "status" key — not the stub next-dev response
        assertThat(resp.body()).contains("\"status\"");
        assertThat(resp.body()).doesNotContain("next-dev-home");
    }

    @SpringBootApplication
    @RestController
    static class StubNextApp {
        @GetMapping("/groves")
        String groves() {
            return "next-dev-home";
        }

        @GetMapping("/actuator/health")
        String actuatorHealth() {
            return "next-dev-home";
        }
    }
}
