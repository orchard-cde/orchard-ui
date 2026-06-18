package dev.orchard.ui.bff.proxy;

import java.time.Duration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@SpringBootApplication
@RestController
@Profile("stub")
public class StubCoreApplication {

    @GetMapping("/api/secure")
    ResponseEntity<String> secure() {
        return ResponseEntity.status(401).body("nope");
    }

    @GetMapping("/api/echo-header")
    String echoHeader(@RequestHeader("X-Cultivator-Id") String id) {
        return id;
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
