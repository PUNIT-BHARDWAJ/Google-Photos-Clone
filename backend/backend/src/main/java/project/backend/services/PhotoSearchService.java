package project.backend.services;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
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

import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.FacetCountResponse;
import project.backend.dto.PhotoFacetsResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.PhotoSearchResponse;
import project.backend.dto.PhotoSummary;
import project.backend.dto.TagCountResponse;
import project.backend.exception.GeminiException;
import project.backend.repository.PhotoRepository;
import project.backend.services.SearchQueryParser.SearchQuery;

/**
 * Photo search. Keyword mode (database only): every query term must match the
 * file name, AI caption, AI tags or scene type; if no photo matches all terms,
 * photos matching any term are returned. Filters (dates, scene, color, tags)
 * narrow either mode, and a filter-only search (no query) lists the matches.
 *
 * AI mode (ai=true and a descriptive 3+ word query): Gemini chooses and orders
 * the relevant photos from a pool of keyword matches topped up with other
 * analyzed photos - so "something to eat" can find a photo tagged "raspberries"
 * even though no word overlaps. Photos matching every term are kept after
 * Gemini's picks. If Gemini is off or fails, keyword results are returned with
 * a message saying why.
 *
 * No class-level transaction: a Gemini call can take seconds and must not hold
 * a database connection while it waits.
 */
@Service
public class PhotoSearchService {

    static final int AI_POOL_SIZE = 100;
    private static final int AI_RESULT_LIMIT = 500;
    private static final long RANKING_CACHE_TTL_MS = 2 * 60_000;
    private static final int RANKING_CACHE_MAX_ENTRIES = 200;
    private static final int MAX_FACET_TAGS = 300;

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

    public PhotoSearchResponse search(User user, String query, PhotoFilter filter, boolean ai, int page, int size) {
        SearchQuery parsed = SearchQueryParser.parse(query);
        if (parsed.terms().isEmpty()) {
            if (!filter.hasConstraints()) {
                return new PhotoSearchResponse(List.of(), page, size, 0, 0, true, false, null);
            }
            return toResponse(photoRepository.findAll(PhotoSpecifications.filtered(user.getId(), filter),
                    PageRequest.of(page, size)), false, null);
        }

        if (ai && parsed.naturalLanguage()) {
            if (!geminiService.isConfigured()) {
                return keywordSearch(user, parsed, filter, page, size,
                        "AI search isn't configured, so these are regular results");
            }
            try {
                return aiSearch(user, parsed, filter, page, size);
            } catch (GeminiException ex) {
                return keywordSearch(user, parsed, filter, page, size,
                        ex.getMessage() + " Showing regular results instead.");
            }
        }

        String message = ai ? "AI ranking is used for descriptive searches of three or more words" : null;
        return keywordSearch(user, parsed, filter, page, size, message);
    }

    /** The most common tags, for "Try" suggestions. Generic ones ("pattern", "blue") are left out unless asked for. */
    public List<TagCountResponse> topTags(User user, int limit, boolean includeGeneric) {
        return tagCounts(photoRepository.findAiTags(user.getId(), PhotoStatus.ACTIVE)).entrySet().stream()
                .filter(entry -> includeGeneric || !TagVocabulary.isGeneric(entry.getKey()))
                .sorted(byCountThenName())
                .limit(Math.clamp(limit, 1, 50))
                .map(entry -> new TagCountResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    /**
     * Scene types, color families and tags present in the user's active
     * library, with counts - the options for filter chips, the advanced search
     * panel and autocomplete.
     */
    public PhotoFacetsResponse facets(User user) {
        Map<String, Long> scenes = new HashMap<>();
        Map<String, Long> colors = new HashMap<>();
        Map<String, Long> tags = new HashMap<>();

        for (Object[] row : photoRepository.findAiFacetValues(user.getId(), PhotoStatus.ACTIVE)) {
            String scene = (String) row[0];
            if (scene != null && !scene.isBlank()) {
                scenes.merge(scene.toLowerCase(Locale.ROOT), 1L, Long::sum);
            }
            // A photo counts once per color family, however many shades of it Gemini listed.
            Photo.splitList((String) row[1]).stream()
                    .filter(color -> !color.startsWith("#"))
                    .map(TagVocabulary::colorFamily)
                    .distinct()
                    .forEach(color -> colors.merge(color, 1L, Long::sum));
            Photo.splitList((String) row[2]).stream()
                    .map(TagVocabulary::normalizeSpelling)
                    .distinct()
                    .forEach(tag -> tags.merge(tag, 1L, Long::sum));
        }

        return new PhotoFacetsResponse(
                toFacets(scenes, Integer.MAX_VALUE, false),
                toFacets(colors, Integer.MAX_VALUE, false),
                toFacets(tags, MAX_FACET_TAGS, true));
    }

    // ---- Keyword mode -----------------------------------------------------

    private PhotoSearchResponse keywordSearch(User user, SearchQuery query, PhotoFilter filter, int page, int size, String aiMessage) {
        return toResponse(findMatches(user.getId(), filter, query.terms(), PageRequest.of(page, size)), false, aiMessage);
    }

    private Page<Photo> findMatches(UUID userId, PhotoFilter filter, List<String> terms, PageRequest pageRequest) {
        Page<Photo> all = photoRepository.findAll(matching(userId, filter, terms, true), pageRequest);
        if (all.getTotalElements() > 0 || terms.size() == 1) {
            return all;
        }
        return photoRepository.findAll(matching(userId, filter, terms, false), pageRequest);
    }

    static Specification<Photo> matching(UUID userId, PhotoFilter filter, List<String> terms, boolean requireAllTerms) {
        return PhotoSpecifications.filtered(userId, filter).and(PhotoSpecifications.matchingTerms(terms, requireAllTerms));
    }

    private PhotoSearchResponse toResponse(Page<Photo> result, boolean aiRanked, String aiMessage) {
        List<PhotoResponse> content = result.getContent().stream().map(photoService::toPhotoResponse).toList();
        return new PhotoSearchResponse(content, result.getNumber(), result.getSize(), result.getTotalElements(),
                result.getTotalPages(), result.isLast(), aiRanked, aiMessage);
    }

    // ---- AI mode ----------------------------------------------------------

    private PhotoSearchResponse aiSearch(User user, SearchQuery query, PhotoFilter filter, int page, int size) {
        String cacheKey = user.getId() + "|" + filter + "|" + query.raw().toLowerCase(Locale.ROOT);
        List<UUID> ordered = cachedRanking(cacheKey);

        if (ordered == null) {
            UUID userId = user.getId();
            PageRequest limit = PageRequest.of(0, AI_RESULT_LIMIT);
            List<Photo> allTerms = photoRepository.findAll(matching(userId, filter, query.terms(), true), limit).getContent();
            List<Photo> anyTerm = query.terms().size() > 1
                    ? photoRepository.findAll(matching(userId, filter, query.terms(), false), limit).getContent()
                    : allTerms;

            List<PhotoSummary> pool = buildPool(userId, filter, allTerms, anyTerm);
            if (pool.isEmpty()) {
                String message = anyTerm.isEmpty()
                        ? null
                        : "None of these photos have been analyzed yet, so they can't be ranked by AI";
                return keywordSearch(user, query, filter, page, size, message);
            }

            Set<UUID> ids = new LinkedHashSet<>(geminiService.searchByDescription(query.raw(), pool));
            allTerms.forEach(photo -> ids.add(photo.getId()));
            if (ids.isEmpty()) {
                return keywordSearch(user, query, filter, page, size,
                        anyTerm.isEmpty() ? null : "AI didn't find a closer match, so these are regular results");
            }
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
                .filter(photo -> photo.getStatus() == filter.status())
                .map(photoService::toPhotoResponse)
                .toList();

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) ordered.size() / size);
        return new PhotoSearchResponse(content, page, size, ordered.size(), totalPages, to >= ordered.size(), true, null);
    }

    /**
     * Up to AI_POOL_SIZE analyzed photos for Gemini to choose from: those
     * matching every term, then any term, then the most recent other analyzed
     * photos (within the filter) so semantic matches without a shared word
     * still get a chance.
     */
    private List<PhotoSummary> buildPool(UUID userId, PhotoFilter filter, List<Photo> allTerms, List<Photo> anyTerm) {
        Map<UUID, Photo> pool = new LinkedHashMap<>();
        for (List<Photo> source : List.of(allTerms, anyTerm)) {
            for (Photo photo : source) {
                if (pool.size() == AI_POOL_SIZE) {
                    break;
                }
                if (isAnalyzed(photo)) {
                    pool.putIfAbsent(photo.getId(), photo);
                }
            }
        }
        if (pool.size() < AI_POOL_SIZE) {
            Specification<Photo> others = PhotoSpecifications.filtered(userId, filter).and(PhotoSpecifications.analyzed());
            for (Photo photo : photoRepository.findAll(others, PageRequest.of(0, AI_POOL_SIZE)).getContent()) {
                if (pool.size() == AI_POOL_SIZE) {
                    break;
                }
                pool.putIfAbsent(photo.getId(), photo);
            }
        }
        return pool.values().stream()
                .map(photo -> new PhotoSummary(photo.getId(), photo.getAiCaption(), photo.getAiTagList(), photo.getAiSceneType()))
                .toList();
    }

    private static boolean isAnalyzed(Photo photo) {
        return photo.getAiCaption() != null || photo.getAiTags() != null;
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

    // ---- Helpers ----------------------------------------------------------

    private static Map<String, Long> tagCounts(List<String> tagLists) {
        Map<String, Long> counts = new HashMap<>();
        for (String tags : tagLists) {
            Photo.splitList(tags).stream()
                    .map(TagVocabulary::normalizeSpelling)
                    .distinct()
                    .forEach(tag -> counts.merge(tag, 1L, Long::sum));
        }
        return counts;
    }

    private static List<FacetCountResponse> toFacets(Map<String, Long> counts, int limit, boolean flagGeneric) {
        return counts.entrySet().stream()
                .sorted(byCountThenName())
                .limit(limit)
                .map(entry -> new FacetCountResponse(entry.getKey(), entry.getValue(),
                        flagGeneric && TagVocabulary.isGeneric(entry.getKey())))
                .toList();
    }

    private static Comparator<Map.Entry<String, Long>> byCountThenName() {
        return Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry.comparingByKey());
    }
}
