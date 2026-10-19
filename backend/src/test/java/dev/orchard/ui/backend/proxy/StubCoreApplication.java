package dev.orchard.ui.backend.proxy;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@SpringBootApplication
@RestController
@Profile("stub")
public class StubCoreApplication {

    public static final AtomicInteger HITS = new AtomicInteger();

    @Bean
    SecurityFilterChain permitAll(HttpSecurity http) {
        return http.authorizeHttpRequests(a -> a.anyRequest().permitAll())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(AbstractHttpConfigurer::disable)
            .build();
    }

    @GetMapping("/api/secure")
    ResponseEntity<String> secure() {
        HITS.incrementAndGet();
        return ResponseEntity.status(401).body("nope");
    }

    @GetMapping("/api/echo-header")
    String echoHeader(@RequestHeader("Authorization") String authorization) {
        HITS.incrementAndGet();
        return authorization;
    }

    @GetMapping("/api/echo-cookie")
    String echoCookie(@RequestHeader(value = "Cookie", defaultValue = "none") String cookie) {
        HITS.incrementAndGet();
        return cookie;
    }

    @GetMapping("/api/sets-cookie")
    String setsCookie(HttpServletResponse response) {
        HITS.incrementAndGet();
        response.addHeader("Set-Cookie", "core=1");
        return "ok";
    }

    @GetMapping(value = "/api/echo-header-sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter echoHeaderSse(@RequestHeader("Authorization") String authorization) {
        HITS.incrementAndGet();
        SseEmitter emitter = new SseEmitter(Duration.ofSeconds(30).toMillis());
        Thread.ofVirtual().start(() -> {
            try {
                emitter.send(SseEmitter.event().data(authorization));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    @GetMapping(value = "/api/groves/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter events() {
        SseEmitter emitter = new SseEmitter(Duration.ofSeconds(30).toMillis());
        Thread.ofVirtual().start(() -> {
            try {
                for (int i = 0; i < 5; i++) {
                    emitter.send(SseEmitter.event().name("grove-state-changed").data("tick-" + i));
                    Thread.sleep(200); // forces incremental delivery
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }
}
