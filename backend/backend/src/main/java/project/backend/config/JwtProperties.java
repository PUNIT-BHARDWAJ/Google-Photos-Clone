package project.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
    String secret,
    long accessExpirationMs,
    long refreshExpirationMs
 ) {
}