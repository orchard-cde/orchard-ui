package dev.orchard.ui.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {

    // Branches at runtime, not via @Conditional*: native AOT would freeze the mode at build time.
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, FenceProperties properties,
            FenceRegistrations registrations) throws Exception {
        if (properties.enabled()) {
            throw new IllegalStateException("orchard.fence auth-on mode is not implemented yet");
        }
        return http
            .authorizeHttpRequests(a -> a.anyRequest().permitAll())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }
}
