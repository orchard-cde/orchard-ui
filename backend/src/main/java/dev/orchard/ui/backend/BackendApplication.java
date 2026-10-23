package dev.orchard.ui.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import dev.orchard.ui.backend.security.FenceProperties;

@SpringBootApplication
@EnableConfigurationProperties(FenceProperties.class)
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
