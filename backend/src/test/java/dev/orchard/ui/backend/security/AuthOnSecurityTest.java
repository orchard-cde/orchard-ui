package dev.orchard.ui.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "orchard.fence.issuer-uri=http://fence.test")
@AutoConfigureMockMvc
class AuthOnSecurityTest {

    @TestBean(methodName = "dev.orchard.ui.backend.security.TestFenceRegistrations#fenceRegistrations")
    FenceRegistrations fenceRegistrations;

    private final MockMvc mvc;

    AuthOnSecurityTest(MockMvc mvc) {
        this.mvc = mvc;
    }

    @Test
    void apiWithoutSessionIs401() throws Exception {
        mvc.perform(get("/api/groves"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().doesNotExist(HttpHeaders.LOCATION));
    }

    @Test
    void sseWithoutSessionIs401() throws Exception {
        mvc.perform(get("/api/groves/g/events").accept(MediaType.TEXT_EVENT_STREAM))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void sessionReportsSignedOut() throws Exception {
        mvc.perform(get("/auth/session"))
            .andExpect(status().isOk())
            .andExpect(content().string("{\"enabled\":true,\"authenticated\":false}"))
            .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    void sessionReportsSignedIn() throws Exception {
        mvc.perform(get("/auth/session").with(oidcLogin().clientRegistration(TestFenceRegistrations.FENCE)))
            .andExpect(content().string("{\"enabled\":true,\"authenticated\":true}"));
    }

    @Test
    void signInEndpointRedirectsToFence() throws Exception {
        MvcResult result = mvc.perform(get("/oauth2/authorization/fence"))
            .andExpect(status().isFound())
            .andReturn();
        String location = result.getResponse().getHeader(HttpHeaders.LOCATION);
        assertThat(location).startsWith("http://fence.test/oauth2/authorize?").contains("code_challenge");
    }

    @Test
    void staleCallbackGoesToSigninError() throws Exception {
        mvc.perform(get("/login/oauth2/code/fence").param("code", "x").param("state", "bogus"))
            .andExpect(status().isFound())
            .andExpect(redirectedUrl("/signin?error"));
    }

    @Test
    void postWithoutCsrfIs403() throws Exception {
        mvc.perform(post("/api/groves").with(oidcLogin().clientRegistration(TestFenceRegistrations.FENCE)))
            .andExpect(status().isForbidden());
    }

    @Test
    void postWithHeaderCsrfPassesCsrfThenRejectsMissingToken() throws Exception {
        mvc.perform(post("/api/groves")
                .with(oidcLogin().clientRegistration(TestFenceRegistrations.FENCE))
                .cookie(new Cookie("XSRF-TOKEN", "t"))
                .header("X-XSRF-TOKEN", "t"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutWithoutCsrfIs403() throws Exception {
        mvc.perform(post("/logout"))
            .andExpect(status().isForbidden());
    }

    @Test
    void logoutWithoutSessionRedirectsHome() throws Exception {
        mvc.perform(post("/logout").cookie(new Cookie("XSRF-TOKEN", "t")).param("_csrf", "t"))
            .andExpect(status().isFound())
            .andExpect(redirectedUrl("/"));
    }

    @Test
    void logoutWithSessionGoesToFenceEndSession() throws Exception {
        MvcResult result = mvc.perform(post("/logout")
                .with(oidcLogin().clientRegistration(TestFenceRegistrations.FENCE).idToken(t -> t.subject("user")))
                .cookie(new Cookie("XSRF-TOKEN", "t")).param("_csrf", "t"))
            .andExpect(status().isFound())
            .andReturn();
        assertThat(result.getResponse().getHeader(HttpHeaders.LOCATION))
            .startsWith("http://fence.test/connect/logout?")
            .contains("post_logout_redirect_uri=");
    }
}
