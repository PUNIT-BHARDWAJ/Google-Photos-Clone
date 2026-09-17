package project.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
        String apiKey,
        String model,
        String fallbackModel,
        String baseUrl,
        Integer requestsPerMinute,
        Integer timeoutSeconds,
        Long bulkDelayMs,
        Integer maxRetries
) {
    public GeminiProperties {
        if (model == null || model.isBlank()) {
            model = "gemini-flash-latest";
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        }
        baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (requestsPerMinute == null || requestsPerMinute <= 0) {
            requestsPerMinute = 15;
        }
        if (timeoutSeconds == null || timeoutSeconds <= 0) {
            timeoutSeconds = 30;
        }
        if (bulkDelayMs == null || bulkDelayMs < 0) {
            bulkDelayMs = 4000L;
        }
        if (maxRetries == null || maxRetries < 0) {
            maxRetries = 3;
        }
    }

    // The committed default is the literal "placeholder" - and an unresolved
    // ${...} reference binds as its own text rather than failing startup - so
    // neither counts as a key.
    public boolean isConfigured() {
        return apiKey != null
                && !apiKey.isBlank()
                && !apiKey.trim().equalsIgnoreCase("placeholder")
                && !apiKey.startsWith("${");
    }

    public boolean hasFallbackModel() {
        return fallbackModel != null && !fallbackModel.isBlank() && !fallbackModel.equals(model);
    }
}
