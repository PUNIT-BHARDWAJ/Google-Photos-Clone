package project.backend.services;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import project.backend.domain.Photo;

/** Criteria building blocks for photo lists and search, combined with Specification.and(). */
public final class PhotoSpecifications {

    private PhotoSpecifications() {
    }

    /** The user's photos narrowed by a filter, in the filter's sort order. */
    public static Specification<Photo> filtered(UUID userId, PhotoFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            predicates.add(cb.equal(root.get("status"), filter.status()));

            if (filter.starred() != null) {
                predicates.add(cb.equal(root.get("starred"), filter.starred()));
            }
            if (filter.scene() != null) {
                predicates.add(cb.equal(cb.lower(root.get("aiSceneType")), filter.scene()));
            }
            if (filter.color() != null) {
                // Whole words, so "blue" also finds "light blue" but "red" doesn't find "redwood".
                predicates.add(cb.like(wordList(root, cb, "aiDominantColors"), "% " + escapeLike(filter.color()) + " %", '\\'));
            }
            for (String tag : filter.tags()) {
                // A whole tag, not a word inside one: "sea" shouldn't match "sea lion".
                predicates.add(cb.like(tagList(root, cb), "%," + escapeLike(tag) + ",%", '\\'));
            }
            if (filter.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(photoDate(root, cb), filter.from()));
            }
            if (filter.to() != null) {
                predicates.add(cb.lessThan(photoDate(root, cb), filter.to()));
            }
            if (filter.addedAfter() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<Instant>get("createdAt"), filter.addedAfter()));
            }

            applyOrder(root, query, cb, filter.sort());
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /** Every term (or, with requireAll false, any term) matches the name, caption, tags or scene. */
    public static Specification<Photo> matchingTerms(List<String> terms, boolean requireAll) {
        return (root, query, cb) -> {
            Predicate[] termPredicates = terms.stream()
                    .map(term -> termMatches(root, cb, term))
                    .toArray(Predicate[]::new);
            return requireAll ? cb.and(termPredicates) : cb.or(termPredicates);
        };
    }

    public static Specification<Photo> analyzed() {
        return (root, query, cb) -> cb.isNotNull(root.get("aiProcessedAt"));
    }

    /**
     * File names match anywhere ("2041" finds "IMG_2041.jpg"); captions and
     * tags match at the start of a word, so "art" finds "art" and "artwork"
     * but not "party" or "apartment"; the scene type matches from its start,
     * so "food" finds food scenes whose tags never say "food"; dominant colors
     * match as whole words, so "gray" finds mostly-gray photos.
     */
    static Predicate termMatches(Root<Photo> root, CriteriaBuilder cb, String term) {
        String escaped = escapeLike(term);
        String anywhere = "%" + escaped + "%";
        String wordStart = "% " + escaped + "%";

        Expression<String> caption = cb.concat(" ", cb.lower(root.get("aiCaption")));

        List<Predicate> matches = new ArrayList<>(List.of(
                cb.like(cb.lower(root.get("fileName")), anywhere, '\\'),
                cb.like(cb.lower(root.get("originalFileName")), anywhere, '\\'),
                cb.like(caption, wordStart, '\\'),
                cb.like(wordList(root, cb, "aiTags"), wordStart, '\\'),
                cb.like(cb.lower(root.get("aiSceneType")), escaped + "%", '\\'),
                cb.like(wordList(root, cb, "aiDominantColors"), "% " + escaped + " %", '\\')));

        // Tags and colors are stored as "gray", but captions and file names keep
        // whatever spelling they were written with.
        String british = term.replaceAll("\\bgray\\b", "grey");
        if (!british.equals(term)) {
            String escapedBritish = escapeLike(british);
            matches.add(cb.like(caption, "% " + escapedBritish + "%", '\\'));
            matches.add(cb.like(cb.lower(root.get("originalFileName")), "%" + escapedBritish + "%", '\\'));
        }
        return cb.or(matches.toArray(Predicate[]::new));
    }

    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static void applyOrder(Root<Photo> root, CriteriaQuery<?> query, CriteriaBuilder cb, PhotoSort sort) {
        // Count queries (Long result) can't be ordered.
        if (query == null || query.getResultType() == Long.class || query.getResultType() == long.class) {
            return;
        }
        Expression<Instant> primary = sort.byUploadDate() ? root.get("createdAt") : photoDate(root, cb);
        if (sort.ascending()) {
            query.orderBy(cb.asc(primary), cb.asc(root.get("createdAt")), cb.asc(root.get("id")));
        } else {
            query.orderBy(cb.desc(primary), cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
        }
    }

    private static Expression<Instant> photoDate(Root<Photo> root, CriteriaBuilder cb) {
        return cb.coalesce(root.get("metadata").<Instant>get("dateTaken"), root.<Instant>get("createdAt"));
    }

    /** " light blue gold " - a comma-separated column as space-padded words. */
    private static Expression<String> wordList(Root<Photo> root, CriteriaBuilder cb, String attribute) {
        Expression<String> spaced = cb.function("replace", String.class, cb.lower(root.get(attribute)), cb.literal(","), cb.literal(" "));
        return cb.concat(cb.concat(" ", spaced), " ");
    }

    /** ",beach,palm tree,sea," - tags stored as "beach, palm tree, sea", padded for whole-tag matching. */
    private static Expression<String> tagList(Root<Photo> root, CriteriaBuilder cb) {
        Expression<String> compact = cb.function("replace", String.class, cb.lower(root.get("aiTags")), cb.literal(", "), cb.literal(","));
        return cb.concat(cb.concat(",", compact), ",");
    }
}
