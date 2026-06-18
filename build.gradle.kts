// orchard-ui multi-project root.
//
// This repo is a Gradle multi-project with two modules:
//   :frontend  — the Next.js static-export app (wrapped npm build)
//   :backend   — the Spring Boot service that serves the frontend and proxies /api/** to orchard core
//
// All real configuration lives in each module's build.gradle.kts. The root holds
// only the canonical version (gradle.properties) and the module includes (settings.gradle.kts).
