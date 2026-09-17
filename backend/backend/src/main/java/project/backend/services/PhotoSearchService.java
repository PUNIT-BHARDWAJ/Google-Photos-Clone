package project.backend.services;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.PhotoResponse;
import project.backend.dto.PhotoSearchResponse;
import project.backend.dto.PhotoSummary;
import project.backend.dto.TagCountResponse;
import project.backend.exception.GeminiException;
import project.backend.repository.PhotoRepository;
import project.backend.services.SearchQueryParser.SearchQuery;

/**
 * Two-phase photo search. Phase 1 (always, database only): every query term
 * must match the file name, the AI caption or the AI tags; if no photo matches
 * all terms, photos matching any term are returned instead. Phase 2 (only with
 * ai=true and a descriptive 3+ word query): Gemini re-orders the phase 1
 * results using their captions and tags. If Gemini is off or fails, the phase
 * 1 results are returned with a message saying why.
 *
 * No class-level transaction: a Gemini call can take seconds and must not hold
 * a database connection while it waits.
 */
@Service
public class PhotoSearchService {

    private static final int AI_CANDIDATE_LIMIT = 100;
    private static final int AI_RESULT_LIMIT = 500;
    private static final long RANKING_CACHE_TTL_MS = 2 * 60_000;
    private static final int RANKING_CACHE_MAX_ENTRIES = 200;

    private final PhotoRepository photoRepository;
    private final PhotoService photoService;
    private final GeminiService geminiService;

    private record CachedRanking(List<UUID> photoIds, long createdAt) {
    }

    // Loading page 2 of an AI search reuses the ranking instead of asking Gemini again.
    private final Map<String, CachedRanking> rankingCache = new ConcurrentHashMap<>();

    public PhotoSearchService(PhotoRepository photoRepository, PhotoService photoService, GeminiService geminiService) {
        this.photoRepository = photoRepository;
        this.photoService = photoService;
        this.geminiService = geminiService;
    }

    public PhotoSearchResponse search(User user, String query, PhotoStatus status, boolean ai, int page, int size) {
        SearchQuery parsed = SearchQueryParser.parse(query);
        if (parsed.terms().isEmpty()) {
            return new PhotoSearchResponse(List.of(), page, size, 0, 0, true, false, null);
        }

        if (ai && parsed.naturalLanguage()) {
            if (!geminiService.isConfigured()) {
                return keywordSearch(user, parsed, status, page, size,
                        "AI search isn't configured, so these are regular results");
            }
            try {
                return aiSearch(user, parsed, status, page, size);
            } catch (GeminiException ex) {
                return keywordSearch(user, parsed, status, page, size,
                        ex.getMessage() + " Showing regular results instead.");
            }
        }

        String message = ai ? "AI ranking is used for descriptive searches of three or more words" : null;
        return keywordSearch(user, parsed, status, page, size, message);
    }

    public List<TagCountResponse> topTags(User user, int limit) {
        Map<String, Long> counts = new HashMap<>();
        for (String tags : photoRepository.findAiTags(user.getId(), PhotoStatus.ACTIVE)) {
            for (String tag : Photo.splitList(tags)) {
                counts.merge(tag, 1L, Long::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(Math.clamp(limit, 1, 50))
                .map(entry -> new TagCountResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    // ---- Phase 1 ----------------------------------------------------------

    private PhotoSearchResponse keywordSearch(User user, SearchQuery query, PhotoStatus status, int page, int size, String aiMessage) {
        Page<Photo> result = findMatches(user.getId(), status, query.terms(), PageRequest.of(page, size));
        List<PhotoResponse> content = result.getContent().stream().map(photoService::toPhotoResponse).toList();
        return new PhotoSearchResponse(content, result.getNumber(), result.getSize(), result.getTotalElements(),
                result.getTotalPages(), result.isLast(), false, aiMessage);
    }

    private Page<Photo> findMatches(UUID userId, PhotoStatus status, List<String> terms, PageRequest pageRequest) {
        Page<Photo> all = photoRepository.findAll(matching(userId, status, terms, true), pageRequest);
        if (all.getTotalElements() > 0 || terms.size() == 1) {
            return all;
        }
        return photoRepository.findAll(matching(userId, status, terms, false), pageRequest);
    }

    static Specification<Photo> matching(UUID userId, PhotoStatus status, List<String> terms, boolean requireAllTerms) {
        return (root, query, cb) -> {
            Predicate[] termPredicates = terms.stream()
                    .map(term -> termMatches(root, cb, term))
                    .toArray(Predicate[]::new);

            // Count queries (Long result) can't be ordered.
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.orderBy(
                        cb.desc(cb.coalesce(root.get("metadata").<Instant>get("dateTaken"), root.<Instant>get("createdAt"))),
                        cb.desc(root.get("createdAt")),
                        cb.desc(root.get("id")));
            }

            return cb.and(
                    cb.equal(root.get("user").get("id"), userId),
                    cb.equal(root.get("status"), status),
                    requireAllTerms ? cb.and(termPredicates) : cb.or(termPredicates));
        };
    }

    /**
     * File names match anywhere ("2041" finds "IMG_2041.jpg"); captions and
     * tags match at the start of a word, so "art" finds "art" and "artwork"
     * but not "party" or "apartment".
     */
    private static Predicate termMatches(Root<Photo> root, CriteriaBuilder cb, String term) {
        String escaped = escapeLikePattern(term);
        String anywhere = "%" + escaped + "%";
        String wordStart = "% " + escaped + "%";

        Expression<String> caption = cb.concat(" ", cb.lower(root.get("aiCaption")));
        Expression<String> tags = cb.concat(" ",
                cb.function("replace", String.class, cb.lower(root.get("aiTags")), cb.literal(","), cb.literal(" ")));

        return cb.or(
                cb.like(cb.lower(root.get("fileName")), anywhere, '\\'),
                cb.like(cb.lower(root.get("originalFileName")), anywhere, '\\'),
                cb.like(caption, wordStart, '\\'),
                cb.like(tags, wordStart, '\\'));
    }

    static String escapeLikePattern(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    // ---- Phase 2 ----------------------------------------------------------

    private PhotoSearchResponse aiSearch(User user, SearchQuery query, PhotoStatus status, int page, int size) {
        String cacheKey = user.getId() + "|" + status + "|" + query.raw().toLowerCase(Locale.ROOT);
        List<UUID> ordered = cachedRanking(cacheKey);

        if (ordered == null) {
            List<Photo> candidates = findMatches(user.getId(), status, query.terms(), PageRequest.of(0, AI_RESULT_LIMIT))
                    .getContent();
            List<PhotoSummary> summaries = candidates.stream()
                    .limit(AI_CANDIDATE_LIMIT)
                    .filter(photo -> photo.getAiCaption() != null || photo.getAiTags() != null)
                    .map(photo -> new PhotoSummary(photo.getId(), photo.getAiCaption(), photo.getAiTagList(), photo.getAiSceneType()))
                    .toList();

            if (summaries.isEmpty()) {
                String message = candidates.isEmpty()
                        ? null
                        : "None of these photos have been analyzed yet, so they can't be ranked by AI";
                return keywordSearch(user, query, status, page, size, message);
            }

            // Gemini's picks first, then the rest of the matches in timeline order.
            Set<UUID> ids = new LinkedHashSet<>(geminiService.searchByDescription(query.raw(), summaries));
            candidates.forEach(photo -> ids.add(photo.getId()));
            ordered = List.copyOf(ids);
            cacheRanking(cacheKey, ordered);
        }

        int from = Math.min(page * size, ordered.size());
        int to = Math.min(from + size, ordered.size());
        List<UUID> pageIds = ordered.subList(from, to);

        Map<UUID, Photo> photosById = pageIds.isEmpty()
                ? Map.of()
                : photoRepository.findByIdInAndUserId(pageIds, user.getId()).stream()
                        .collect(Collectors.toMap(Photo::getId, Function.identity()));
        List<PhotoResponse> content = pageIds.stream()
                .map(photosById::get)
                // The ranking can be up to two minutes old - skip photos trashed or archived since.
                .filter(Objects::nonNull)
                .filter(photo -> photo.getStatus() == status)
                .map(photoService::toPhotoResponse)
                .toList();

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) ordered.size() / size);
        return new PhotoSearchResponse(content, page, size, ordered.size(), totalPages, to >= ordered.size(), true, null);
    }

    private List<UUID> cachedRanking(String key) {
        CachedRanking cached = rankingCache.get(key);
        if (cached == null) {
            return null;
        }
        if (System.currentTimeMillis() - cached.createdAt() > RANKING_CACHE_TTL_MS) {
            rankingCache.remove(key);
            return null;
        }
        return cached.photoIds();
    }

    private void cacheRanking(String key, List<UUID> photoIds) {
        long now = System.currentTimeMillis();
        rankingCache.values().removeIf(entry -> now - entry.createdAt() > RANKING_CACHE_TTL_MS);
        if (rankingCache.size() >= RANKING_CACHE_MAX_ENTRIES) {
            rankingCache.clear();
        }
        rankingCache.put(key, new CachedRanking(photoIds, now));
    }
}
