package project.backend.services;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import project.backend.dto.EditSuggestion;
import project.backend.dto.ImageAnalysis;
import project.backend.exception.GeminiException;
import project.backend.exception.GeminiException.Kind;

/**
 * Turns Gemini's text into our types without trusting its shape: responses
 * can arrive wrapped in markdown fences or prose, with fields renamed, as a
 * comma-separated string where a list was asked for, or with values outside
 * the requested vocabulary.
 */
public final class GeminiResponseParser {

    public static final List<String> SCENE_TYPES = List.of(
            "outdoor", "indoor", "portrait", "landscape", "food", "document", "screenshot", "art",
            "animal", "vehicle", "architecture", "night", "macro", "sport", "event");

    private static final Map<String, String> SCENE_SYNONYMS = Map.ofEntries(
            Map.entry("outdoors", "outdoor"),
            Map.entry("nature", "outdoor"),
            Map.entry("beach", "outdoor"),
            Map.entry("interior", "indoor"),
            Map.entry("indoors", "indoor"),
            Map.entry("people", "portrait"),
            Map.entry("person", "portrait"),
            Map.entry("selfie", "portrait"),
            Map.entry("scenery", "landscape"),
            Map.entry("drink", "food"),
            Map.entry("drinks", "food"),
            Map.entry("text", "document"),
            Map.entry("receipt", "document"),
            Map.entry("artwork", "art"),
            Map.entry("painting", "art"),
            Map.entry("illustration", "art"),
            Map.entry("pet", "animal"),
            Map.entry("pets", "animal"),
            Map.entry("animals", "animal"),
            Map.entry("wildlife", "animal"),
            Map.entry("car", "vehicle"),
            Map.entry("vehicles", "vehicle"),
            Map.entry("building", "architecture"),
            Map.entry("buildings", "architecture"),
            Map.entry("city", "architecture"),
            Map.entry("cityscape", "architecture"),
            Map.entry("nighttime", "night"),
            Map.entry("closeup", "macro"),
            Map.entry("close-up", "macro"),
            Map.entry("sports", "sport"),
            Map.entry("events", "event"),
            Map.entry("party", "event"));

    static final int MAX_TAGS = 15;
    static final int MAX_TAG_LENGTH = 40;
    static final int MAX_CAPTION_LENGTH = 300;
    static final int MAX_COLORS = 4;
    static final int MAX_SUGGESTION_LENGTH = 600;

    private static final JsonMapper MAPPER = JsonMapper.builder().build();
    private static final Pattern CODE_FENCE = Pattern.compile("^```[a-zA-Z]*\\s*|\\s*```$");
    private static final Pattern TAG_DISALLOWED = Pattern.compile("[^\\p{L}\\p{N} &'-]");
    private static final Pattern COLOR_DISALLOWED = Pattern.compile("[^\\p{L} -]");
    private static final Pattern HEX_COLOR = Pattern.compile("^#?([0-9a-f]{6}|[0-9a-f]{3})$");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern DIGITS = Pattern.compile("\\d+");
    private static final Pattern RETRY_DELAY = Pattern.compile("^(\\d+(?:\\.\\d+)?)s$");

    private GeminiResponseParser() {
    }

    // ---- Envelope ---------------------------------------------------------

    /** The model's text from a generateContent response, or null if it has none. */
    public static String extractCandidateText(JsonNode response) {
        if (response == null) {
            return null;
        }
        JsonNode parts = response.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray()) {
            return null;
        }
        StringBuilder text = new StringBuilder();
        for (JsonNode part : parts.values()) {
            if (part.path("thought").asBoolean(false)) {
                continue;
            }
            JsonNode value = part.get("text");
            if (value != null && value.isString()) {
                text.append(value.stringValue());
            }
        }
        return text.isEmpty() ? null : text.toString();
    }

    /** Why Gemini produced no candidate text (safety block, token limit...), for the error message. */
    public static String blockReason(JsonNode response) {
        if (response == null) {
            return null;
        }
        String reason = response.path("promptFeedback").path("blockReason").asString(null);
        if (reason != null && !reason.isBlank()) {
            return reason;
        }
        String finish = response.path("candidates").path(0).path("finishReason").asString(null);
        return finish != null && !finish.isBlank() && !"STOP".equals(finish) ? finish : null;
    }

    /** Gemini's RetryInfo delay ("37s", "1.5s") from an error body, in milliseconds; -1 if absent. */
    public static long retryDelayMillis(JsonNode errorBody) {
        JsonNode details = errorBody == null ? null : errorBody.path("error").path("details");
        if (details == null || !details.isArray()) {
            return -1;
        }
        for (JsonNode detail : details.values()) {
            String delay = detail.path("retryDelay").asString(null);
            if (delay == null) {
                continue;
            }
            Matcher matcher = RETRY_DELAY.matcher(delay.trim());
            if (matcher.matches()) {
                return (long) (Double.parseDouble(matcher.group(1)) * 1000);
            }
        }
        return -1;
    }

    /** True for Gemini's "API key not valid" style errors. */
    public static boolean isInvalidKeyError(JsonNode errorBody) {
        if (errorBody == null) {
            return false;
        }
        if (errorReasons(errorBody).stream().anyMatch(reason -> reason.startsWith("API_KEY_"))) {
            return true;
        }
        return upstreamMessage(errorBody).toLowerCase(Locale.ROOT).contains("api key");
    }

    /**
     * What to tell the user when Gemini refuses a key. Invalid, expired,
     * restricted and "API not enabled" keys all arrive as 400/403 but need
     * different fixes.
     */
    public static String keyProblemMessage(JsonNode errorBody) {
        List<String> reasons = errorReasons(errorBody);
        String message = upstreamMessage(errorBody).toLowerCase(Locale.ROOT);
        if (reasons.contains("SERVICE_DISABLED") || message.contains("has not been used in project")
                || message.contains("it is disabled")) {
            return "The Gemini API isn't enabled for this key's Google Cloud project. Create the key in Google AI "
                    + "Studio, or enable the Generative Language API for that project.";
        }
        if (reasons.stream().anyMatch(reason -> reason.startsWith("API_KEY_") && reason.endsWith("_BLOCKED"))) {
            return "This API key's restrictions don't allow the Gemini API. Allow the Generative Language API "
                    + "for the key in Google Cloud Console.";
        }
        if (reasons.contains("API_KEY_EXPIRED") || message.contains("expired")) {
            return "The Gemini API key has expired. Create a new one in Google AI Studio.";
        }
        // Google answers this way when the value isn't an API key at all (an
        // OAuth client secret, a token, a Vertex AI credential, stray quotes).
        if (reasons.contains("ACCESS_TOKEN_TYPE_UNSUPPORTED") || message.contains("expected oauth 2 access token")) {
            return "Google didn't recognize gemini.api-key as an API key. Paste the key from Google AI Studio "
                    + "(aistudio.google.com/apikey) exactly, without quotes.";
        }
        return "Gemini rejected the API key. Check gemini.api-key.";
    }

    /** Google's own error text ("API key not valid..."), which never includes the key itself. */
    public static String upstreamMessage(JsonNode errorBody) {
        return errorBody == null ? "" : errorBody.path("error").path("message").asString("");
    }

    /** "PERMISSION_DENIED [SERVICE_DISABLED]: message", for logs. */
    public static String errorSummary(JsonNode errorBody) {
        if (errorBody == null) {
            return "(no error body)";
        }
        String status = errorBody.path("error").path("status").asString("");
        List<String> reasons = errorReasons(errorBody);
        List<String> quotas = quotaIds(errorBody);
        String summary = status + (reasons.isEmpty() ? "" : " " + reasons)
                + (quotas.isEmpty() ? "" : " quota=" + quotas) + ": " + upstreamMessage(errorBody);
        return summary.length() > 500 ? summary.substring(0, 499) + "…" : summary;
    }

    /** The quotas a 429 says were exceeded, e.g. "GenerateRequestsPerDayPerProjectPerModel-FreeTier". */
    static List<String> quotaIds(JsonNode errorBody) {
        List<String> ids = new ArrayList<>();
        if (errorBody == null) {
            return ids;
        }
        for (JsonNode detail : errorBody.path("error").path("details").values()) {
            for (JsonNode violation : detail.path("violations").values()) {
                String id = violation.path("quotaId").asString("");
                if (!id.isEmpty() && !ids.contains(id)) {
                    ids.add(id);
                }
            }
        }
        return ids;
    }

    /** True when a 429 is the daily quota - waiting a minute won't help, retries only waste time. */
    public static boolean isDailyQuotaExceeded(JsonNode errorBody) {
        return quotaIds(errorBody).stream().anyMatch(id -> id.contains("PerDay"));
    }

    static List<String> errorReasons(JsonNode errorBody) {
        List<String> reasons = new ArrayList<>();
        if (errorBody == null) {
            return reasons;
        }
        for (JsonNode detail : errorBody.path("error").path("details").values()) {
            String reason = detail.path("reason").asString("");
            if (!reason.isEmpty()) {
                reasons.add(reason);
            }
        }
        return reasons;
    }

    // ---- Image analysis ---------------------------------------------------

    public static ImageAnalysis parseAnalysis(String text) {
        JsonNode root = readJson(text);
        if (root != null && root.isArray() && !root.isEmpty() && root.get(0).isObject()) {
            root = root.get(0);
        }
        if (root == null || !root.isObject()) {
            throw new GeminiException(Kind.BAD_RESPONSE, "Gemini returned an analysis we couldn't read");
        }

        String caption = normalizeCaption(firstString(root, "caption", "description", "summary"));
        List<String> tags = normalizeTags(stringList(firstNode(root, "tags", "keywords", "labels")));
        String sceneType = normalizeSceneType(firstString(root, "sceneType", "scene_type", "scene"));
        List<String> colors = normalizeColors(stringList(firstNode(root, "dominantColors", "dominant_colors", "colors")));

        if (caption == null && tags.isEmpty()) {
            throw new GeminiException(Kind.BAD_RESPONSE, "Gemini's analysis had no caption or tags");
        }
        return new ImageAnalysis(caption, tags, sceneType, colors);
    }

    static String normalizeCaption(String caption) {
        if (caption == null) {
            return null;
        }
        String cleaned = WHITESPACE.matcher(caption).replaceAll(" ").trim();
        if (cleaned.length() >= 2 && cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }
        if (cleaned.isEmpty()) {
            return null;
        }
        return truncateAtWord(cleaned, MAX_CAPTION_LENGTH);
    }

    /** Lowercase, trimmed, deduplicated, sorted - keeping Gemini's first (most relevant) 15. */
    public static List<String> normalizeTags(List<String> rawTags) {
        Set<String> unique = new LinkedHashSet<>();
        for (String raw : rawTags) {
            if (raw == null) {
                continue;
            }
            String tag = raw.toLowerCase(Locale.ROOT).trim();
            while (tag.startsWith("#")) {
                tag = tag.substring(1);
            }
            tag = tag.replace('_', ' ');
            tag = TAG_DISALLOWED.matcher(tag).replaceAll("");
            tag = TagVocabulary.normalizeSpelling(WHITESPACE.matcher(tag).replaceAll(" ").trim());
            if (tag.isEmpty() || tag.length() > MAX_TAG_LENGTH) {
                continue;
            }
            unique.add(tag);
            if (unique.size() == MAX_TAGS) {
                break;
            }
        }
        return unique.stream().sorted().toList();
    }

    static String normalizeSceneType(String raw) {
        if (raw == null) {
            return null;
        }
        String value = raw.toLowerCase(Locale.ROOT).trim();
        // A model that echoes the prompt's "outdoor|indoor|..." gets its first pick.
        int pipe = value.indexOf('|');
        if (pipe >= 0) {
            value = value.substring(0, pipe).trim();
        }
        if (SCENE_TYPES.contains(value)) {
            return value;
        }
        if (SCENE_SYNONYMS.containsKey(value)) {
            return SCENE_SYNONYMS.get(value);
        }
        for (String word : value.split("[^a-z-]+")) {
            if (SCENE_TYPES.contains(word)) {
                return word;
            }
            if (SCENE_SYNONYMS.containsKey(word)) {
                return SCENE_SYNONYMS.get(word);
            }
        }
        return null;
    }

    static List<String> normalizeColors(List<String> rawColors) {
        Set<String> unique = new LinkedHashSet<>();
        for (String raw : rawColors) {
            if (raw == null) {
                continue;
            }
            String color = raw.toLowerCase(Locale.ROOT).trim();
            if (HEX_COLOR.matcher(color).matches()) {
                color = color.startsWith("#") ? color : "#" + color;
            } else {
                color = COLOR_DISALLOWED.matcher(color).replaceAll("");
                color = TagVocabulary.normalizeSpelling(WHITESPACE.matcher(color).replaceAll(" ").trim());
            }
            if (color.isEmpty() || color.length() > 30) {
                continue;
            }
            unique.add(color);
            if (unique.size() == MAX_COLORS) {
                break;
            }
        }
        return List.copyOf(unique);
    }

    // ---- Search ranking ---------------------------------------------------

    /**
     * The 0-based positions Gemini ranked, most relevant first. The prompt
     * numbers photos from 1; numbers outside 1..photoCount are dropped.
     */
    public static List<Integer> parseRanking(String text, int photoCount) {
        JsonNode root = readJson(text);
        JsonNode list = null;
        if (root != null && root.isArray()) {
            list = root;
        } else if (root != null && root.isObject()) {
            list = firstNode(root, "ranking", "matches", "results", "photos", "indices");
            if (list == null) {
                for (JsonNode value : root.values()) {
                    if (value.isArray()) {
                        list = value;
                        break;
                    }
                }
            }
        }
        if (list == null || !list.isArray()) {
            throw new GeminiException(Kind.BAD_RESPONSE, "Gemini returned a ranking we couldn't read");
        }

        Set<Integer> positions = new LinkedHashSet<>();
        for (JsonNode item : list.values()) {
            Integer number = null;
            if (item.isIntegralNumber() && item.canConvertToInt()) {
                number = item.asInt();
            } else if (item.isString() || item.isNumber()) {
                Matcher matcher = DIGITS.matcher(item.asString());
                if (matcher.find()) {
                    try {
                        number = Integer.parseInt(matcher.group());
                    } catch (NumberFormatException ignored) {
                        // Absurdly long digit run - not a photo number.
                    }
                }
            } else if (item.isObject()) {
                JsonNode inner = firstNode(item, "number", "index", "id");
                if (inner != null && inner.canConvertToInt()) {
                    number = inner.asInt();
                }
            }
            if (number != null && number >= 1 && number <= photoCount) {
                positions.add(number - 1);
            }
        }
        return List.copyOf(positions);
    }

    // ---- Edit suggestions -------------------------------------------------

    public static EditSuggestion parseEditSuggestion(String text) {
        JsonNode root = readJson(text);
        if (root == null || !root.isObject()) {
            // Plain prose is still a usable suggestion - it just can't name operations.
            String prose = text == null ? null : normalizeSuggestion(stripCodeFences(text.trim()));
            if (prose == null) {
                throw new GeminiException(Kind.BAD_RESPONSE, "Gemini returned an empty suggestion");
            }
            return new EditSuggestion(prose, List.of());
        }

        String suggestion = normalizeSuggestion(firstString(root, "suggestion", "description", "advice", "explanation"));
        List<String> operations = new ArrayList<>();
        for (String raw : stringList(firstNode(root, "operations", "edits", "transforms"))) {
            String key = WHITESPACE.matcher(raw.toLowerCase(Locale.ROOT).trim()).replaceAll("_").replace('-', '_');
            if (!key.isEmpty() && !operations.contains(key)) {
                operations.add(key);
            }
        }
        if (suggestion == null && operations.isEmpty()) {
            throw new GeminiException(Kind.BAD_RESPONSE, "Gemini returned an empty suggestion");
        }
        return new EditSuggestion(suggestion, List.copyOf(operations));
    }

    private static String normalizeSuggestion(String suggestion) {
        if (suggestion == null) {
            return null;
        }
        String cleaned = WHITESPACE.matcher(suggestion).replaceAll(" ").trim();
        return cleaned.isEmpty() ? null : truncateAtWord(cleaned, MAX_SUGGESTION_LENGTH);
    }

    // ---- JSON helpers -----------------------------------------------------

    /** Parses the first JSON object/array in the text, tolerating fences and surrounding prose. */
    static JsonNode readJson(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String trimmed = stripCodeFences(text.trim());
        JsonNode direct = tryParse(trimmed);
        if (direct != null && (direct.isObject() || direct.isArray())) {
            return direct;
        }

        int objectStart = trimmed.indexOf('{');
        int arrayStart = trimmed.indexOf('[');
        boolean objectFirst = objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart);
        int start = objectFirst ? objectStart : arrayStart;
        if (start < 0) {
            return null;
        }
        int end = trimmed.lastIndexOf(objectFirst ? '}' : ']');
        if (end <= start) {
            return null;
        }
        JsonNode embedded = tryParse(trimmed.substring(start, end + 1));
        return embedded != null && (embedded.isObject() || embedded.isArray()) ? embedded : null;
    }

    static JsonNode tryParse(String text) {
        try {
            return MAPPER.readTree(text);
        } catch (JacksonException ex) {
            return null;
        }
    }

    private static String stripCodeFences(String text) {
        return CODE_FENCE.matcher(text).replaceAll("").trim();
    }

    private static JsonNode firstNode(JsonNode object, String... names) {
        for (String name : names) {
            JsonNode value = object.get(name);
            if (value != null && !value.isNull()) {
                return value;
            }
        }
        return null;
    }

    private static String firstString(JsonNode object, String... names) {
        JsonNode value = firstNode(object, names);
        if (value == null) {
            return null;
        }
        if (value.isString() || value.isNumber() || value.isBoolean()) {
            return value.asString();
        }
        return null;
    }

    /** A JSON array of strings, a single comma-separated string, or objects with a name. */
    private static List<String> stringList(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node == null || node.isNull()) {
            return values;
        }
        if (node.isString()) {
            for (String part : node.stringValue().split(",")) {
                values.add(part);
            }
            return values;
        }
        if (!node.isArray()) {
            return values;
        }
        for (JsonNode item : node.values()) {
            if (item.isString() || item.isNumber()) {
                values.add(item.asString());
            } else if (item.isObject()) {
                String named = firstString(item, "name", "color", "tag", "label", "key");
                if (named != null) {
                    values.add(named);
                }
            }
        }
        return values;
    }

    private static String truncateAtWord(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return text;
        }
        int cut = text.lastIndexOf(' ', maxLength - 1);
        if (cut < maxLength / 2) {
            cut = maxLength - 1;
        }
        return text.substring(0, cut).trim() + "…";
    }
}
