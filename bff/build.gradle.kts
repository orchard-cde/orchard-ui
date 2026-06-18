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
val buildUi by tasks.registering(Exec::class) {
    workingDir = rootDir.parentFile          // orchard-ui/
    commandLine("npm", "run", "build:bundle")
    inputs.dir("${rootDir.parentFile}/app")
    inputs.file("${rootDir.parentFile}/package.json")
    outputs.dir("${rootDir.parentFile}/out")
}

// Stage the Next.js export into an isolated build directory under static/.
// This task is only in the task graph for distributables (bootJar / nativeCompile);
// it is intentionally NOT wired into processResources so that `./gradlew test`
// never schedules an npm build.
val copyUiToClasspath by tasks.registering(Copy::class) {
    dependsOn(buildUi)
    from("${rootDir.parentFile}/out") { into("static") }
    into(layout.buildDirectory.dir("ui-classpath"))
}

// Wire the staged UI into the Spring Boot jar and the native image.
// Using `from` here satisfies Gradle 9's implicit-dependency validation:
// the declared input/output relationship is explicit, not inferred.
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    dependsOn(copyUiToClasspath)
    from(copyUiToClasspath.map { it.destinationDir }) {
        into("BOOT-INF/classes")
    }
}
tasks.named("nativeCompile") { dependsOn(copyUiToClasspath) }
