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

// Copy the export onto the classpath under static/. Distributables depend on a fresh build;
// tests/dev rely on whatever out/ exists (kept fast — no implicit npm on every test run).
tasks.named<ProcessResources>("processResources") {
    from("${rootDir.parentFile}/out") { into("static") }
}
tasks.named("bootJar") { dependsOn(buildUi) }
tasks.named("nativeCompile") { dependsOn(buildUi) }
