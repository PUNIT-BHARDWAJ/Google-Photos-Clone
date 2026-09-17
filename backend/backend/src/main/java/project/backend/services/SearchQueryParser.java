package project.backend.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Splits a search box query into match terms. "sunset at the beach" becomes
 * [sunset, beach]: filler words are dropped and simple plurals reduced so
 * "beaches" still finds a photo tagged "beach".
 */
public final class SearchQueryParser {

    public record SearchQuery(String raw, List<String> terms, boolean naturalLanguage) {
    }

    private static final int MAX_TERMS = 8;

    private static final Set<String> STOPWORDS = Set.of(
            "a", "an", "the", "of", "in", "on", "at", "to", "for", "from", "with", "without", "by", "near", "into",
            "and", "or", "is", "are", "was", "were", "be", "it", "its", "this", "that", "these", "those",
            "my", "me", "i", "we", "our", "some", "any", "all", "show", "find", "get", "give",
            "photo", "photos", "picture", "pictures", "pic", "pics", "image", "images", "shot", "shots",
            "taken", "having", "has", "have", "containing", "where", "which", "who", "what", "there");

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    // "IMG_2041.jpg", "holiday_2024" - file names, not descriptions.
    private static final Pattern FILENAME_LIKE = Pattern.compile(".*(\\.[a-z0-9]{2,5}(\\s|$)|_).*");

    private SearchQueryParser() {
    }

    public static SearchQuery parse(String query) {
        String raw = query == null ? "" : WHITESPACE.matcher(query.trim()).replaceAll(" ");
        String lower = raw.toLowerCase(Locale.ROOT);
        List<String> words = lower.isEmpty() ? List.of() : Arrays.asList(lower.split(" "));

        List<String> terms = new ArrayList<>();
        for (String word : words) {
            String cleaned = trimPunctuation(word);
            if (cleaned.isEmpty() || STOPWORDS.contains(cleaned)) {
                continue;
            }
            String term = stem(TagVocabulary.normalizeSpelling(cleaned));
            if (!terms.contains(term)) {
                terms.add(term);
            }
            if (terms.size() == MAX_TERMS) {
                break;
            }
        }
        // A query made only of filler words ("my photos") still searches for itself.
        if (terms.isEmpty() && !lower.isEmpty()) {
            terms.add(lower);
        }

        boolean naturalLanguage = words.size() > 2 && !FILENAME_LIKE.matcher(lower).matches();
        return new SearchQuery(raw, List.copyOf(terms), naturalLanguage);
    }

    /** Punctuation around a word, but not inside it ("sun-kissed", "img_01.jpg"). */
    static String trimPunctuation(String word) {
        int start = 0;
        int end = word.length();
        while (start < end && !Character.isLetterOrDigit(word.charAt(start))) {
            start++;
        }
        while (end > start && !Character.isLetterOrDigit(word.charAt(end - 1))) {
            end--;
        }
        return word.substring(start, end);
    }

    /**
     * Just enough stemming for prefix matching: the stem only has to be a
     * prefix of both the singular and the plural - "beach" for "beaches",
     * "dog" for "dogs", "cit" for "cities" (and so "city").
     */
    static String stem(String word) {
        if (word.length() <= 3 || !word.chars().allMatch(Character::isLetter)) {
            return word;
        }
        if (word.endsWith("ies") && word.length() > 4) {
            return word.substring(0, word.length() - 3);
        }
        if ((word.endsWith("ches") || word.endsWith("shes") || word.endsWith("sses") || word.endsWith("xes"))
                && word.length() > 4) {
            return word.substring(0, word.length() - 2);
        }
        if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us") && !word.endsWith("is")) {
            return word.substring(0, word.length() - 1);
        }
        return word;
    }
}
