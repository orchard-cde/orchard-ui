plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.graalvm.buildtools.native") version "1.1.3"
}

group = "dev.orchard.ui"

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
            imageName.set("orchard-ui-backend")
            buildArgs.add("--no-fallback")
        }
    }
}

// Embed the UI built by the :frontend module onto the main runtime classpath (static/).
// The explicit dependency on :frontend:npmBuild means every task that needs the UI
// (bootJar, nativeCompile, bootRun, and tests) builds the (cached) frontend first, and
// satisfies Gradle's strict producer/consumer validation when processResources reads out/.
val frontendOut = rootProject.layout.projectDirectory.dir("frontend/out")
tasks.named<ProcessResources>("processResources") {
    dependsOn(":frontend:npmBuild")
    from(frontendOut) { into("static") }
}
