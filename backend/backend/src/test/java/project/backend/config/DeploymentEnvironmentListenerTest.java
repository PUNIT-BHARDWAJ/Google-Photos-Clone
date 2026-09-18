package project.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import project.backend.config.DeploymentEnvironmentListener.DatabaseUrl;

class DeploymentEnvironmentListenerTest {

    @Test
    @DisplayName("a Neon connection string becomes a JDBC URL with the credentials split out")
    void convertsNeonUri() {
        DatabaseUrl parsed = DeploymentEnvironmentListener.parseUri(
                "postgresql://alex:s3cret@ep-cool-lab-123.us-east-2.aws.neon.tech/neondb?sslmode=require");

        assertThat(parsed.jdbcUrl())
                .isEqualTo("jdbc:postgresql://ep-cool-lab-123.us-east-2.aws.neon.tech/neondb?sslmode=require");
        assertThat(parsed.username()).isEqualTo("alex");
        assertThat(parsed.password()).isEqualTo("s3cret");
    }

    @Test
    @DisplayName("SSL is required even when the URL doesn't ask for it")
    void addsSslModeWhenMissing() {
        DatabaseUrl parsed = DeploymentEnvironmentListener.parseUri("postgres://user:pw@db.example.com:5433/photos");

        assertThat(parsed.jdbcUrl()).isEqualTo("jdbc:postgresql://db.example.com:5433/photos?sslmode=require");
    }

    @Test
    @DisplayName("existing query parameters are kept")
    void keepsOtherQueryParameters() {
        DatabaseUrl parsed = DeploymentEnvironmentListener.parseUri(
                "postgresql://user:pw@ep-x.neon.tech/neondb?sslmode=require&channel_binding=require");

        assertThat(parsed.jdbcUrl())
                .isEqualTo("jdbc:postgresql://ep-x.neon.tech/neondb?sslmode=require&channel_binding=require");
    }

    @Test
    @DisplayName("a local database is left unencrypted")
    void doesNotForceSslOnLocalhost() {
        DatabaseUrl parsed = DeploymentEnvironmentListener.parseUri("postgresql://postgres:postgres@localhost:5432/app");

        assertThat(parsed.jdbcUrl()).isEqualTo("jdbc:postgresql://localhost:5432/app");
        assertThat(parsed.username()).isEqualTo("postgres");
    }

    @Test
    @DisplayName("percent-encoded credentials are decoded")
    void decodesEscapedCredentials() {
        DatabaseUrl parsed = DeploymentEnvironmentListener.parseUri("postgresql://us%40er:p%40ss%3Aword@host/db");

        assertThat(parsed.username()).isEqualTo("us@er");
        assertThat(parsed.password()).isEqualTo("p@ss:word");
    }

    @Test
    @DisplayName("a JDBC URL is already usable and left alone")
    void ignoresJdbcUrls() {
        assertThat(DeploymentEnvironmentListener.parseUri("jdbc:postgresql://host/db")).isNull();
    }

    @Test
    @DisplayName("unfilled configuration is spotted, real values are not")
    void detectsPlaceholders() {
        assertThat(DeploymentEnvironmentListener.isBlankOrPlaceholder(null)).isTrue();
        assertThat(DeploymentEnvironmentListener.isBlankOrPlaceholder("   ")).isTrue();
        assertThat(DeploymentEnvironmentListener.isBlankOrPlaceholder("placeholder")).isTrue();
        assertThat(DeploymentEnvironmentListener.isBlankOrPlaceholder("your_public_key")).isTrue();
        assertThat(DeploymentEnvironmentListener.isBlankOrPlaceholder("public_aBcD1234")).isFalse();
    }
}
