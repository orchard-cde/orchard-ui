package dev.orchard.ui.bff.web;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the bundled orchard-ui static export (classpath:/static/) with SPA fallback.
 * Ported from orchard trellis SpaResourceConfig (issue #9) so the Next static-export routing
 * knowledge lives next to the UI build instead of in the app server.
 *
 * <p>Resolution order (see {@link SpaPathResourceResolver}):
 *   - null (-> 404) for api/actuator/ws prefixes and for missing dotted asset paths,
 *   - the real file for extension-bearing paths (/_next/..., /favicon.ico),
 *   - the prerendered per-route {@code <route>/index.html} (e.g. groves/index.html),
 *   - the dynamic-route placeholder {@code <parent>/_/index.html} (e.g. groves/_/index.html),
 *   - the root index.html SPA shell as last resort.
 *
 * <p>Extensionless paths are NEVER served as raw directory resources: in the GraalVM native
 * image, classpath directories report {@code isReadable()==true} and Spring would serve them as
 * application/octet-stream. Disabled under the {@code dev} profile (next dev serves the UI then).
 */
@Configuration
@Profile("!dev")
public class SpaResourceConfig implements WebMvcConfigurer {

    private static final String STATIC_LOCATION = "classpath:/static/";

    /** Next.js dynamic-route placeholder dir (this app's generateStaticParams emits a single "_"). */
    private static final String DYNAMIC_ROUTE_PLACEHOLDER = "_";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
            .addResourceLocations(STATIC_LOCATION)
            .resourceChain(true)
            .addResolver(new SpaPathResourceResolver());
    }

    /** Resolver: real file, else SPA shell for client routes, else null (404). */
    static class SpaPathResourceResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            if (isExcludedPrefix(resourcePath)) {
                return null;
            }
            if (hasExtension(resourcePath)) {
                return super.getResource(resourcePath, location);
            }
            String route = stripTrailingSlashes(resourcePath);
            if (!route.isEmpty()) {
                Resource routeIndex = super.getResource(route + "/index.html", location);
                if (routeIndex != null) {
                    return routeIndex;
                }
                int lastSlash = route.lastIndexOf('/');
                if (lastSlash >= 0) {
                    String placeholderIndex =
                        route.substring(0, lastSlash) + "/" + DYNAMIC_ROUTE_PLACEHOLDER + "/index.html";
                    Resource dynamicIndex = super.getResource(placeholderIndex, location);
                    if (dynamicIndex != null) {
                        return dynamicIndex;
                    }
                }
            }
            return super.getResource("index.html", location);
        }

        private String stripTrailingSlashes(String path) {
            int end = path.length();
            while (end > 0 && path.charAt(end - 1) == '/') {
                end--;
            }
            return path.substring(0, end);
        }

        private boolean isExcludedPrefix(String path) {
            return path.equals("api") || path.startsWith("api/")
                || path.equals("actuator") || path.startsWith("actuator/")
                || path.equals("ws") || path.startsWith("ws/");
        }

        private boolean hasExtension(String path) {
            int slash = path.lastIndexOf('/');
            String last = path.substring(slash + 1);
            return last.contains(".");
        }
    }
}
