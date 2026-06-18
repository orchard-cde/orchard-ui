package dev.orchard.ui.bff.web;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import static org.assertj.core.api.Assertions.assertThat;

class SpaResourceConfigTest {

    @TempDir
    static Path staticDir;

    static FileSystemResource location;

    @BeforeAll
    static void setup() throws IOException {
        Files.writeString(staticDir.resolve("index.html"), "<!doctype html><title>shell</title>");
        Files.writeString(staticDir.resolve("favicon.ico"), "icon-bytes");
        Files.createDirectories(staticDir.resolve("groves"));
        Files.writeString(staticDir.resolve("groves/index.html"), "<!doctype html><title>groves</title>");
        Files.createDirectories(staticDir.resolve("groves/_"));
        Files.writeString(staticDir.resolve("groves/_/index.html"), "<!doctype html><title>grove detail</title>");
        location = new FileSystemResource(staticDir.toFile().getPath() + "/");
    }

    private final SpaResourceConfig.SpaPathResourceResolver resolver =
        new SpaResourceConfig.SpaPathResourceResolver();

    @Test
    void clientRouteReturnsSpaShell() throws IOException {
        Resource result = resolver.getResource("groves/abc-123", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("index.html");
    }

    @Test
    void rootReturnsSpaShell() throws IOException {
        Resource result = resolver.getResource("", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("index.html");
    }

    @Test
    void existingAssetReturnedDirectly() throws IOException {
        Resource result = resolver.getResource("favicon.ico", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("favicon.ico");
    }

    @Test
    void missingDottedAssetReturnsNull() throws IOException {
        assertThat(resolver.getResource("_next/static/chunks/main.js", location)).isNull();
    }

    @Test
    void apiPrefixReturnsNull() throws IOException {
        assertThat(resolver.getResource("api/anything", location)).isNull();
    }

    @Test
    void actuatorPrefixReturnsNull() throws IOException {
        assertThat(resolver.getResource("actuator/health", location)).isNull();
    }

    @Test
    void wsPrefixReturnsNull() throws IOException {
        assertThat(resolver.getResource("ws/grove-events", location)).isNull();
    }

    @Test
    void grovesRouteWithTrailingSlashServesGrovesIndexHtml() throws IOException {
        Resource result = resolver.getResource("groves/", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("index.html");
        assertThat(result.getFile().getCanonicalPath()).contains("groves");
    }

    @Test
    void grovesRouteWithoutTrailingSlashServesGrovesIndexHtml() throws IOException {
        Resource result = resolver.getResource("groves", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("index.html");
        assertThat(result.getFile().getCanonicalPath()).contains("groves");
    }

    @Test
    void grovesDetailRouteServesDynamicPlaceholderShell() throws IOException {
        Resource result = resolver.getResource("groves/some-uuid-1234", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("index.html");
        assertThat(result.getFile().getCanonicalPath())
            .contains("groves" + java.io.File.separator + "_");
    }

    @Test
    void unknownDeepRouteWithNoPlaceholderFallsBackToRootShell() throws IOException {
        Resource result = resolver.getResource("unknown/child-route", location);
        assertThat(result).isNotNull();
        assertThat(result.getFilename()).isEqualTo("index.html");
        assertThat(result.getFile().getCanonicalPath()).doesNotContain("groves");
    }
}
