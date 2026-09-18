package project.backend.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Two startup conveniences for hosted deployments, run before anything tries to
 * open a connection or read a secret.
 *
 * <p>First, DATABASE_URL is accepted in either shape. Neon (and Heroku, Railway,
 * Supabase…) hand out a libpq URI - {@code postgresql://user:pass@host/db?sslmode=require}
 * - which the PostgreSQL JDBC driver rejects outright ("Driver claims to not
 * accept jdbcUrl"). It is rewritten here into a JDBC URL with the credentials
 * split out, so either form works and nobody has to hand-edit a connection
 * string in a dashboard.
 *
 * <p>Second, the configuration a deployment needs is checked and anything
 * missing is named in the log. It only warns: a developer running locally
 * without, say, an ImageKit key should still get a booting app, and on a host
 * the log then says exactly which variable to add rather than failing with a
 * stack trace 40 lines deep.
 *
 * <p>Registered in {@code BackendApplication.main} rather than through
 * {@code spring.factories}, so the wiring is visible where the app starts.
 */
public class DeploymentEnvironmentListener
        implements ApplicationListener<ApplicationEnvironmentPreparedEvent>, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DeploymentEnvironmentListener.class);

    private static final String PROPERTY_SOURCE_NAME = "normalizedDatabaseUrl";

    /** Values that mean "nobody filled this in yet". */
    private static final List<String> PLACEHOLDERS = List.of("placeholder", "changeme", "your_", "your-");

    private record RequiredSetting(String property, String envVar, String purpose) {
    }

    private static final List<RequiredSetting> REQUIRED = List.of(
            new RequiredSetting("spring.datasource.url", "DATABASE_URL", "database connection"),
            new RequiredSetting("app.jwt.secret", "JWT_SECRET", "signing access tokens"),
            new RequiredSetting("imagekit.public-key", "IMAGEKIT_PUBLIC_KEY", "photo storage"),
            new RequiredSetting("imagekit.private-key", "IMAGEKIT_PRIVATE_KEY", "photo storage"),
            new RequiredSetting("imagekit.url-endpoint", "IMAGEKIT_URL_ENDPOINT", "photo delivery"),
            new RequiredSetting("spring.security.oauth2.client.registration.google.client-id",
                    "GOOGLE_CLIENT_ID", "\"Continue with Google\""),
            new RequiredSetting("spring.security.oauth2.client.registration.google.client-secret",
                    "GOOGLE_CLIENT_SECRET", "\"Continue with Google\""));

    @Override
    public int getOrder() {
        // After the config data processors, so application-*.properties and any
        // imported local file have already been folded into the environment.
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment environment = event.getEnvironment();
        normalizeDatabaseUrl(environment);
        reportMissingSettings(environment);
    }

    private void normalizeDatabaseUrl(ConfigurableEnvironment environment) {
        String raw = resolve(environment, "DATABASE_URL");
        if (raw == null || raw.isBlank() || raw.startsWith("jdbc:")) {
            return;
        }

        DatabaseUrl parsed;
        try {
            parsed = parseUri(raw);
        } catch (RuntimeException ex) {
            log.warn("DATABASE_URL could not be parsed ({}). Expected either "
                    + "postgresql://user:password@host/database or jdbc:postgresql://host/database", ex.getMessage());
            return;
        }
        if (parsed == null) {
            return;
        }

        Map<String, Object> properties = new HashMap<>();
        properties.put("spring.datasource.url", parsed.jdbcUrl());
        if (parsed.username() != null) {
            properties.put("spring.datasource.username", parsed.username());
        }
        if (parsed.password() != null) {
            properties.put("spring.datasource.password", parsed.password());
        }
        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        // The URL only - never the credentials that came with it.
        log.info("Using database {}", parsed.jdbcUrl());
    }

    private void reportMissingSettings(ConfigurableEnvironment environment) {
        List<String> missing = new ArrayList<>();
        for (RequiredSetting setting : REQUIRED) {
            if (isBlankOrPlaceholder(resolve(environment, setting.property()))) {
                missing.add("  %s (%s) - needed for %s"
                        .formatted(setting.envVar(), setting.property(), setting.purpose()));
            }
        }

        if (!missing.isEmpty()) {
            log.warn("Configuration missing - these features will not work until the variables are set:{}{}",
                    System.lineSeparator(), String.join(System.lineSeparator(), missing));
        }

        if (isBlankOrPlaceholder(resolve(environment, "gemini.api-key"))) {
            log.info("GEMINI_API_KEY is not set - AI features report \"not configured\" and everything else works.");
        }
    }

    /** Reads a property, treating an unresolvable ${PLACEHOLDER} as "not set". */
    private static String resolve(ConfigurableEnvironment environment, String key) {
        try {
            return environment.getProperty(key);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    static boolean isBlankOrPlaceholder(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String lower = value.toLowerCase();
        return PLACEHOLDERS.stream().anyMatch(lower::startsWith);
    }

    record DatabaseUrl(String jdbcUrl, String username, String password) {
    }

    /**
     * {@code postgresql://user:pass@host:5432/db?sslmode=require} becomes
     * {@code jdbc:postgresql://host:5432/db?sslmode=require} plus the credentials.
     * Anything that isn't a postgres URI is left alone (returns null).
     */
    static DatabaseUrl parseUri(String value) {
        String trimmed = value.trim();
        if (!trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) {
            return null;
        }

        URI uri = URI.create(trimmed);
        String username = null;
        String password = null;
        String userInfo = uri.getUserInfo();
        if (userInfo != null && !userInfo.isBlank()) {
            int separator = userInfo.indexOf(':');
            username = decode(separator < 0 ? userInfo : userInfo.substring(0, separator));
            password = separator < 0 ? null : decode(userInfo.substring(separator + 1));
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(uri.getHost());
        if (uri.getPort() != -1) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        String path = uri.getPath();
        jdbcUrl.append(path == null || path.isBlank() ? "/" : path);

        String query = uri.getRawQuery();
        // Managed Postgres (Neon included) refuses plaintext connections, and a
        // URI that omits sslmode would otherwise fall back to one.
        boolean needsSsl = !"localhost".equals(uri.getHost()) && !"127.0.0.1".equals(uri.getHost());
        if (query == null || query.isBlank()) {
            if (needsSsl) {
                jdbcUrl.append("?sslmode=require");
            }
        } else {
            jdbcUrl.append('?').append(query);
            if (needsSsl && !query.contains("sslmode=")) {
                jdbcUrl.append("&sslmode=require");
            }
        }

        return new DatabaseUrl(jdbcUrl.toString(), username, password);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
