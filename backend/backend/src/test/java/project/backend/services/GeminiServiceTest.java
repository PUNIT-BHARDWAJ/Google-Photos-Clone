package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import project.backend.config.GeminiProperties;
import project.backend.dto.ImageAnalysis;
import project.backend.dto.PhotoSummary;
import project.backend.exception.GeminiException;
import project.backend.exception.GeminiException.Kind;

/** GeminiService against a local fake of the generateContent endpoint - no network, no key. */
class GeminiServiceTest {

    private record Reply(int status, String body) {
    }

    private HttpServer server;
    private final ConcurrentLinkedQueue<Reply> replies = new ConcurrentLinkedQueue<>();
    private final List<String> requestedPaths = new CopyOnWriteArrayList<>();
    private final List<String> requestBodies = new CopyOnWriteArrayList<>();
    private final List<String> apiKeys = new CopyOnWriteArrayList<>();

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            requestedPaths.add(exchange.getRequestURI().getPath());
            apiKeys.add(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            requestBodies.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            Reply reply = replies.poll();
            if (reply == null) {
                reply = new Reply(500, "{}");
            }
            byte[] body = reply.body().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(reply.status(), body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    private GeminiService service(String apiKey, int maxRetries) {
        GeminiProperties properties = new GeminiProperties(apiKey, "gemini-2.0-flash", "gemini-flash-latest",
                "http://127.0.0.1:" + server.getAddress().getPort() + "/v1beta", 60, 30, 0L, maxRetries);
        return new GeminiService(properties, new GeminiRateLimiter(60, System::currentTimeMillis),
                HttpClient.newHttpClient(), System::currentTimeMillis);
    }

    private static String candidate(String text) {
        String escaped = text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return "{\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"" + escaped + "\"}]}, \"finishReason\": \"STOP\"}]}";
    }

    @Test
    void analyzesAnImage() {
        replies.add(new Reply(200, candidate(
                "{\"caption\": \"A red car\", \"tags\": [\"Car\", \"red\"], \"sceneType\": \"vehicle\", \"dominantColors\": [\"red\"]}")));
        GeminiService gemini = service("test-key", 0);

        ImageAnalysis analysis = gemini.analyzeImage(new byte[] {1, 2, 3}, "image/jpeg");

        assertThat(analysis.caption()).isEqualTo("A red car");
        assertThat(analysis.tags()).containsExactly("car", "red");
        assertThat(requestedPaths).containsExactly("/v1beta/models/gemini-2.0-flash:generateContent");
        assertThat(apiKeys).containsExactly("test-key");
        assertThat(requestBodies.get(0))
                .contains("\"inline_data\"")
                .contains("\"data\":\"AQID\"")
                .contains("\"responseMimeType\":\"application/json\"");
        assertThat(gemini.status(false).status()).isEqualTo(GeminiService.ConnectionStatus.CONNECTED);
    }

    @Test
    void retriesARateLimitedRequest() {
        replies.add(new Reply(429, """
                {"error": {"code": 429, "status": "RESOURCE_EXHAUSTED",
                  "details": [{"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "0.1s"}]}}
                """));
        replies.add(new Reply(200, candidate("{\"caption\": \"Retried\", \"tags\": [\"ok\"]}")));
        GeminiService gemini = service("test-key", 2);

        ImageAnalysis analysis = gemini.analyzeImage(new byte[] {1}, "image/jpeg");

        assertThat(analysis.caption()).isEqualTo("Retried");
        assertThat(requestedPaths).hasSize(2);
    }

    @Test
    void givesUpOnRateLimitsAfterMaxRetries() {
        replies.add(new Reply(429, "{\"error\": {\"code\": 429}}"));
        GeminiService gemini = service("test-key", 0);

        assertThatThrownBy(() -> gemini.analyzeImage(new byte[] {1}, "image/jpeg"))
                .isInstanceOf(GeminiException.class)
                .extracting(ex -> ((GeminiException) ex).getKind())
                .isEqualTo(Kind.RATE_LIMITED);
        assertThat(gemini.status(false).status()).isEqualTo(GeminiService.ConnectionStatus.RATE_LIMITED);
    }

    @Test
    void reportsAnInvalidKeyWithoutRetrying() {
        replies.add(new Reply(400, """
                {"error": {"code": 400, "message": "API key not valid. Please pass a valid API key.",
                  "status": "INVALID_ARGUMENT", "details": [{"reason": "API_KEY_INVALID"}]}}
                """));
        GeminiService gemini = service("wrong-key", 3);

        assertThatThrownBy(() -> gemini.analyzeImage(new byte[] {1}, "image/jpeg"))
                .isInstanceOf(GeminiException.class)
                .hasMessageContaining("rejected the API key")
                .hasMessageNotContaining("wrong-key");
        assertThat(requestedPaths).hasSize(1);
        assertThat(gemini.status(false).status()).isEqualTo(GeminiService.ConnectionStatus.INVALID_KEY);
    }

    @Test
    void switchesToTheFallbackModelWhenTheConfiguredOneIsGone() {
        replies.add(new Reply(404, "{\"error\": {\"code\": 404, \"status\": \"NOT_FOUND\"}}"));
        replies.add(new Reply(200, candidate("{\"caption\": \"From the fallback\", \"tags\": [\"x\"]}")));
        GeminiService gemini = service("test-key", 0);

        assertThat(gemini.analyzeImage(new byte[] {1}, "image/jpeg").caption()).isEqualTo("From the fallback");
        assertThat(requestedPaths).containsExactly(
                "/v1beta/models/gemini-2.0-flash:generateContent",
                "/v1beta/models/gemini-flash-latest:generateContent");
        assertThat(gemini.status(false).model()).isEqualTo("gemini-flash-latest");
    }

    @Test
    void ranksPhotosUsingOnlyTheirText() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        replies.add(new Reply(200, candidate("{\"ranking\": [2]}")));
        GeminiService gemini = service("test-key", 0);

        List<UUID> ranked = gemini.searchByDescription("dog playing in the snow", List.of(
                new PhotoSummary(first, "A cat on a sofa", List.of("cat"), "indoor"),
                new PhotoSummary(second, "A dog running through snow", List.of("dog", "snow"), "outdoor")));

        assertThat(ranked).containsExactly(second);
        assertThat(requestBodies.get(0)).doesNotContain("inline_data").contains("A dog running through snow");
    }

    @Test
    void nothingIsSentWithoutAKey() {
        GeminiService gemini = service("placeholder", 0);

        assertThat(gemini.isConfigured()).isFalse();
        assertThatThrownBy(() -> gemini.analyzeImage(new byte[] {1}, "image/jpeg"))
                .isInstanceOf(GeminiException.class)
                .extracting(ex -> ((GeminiException) ex).getKind())
                .isEqualTo(Kind.NOT_CONFIGURED);
        assertThat(gemini.status(true).status()).isEqualTo(GeminiService.ConnectionStatus.NOT_CONFIGURED);
        assertThat(requestedPaths).isEmpty();
    }

    @Test
    void blockedResponsesExplainWhy() {
        replies.add(new Reply(200, "{\"promptFeedback\": {\"blockReason\": \"SAFETY\"}}"));
        GeminiService gemini = service("test-key", 0);

        assertThatThrownBy(() -> gemini.analyzeImage(new byte[] {1}, "image/jpeg"))
                .isInstanceOf(GeminiException.class)
                .hasMessageContaining("declined")
                .hasMessageContaining("safety");
    }
}
