package dev.orchard.ui.backend.security;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.convention.TestBean;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "orchard.fence.issuer-uri=http://fence.test")
class SessionCookieNameTest {

    @TestBean(methodName = "dev.orchard.ui.backend.security.TestFenceRegistrations#fenceRegistrations")
    FenceRegistrations fenceRegistrations;

    private final int port;

    SessionCookieNameTest(@LocalServerPort int port) {
        this.port = port;
    }

    @Test
    void sessionCookieIsNotJsessionid() throws Exception {
        HttpClient client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build();
        HttpResponse<Void> response = client.send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/oauth2/authorization/fence")).build(),
            HttpResponse.BodyHandlers.discarding());

        assertThat(response.statusCode()).isEqualTo(302);
        assertThat(response.headers().allValues("Set-Cookie"))
            .anyMatch(v -> v.startsWith("ORCHARD_UI_SESSION="))
            .noneMatch(v -> v.startsWith("JSESSIONID="));
    }
}
