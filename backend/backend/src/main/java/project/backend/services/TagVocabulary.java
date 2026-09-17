package project.backend.services;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Shared rules for AI tag words: which tags are too generic to suggest (as an
 * album, a "Try" chip or a filter), which are just colors, and one spelling
 * for words Gemini writes two ways.
 */
public final class TagVocabulary {

    // Describe how a photo looks rather than what's in it - the synthetic test
    // images were tagged almost entirely with these, drowning out real subjects.
    static final Set<String> GENERIC_TAGS = Set.of(
            "outdoor", "outdoors", "indoor", "indoors", "daytime", "day", "photo", "photography", "image",
            "picture", "color", "colors", "colorful", "colourful", "no people", "background", "view", "scene",
            "abstract", "pattern", "patterns", "texture", "textures", "textured", "graphic", "graphics",
            "graphic design", "geometric", "geometric pattern", "diagonal", "diagonal lines", "lines", "stripes",
            "minimalist", "minimal", "minimalism", "design", "text", "text label", "text overlay", "label",
            "typography", "simple", "solid", "solid color", "solid background", "plain", "monochrome", "overlay",
            "digital", "digital art", "wallpaper", "surface", "shape", "shapes", "close up", "close-up", "closeup",
            "top view", "aerial view", "scenic", "scenery");

    // Gemini often tags colors ("blue", "sky blue", "dark green").
    static final Set<String> COLOR_WORDS = Set.of(
            "red", "orange", "yellow", "green", "blue", "purple", "violet", "pink", "brown", "black", "white",
            "gray", "grey", "gold", "golden", "silver", "beige", "teal", "turquoise", "navy", "cream");

    private static final Pattern GREY = Pattern.compile("\\bgrey\\b");

    private TagVocabulary() {
    }

    /** Too broad for a suggestion: a style word, a format word or a plain color. */
    public static boolean isGeneric(String tag) {
        if (tag == null || tag.isBlank()) {
            return true;
        }
        String normalized = tag.trim().toLowerCase(Locale.ROOT);
        return GENERIC_TAGS.contains(normalized) || isColorTag(normalized);
    }

    /** "blue", "sky blue", "light green" - but not "blue sky" or "golden hour". */
    public static boolean isColorTag(String tag) {
        String[] words = tag.trim().toLowerCase(Locale.ROOT).split("\\s+");
        return COLOR_WORDS.contains(words[words.length - 1]);
    }

    /** The color family a color name belongs to ("light blue" -> "blue"), or the name itself. */
    public static String colorFamily(String color) {
        String normalized = normalizeSpelling(color.trim().toLowerCase(Locale.ROOT));
        String[] words = normalized.split("\\s+");
        String last = words[words.length - 1];
        return COLOR_WORDS.contains(last) ? last : normalized;
    }

    /** American spelling for the words Gemini writes both ways, so "gray" finds every gray photo. */
    public static String normalizeSpelling(String value) {
        return value == null ? null : GREY.matcher(value).replaceAll("gray");
    }

    public static List<String> normalizeSpelling(List<String> values) {
        return values.stream().map(TagVocabulary::normalizeSpelling).distinct().toList();
    }
}
