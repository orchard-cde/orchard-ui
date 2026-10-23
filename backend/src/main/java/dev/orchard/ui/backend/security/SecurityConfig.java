package dev.orchard.ui.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

@Configuration
class SecurityConfig {

    private static final String API = "/api/**";

    @Bean
    OAuth2AuthorizedClientRepository authorizedClientRepository() {
        return new HttpSessionOAuth2AuthorizedClientRepository();
    }

    @Bean
    FenceBearerTokenSupplier fenceBearerTokenSupplier(FenceProperties properties, FenceRegistrations registrations,
            OAuth2AuthorizedClientRepository authorizedClients) {
        OAuth2AuthorizedClientManager manager =
            properties.enabled() ? authorizedClientManager(registrations, authorizedClients) : null;
        return new FenceBearerTokenSupplier(properties, manager, authorizedClients);
    }

    private static OAuth2AuthorizedClientManager authorizedClientManager(FenceRegistrations registrations,
            OAuth2AuthorizedClientRepository authorizedClients) {
        DefaultOAuth2AuthorizedClientManager manager = new DefaultOAuth2AuthorizedClientManager(
            new InMemoryClientRegistrationRepository(registrations.fence().orElseThrow()), authorizedClients);
        manager.setAuthorizedClientProvider(OAuth2AuthorizedClientProviderBuilder.builder()
            .authorizationCode()
            .refreshToken()
            .build());
        return manager;
    }

    // Branches at runtime, not via @Conditional*: native AOT would freeze the mode at build time.
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, FenceProperties properties,
            FenceRegistrations registrations, OAuth2AuthorizedClientRepository authorizedClients) throws Exception {
        if (properties.enabled()) {
            return authOn(http, registrations, authorizedClients);
        }
        return http
            .authorizeHttpRequests(a -> a.anyRequest().permitAll())
            .csrf(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .headers(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }

    private SecurityFilterChain authOn(HttpSecurity http, FenceRegistrations registrations,
            OAuth2AuthorizedClientRepository authorizedClients) throws Exception {
        ClientRegistrationRepository repository =
            new InMemoryClientRegistrationRepository(registrations.fence().orElseThrow());
        OidcClientInitiatedLogoutSuccessHandler logoutHandler = new OidcClientInitiatedLogoutSuccessHandler(repository);
        logoutHandler.setPostLogoutRedirectUri("{baseUrl}/");
        return http
            .authorizeHttpRequests(a -> a.requestMatchers(API).authenticated().anyRequest().permitAll())
            .exceptionHandling(e -> e.defaultAuthenticationEntryPointFor(
                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), PathPatternRequestMatcher.withDefaults().matcher(API)))
            .oauth2Login(l -> l.loginPage("/signin").failureUrl("/signin?error")
                .clientRegistrationRepository(repository).authorizedClientRepository(authorizedClients))
            .csrf(c -> c
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .logout(l -> l.logoutSuccessHandler(logoutHandler))
            .build();
    }
}
