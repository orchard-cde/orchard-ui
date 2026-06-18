package dev.orchard.ui.bff.proxy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class CoreClientConfig {

    @Bean
    RestClient coreRestClient(@Value("${orchard.core.base-url}") String coreBaseUrl) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        // null readTimeout = no timeout: SSE streams stay open indefinitely.
        // Duration.ZERO would mean 0ms (instant cancel) — not what we want.
        return RestClient.builder()
            .baseUrl(coreBaseUrl)
            .requestFactory(factory)
            .build();
    }
}
