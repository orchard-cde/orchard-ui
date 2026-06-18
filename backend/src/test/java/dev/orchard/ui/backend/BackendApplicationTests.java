package dev.orchard.ui.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BackendApplicationTests {

    @Value("${orchard.core.base-url}")
    String coreBaseUrl;

    @Test
    void contextLoads() {
        assertThat(coreBaseUrl).isEqualTo("http://localhost:8081");
    }
}
