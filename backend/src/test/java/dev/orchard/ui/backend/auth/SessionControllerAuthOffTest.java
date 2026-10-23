package dev.orchard.ui.backend.auth;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SessionControllerAuthOffTest {

    private final int port;

    SessionControllerAuthOffTest(@LocalServerPort int port) {
        this.port = port;
    }

    @Test
    void reportsDisabledAndSetsNoCookies() throws Exception {
        HttpResponse<String> response = HttpClient.newHttpClient().send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/auth/session")).build(),
            HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("{\"enabled\":false,\"authenticated\":false}");
        assertThat(response.headers().allValues("Set-Cookie")).isEmpty();
    }

    @Test
    void logoutIsNotInterceptedByLoginRedirect() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        for (String method : new String[] {"GET", "POST"}) {
            HttpResponse<String> response = client.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/logout"))
                    .method(method, HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofString());

            assertThat(response.headers().firstValue("Location").orElse("")).doesNotContain("/login");
        }
    }
}
