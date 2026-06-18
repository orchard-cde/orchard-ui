plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.graalvm.buildtools.native") version "0.11.4"
}

group = "dev.orchard.ui"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.named<Test>("test") {
    useJUnitPlatform()
    jvmArgs("-XX:+EnableDynamicAgentLoading")
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("orchard-ui-bff")
            buildArgs.add("--no-fallback")
        }
    }
}

// Run the Next.js static export from the repo root (produces orchard-ui/out).
// outputs.dir is intentionally omitted so Gradle 9's implicit-dependency
// validator does not fire when processResources reads the out/ directory.
// (Cost: buildUi is not output-cached; it re-runs npm on each bootJar/nativeCompile.)
val buildUi by tasks.registering(Exec::class) {
    workingDir = rootDir.parentFile          // orchard-ui/
    commandLine("npm", "run", "build:bundle")
    inputs.dir("${rootDir.parentFile}/app")
    inputs.file("${rootDir.parentFile}/package.json")
}

// Copy the Next.js export onto the MAIN runtime classpath (build/resources/main/static/).
// mustRunAfter orders buildUi before processResources ONLY when buildUi is already in
// the task graph (bootJar / nativeCompile); it does NOT pull buildUi onto the test graph.
// Both bootJar and nativeCompile therefore embed the UI via the standard classpath.
tasks.named<ProcessResources>("processResources") {
    from("${rootDir.parentFile}/out") { into("static") }
    mustRunAfter("buildUi")
}

// Ensure the UI is built before packaging distributables.
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    dependsOn(buildUi)
}
tasks.named("bootRun") { dependsOn(buildUi) }
tasks.named("nativeCompile") { dependsOn(buildUi) }
