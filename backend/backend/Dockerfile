# ---------------------------------------------------------------------------
# Build stage - full JDK, Maven wrapper, no tests (CI/local already ran them)
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Dependencies first: this layer is rebuilt only when pom.xml changes, so most
# deploys skip re-downloading the whole dependency tree.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# A wrapper checked out with Windows line endings would fail as "bad interpreter".
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN ./mvnw -B -ntp dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -ntp clean package -DskipTests

# ---------------------------------------------------------------------------
# Runtime stage - JRE only (roughly half the size of the JDK image)
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app

# The Boot plugin leaves the runnable jar next to the plain one (*.jar.original),
# so this glob matches exactly one file.
COPY --from=build /app/target/*.jar app.jar

# Don't run as root.
RUN useradd --system --no-create-home --uid 10001 spring \
    && chown spring:spring app.jar
USER spring

ENV SPRING_PROFILES_ACTIVE=prod
# The host injects PORT; application-prod.properties reads it (server.port).
ENV PORT=8080
EXPOSE 8080

# MaxRAMPercentage rather than a fixed -Xmx: the JVM then sizes the heap from
# whatever the container is actually given (512 MB on Render's free plan).
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-XX:+UseSerialGC", "-jar", "app.jar"]
