package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import project.backend.dto.EditSuggestion;
import project.backend.dto.ImageAnalysis;
import project.backend.exception.GeminiException;

class GeminiResponseParserTest {

    @Test
    void parsesAWellFormedAnalysis() {
        ImageAnalysis analysis = GeminiResponseParser.parseAnalysis("""
                {"caption": "A golden retriever playing fetch on a sunny beach",
                 "tags": ["Dog", "beach", "ocean", "golden retriever", "sunny"],
                 "sceneType": "outdoor",
                 "dominantColors": ["blue", "gold", "white"]}
                """);

        assertThat(analysis.caption()).isEqualTo("A golden retriever playing fetch on a sunny beach");
        assertThat(analysis.tags()).containsExactly("beach", "dog", "golden retriever", "ocean", "sunny");
        assertThat(analysis.sceneType()).isEqualTo("outdoor");
        assertThat(analysis.dominantColors()).containsExactly("blue", "gold", "white");
    }

    @Test
    void toleratesMarkdownFencesAndSurroundingProse() {
        ImageAnalysis analysis = GeminiResponseParser.parseAnalysis("""
                Here is the analysis you asked for:
                ```json
                {"caption": "Pasta on a plate", "tags": ["pasta", "food"], "sceneType": "food", "dominantColors": ["red"]}
                ```
                Let me know if you need anything else.
                """);

        assertThat(analysis.caption()).isEqualTo("Pasta on a plate");
        assertThat(analysis.sceneType()).isEqualTo("food");
    }

    @Test
    void normalizesTagsToLowercaseDedupedAndSorted() {
        List<String> tags = GeminiResponseParser.normalizeTags(
                List.of(" Sunset ", "#beach", "sunset", "BEACH", "palm_tree", "sky!", "", "a".repeat(60)));

        assertThat(tags).containsExactly("beach", "palm tree", "sky", "sunset");
    }

    @Test
    void keepsOnlyTheFirstFifteenTagsBeforeSorting() {
        List<String> raw = List.of("z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8", "z9", "z10",
                "z11", "z12", "z13", "z14", "z15", "a-late-tag");

        List<String> tags = GeminiResponseParser.normalizeTags(raw);

        assertThat(tags).hasSize(15).doesNotContain("a-late-tag");
    }

    @Test
    void acceptsCommaSeparatedStringsAndRenamedFields() {
        ImageAnalysis analysis = GeminiResponseParser.parseAnalysis("""
                {"description": "City street at night", "keywords": "street, night, neon",
                 "scene_type": "Night", "colors": [{"name": "Purple"}, {"name": "black"}]}
                """);

        assertThat(analysis.caption()).isEqualTo("City street at night");
        assertThat(analysis.tags()).containsExactly("neon", "night", "street");
        assertThat(analysis.sceneType()).isEqualTo("night");
        assertThat(analysis.dominantColors()).containsExactly("purple", "black");
    }

    @Test
    void mapsUnknownOrEchoedSceneTypes() {
        assertThat(GeminiResponseParser.normalizeSceneType("outdoor|indoor|portrait")).isEqualTo("outdoor");
        assertThat(GeminiResponseParser.normalizeSceneType("Pets")).isEqualTo("animal");
        assertThat(GeminiResponseParser.normalizeSceneType("a busy cityscape")).isEqualTo("architecture");
        assertThat(GeminiResponseParser.normalizeSceneType("underwater")).isNull();
        assertThat(GeminiResponseParser.normalizeSceneType(null)).isNull();
    }

    @Test
    void limitsColorsAndAcceptsHex() {
        List<String> colors = GeminiResponseParser.normalizeColors(
                List.of("Blue", "#FFAA00", "abc", "blue", "green", "red", "white"));

        assertThat(colors).containsExactly("blue", "#ffaa00", "#abc", "green");
    }

    @Test
    void missingFieldsAreNullNotErrors() {
        ImageAnalysis analysis = GeminiResponseParser.parseAnalysis("{\"caption\": \"Just a caption\"}");

        assertThat(analysis.caption()).isEqualTo("Just a caption");
        assertThat(analysis.tags()).isEmpty();
        assertThat(analysis.sceneType()).isNull();
        assertThat(analysis.dominantColors()).isEmpty();
    }

    @Test
    void rejectsResponsesWithNothingUsable() {
        assertThatThrownBy(() -> GeminiResponseParser.parseAnalysis("I can't help with that."))
                .isInstanceOf(GeminiException.class)
                .extracting(ex -> ((GeminiException) ex).getKind())
                .isEqualTo(GeminiException.Kind.BAD_RESPONSE);
        assertThatThrownBy(() -> GeminiResponseParser.parseAnalysis("{\"sceneType\": \"food\"}"))
                .isInstanceOf(GeminiException.class);
        assertThatThrownBy(() -> GeminiResponseParser.parseAnalysis(null))
                .isInstanceOf(GeminiException.class);
    }

    @Test
    void parsesRankingsInSeveralShapes() {
        assertThat(GeminiResponseParser.parseRanking("{\"ranking\": [3, 1, 2]}", 3)).containsExactly(2, 0, 1);
        assertThat(GeminiResponseParser.parseRanking("[\"2\", \"#1\"]", 3)).containsExactly(1, 0);
        assertThat(GeminiResponseParser.parseRanking("{\"matches\": [{\"number\": 2}]}", 3)).containsExactly(1);
        assertThat(GeminiResponseParser.parseRanking("{\"anything\": [1, 1, 9, 0, -2]}", 3)).containsExactly(0);
        assertThat(GeminiResponseParser.parseRanking("{\"ranking\": []}", 3)).isEmpty();
    }

    @Test
    void unreadableRankingIsABadResponse() {
        assertThatThrownBy(() -> GeminiResponseParser.parseRanking("The best match is photo 2", 3))
                .isInstanceOf(GeminiException.class);
    }

    @Test
    void parsesEditSuggestionsAndFallsBackToProse() {
        EditSuggestion structured = GeminiResponseParser.parseEditSuggestion(
                "{\"suggestion\": \"Lift the shadows.\", \"operations\": [\"Lighten\", \"remove-background\", \"lighten\"]}");
        assertThat(structured.suggestion()).isEqualTo("Lift the shadows.");
        assertThat(structured.operations()).containsExactly("lighten", "remove_background");

        EditSuggestion prose = GeminiResponseParser.parseEditSuggestion("Increase the exposure slightly.");
        assertThat(prose.suggestion()).isEqualTo("Increase the exposure slightly.");
        assertThat(prose.operations()).isEmpty();
    }

    @Test
    void readsCandidateTextAndErrorDetails() {
        var response = GeminiResponseParser.tryParse("""
                {"candidates": [{"content": {"parts": [{"text": "thinking", "thought": true}, {"text": "{\\"a\\":"}, {"text": "1}"}]}}]}
                """);
        assertThat(GeminiResponseParser.extractCandidateText(response)).isEqualTo("{\"a\":1}");

        var blocked = GeminiResponseParser.tryParse("{\"promptFeedback\": {\"blockReason\": \"SAFETY\"}}");
        assertThat(GeminiResponseParser.extractCandidateText(blocked)).isNull();
        assertThat(GeminiResponseParser.blockReason(blocked)).isEqualTo("SAFETY");

        var rateLimited = GeminiResponseParser.tryParse("""
                {"error": {"code": 429, "status": "RESOURCE_EXHAUSTED",
                  "details": [{"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "37s"}]}}
                """);
        assertThat(GeminiResponseParser.retryDelayMillis(rateLimited)).isEqualTo(37_000);

        var invalidKey = GeminiResponseParser.tryParse("""
                {"error": {"code": 400, "message": "API key not valid. Please pass a valid API key.",
                  "details": [{"reason": "API_KEY_INVALID"}]}}
                """);
        assertThat(GeminiResponseParser.isInvalidKeyError(invalidKey)).isTrue();
        assertThat(GeminiResponseParser.isInvalidKeyError(rateLimited)).isFalse();
    }
}
