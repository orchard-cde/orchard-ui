// :frontend — the Next.js static-export app, wrapped as a Gradle module.
//
// The npm build is the source of truth; Gradle orchestrates and tracks inputs/outputs
// so the build is cached (no redundant `next build`) and :backend can depend on its output.
plugins {
    base
}

// `npm ci` — reproducible install from package-lock.json.
val npmInstall by tasks.registering(Exec::class) {
    description = "Installs npm dependencies (npm ci)."
    inputs.file("package.json")
    inputs.file("package-lock.json")
    outputs.dir("node_modules")
    commandLine("npm", "ci")
}

// `next build` static export -> frontend/out. Declared inputs/outputs give up-to-date checking.
val npmBuild by tasks.registering(Exec::class) {
    description = "Builds the Next.js static export into frontend/out."
    dependsOn(npmInstall)
    // Relative-URL contract: empty base so the browser emits relative /api/** URLs.
    environment("NEXT_PUBLIC_API_URL", "")
    inputs.dir("app")
    inputs.dir("components")
    inputs.dir("lib")
    inputs.dir("types")
    inputs.files("package.json", "package-lock.json", "next.config.ts", "tsconfig.json")
    outputs.dir("out")
    commandLine("npm", "run", "build:bundle")
}

// Jest tests.
val npmTest by tasks.registering(Exec::class) {
    description = "Runs the frontend test suite (jest)."
    dependsOn(npmInstall)
    inputs.dir("app")
    inputs.dir("components")
    inputs.dir("lib")
    inputs.dir("types")
    inputs.files("package.json", "package-lock.json", "jest.config.ts", "jest.setup.ts")
    commandLine("npm", "test")
}

// Wire into the standard lifecycle so `./gradlew build` builds and tests the frontend.
tasks.named("assemble") { dependsOn(npmBuild) }
tasks.named("check") { dependsOn(npmTest) }
