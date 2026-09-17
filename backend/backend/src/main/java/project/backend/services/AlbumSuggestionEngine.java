package project.backend.services;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Suggests albums from data already in the database - no Gemini call. Three
 * kinds of group: photos sharing an AI scene type, photos sharing an AI tag
 * (5+), and bursts of 10+ photos taken within two hours. Groups that an
 * existing album already covers, or that mostly repeat an earlier suggestion,
 * are left out.
 */
public final class AlbumSuggestionEngine {

    public record PhotoFacts(UUID id, String thumbnailUrl, String sceneType, List<String> tags, Instant takenAt, boolean starred) {
    }

    public record Suggestion(
            String id,
            String kind,
            String name,
            List<UUID> photoIds,
            UUID coverPhotoId,
            List<String> previewThumbnailUrls,
            String reason
    ) {
    }

    static final int MIN_SCENE_PHOTOS = 4;
    static final int MIN_TAG_PHOTOS = 5;
    static final int MIN_BURST_PHOTOS = 10;
    static final Duration BURST_WINDOW = Duration.ofHours(2);
    static final int MAX_TAG_SUGGESTIONS = 6;
    static final int MAX_DATE_SUGGESTIONS = 4;
    static final int MAX_SUGGESTIONS = 12;
    static final double OVERLAP_THRESHOLD = 0.8;
    static final int PREVIEW_SIZE = 4;

    static final Map<String, String> SCENE_ALBUM_NAMES = Map.ofEntries(
            Map.entry("outdoor", "Outdoor Adventures"),
            Map.entry("indoor", "Indoor Moments"),
            Map.entry("portrait", "Portraits"),
            Map.entry("landscape", "Landscapes"),
            Map.entry("food", "Food & Drinks"),
            Map.entry("document", "Documents"),
            Map.entry("screenshot", "Screenshots"),
            Map.entry("art", "Art & Design"),
            Map.entry("animal", "Animals & Pets"),
            Map.entry("vehicle", "Vehicles"),
            Map.entry("architecture", "Architecture"),
            Map.entry("night", "Night Shots"),
            Map.entry("macro", "Close-ups"),
            Map.entry("sport", "Sports"),
            Map.entry("event", "Events & Celebrations"));

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MMM d yyyy", Locale.ENGLISH);

    private AlbumSuggestionEngine() {
    }

    /**
     * @param photos         active photos, newest first
     * @param existingTitles titles of the user's albums (any case)
     * @param existingAlbums photo ids of each existing album
     * @param zone           the user's time zone, for date names like "Sep 16 2026 — Afternoon"
     */
    public static List<Suggestion> suggest(
            List<PhotoFacts> photos,
            Collection<String> existingTitles,
            Collection<Set<UUID>> existingAlbums,
            ZoneId zone
    ) {
        Map<UUID, PhotoFacts> byId = new HashMap<>();
        photos.forEach(photo -> byId.put(photo.id(), photo));

        List<Suggestion> candidates = new ArrayList<>();
        candidates.addAll(sceneGroups(photos, byId));
        candidates.addAll(tagGroups(photos, byId));
        candidates.addAll(dateBursts(photos, byId, zone));

        Set<String> takenTitles = new HashSet<>();
        existingTitles.forEach(title -> takenTitles.add(title.trim().toLowerCase(Locale.ROOT)));

        List<Suggestion> accepted = new ArrayList<>();
        int tagSuggestions = 0;
        for (Suggestion candidate : candidates) {
            if (accepted.size() == MAX_SUGGESTIONS) {
                break;
            }
            // Checked here rather than when building candidates, so tags that
            // only repeat a scene group don't use up the tag allowance.
            boolean isTag = candidate.kind().equals("TAG");
            if ((isTag && tagSuggestions == MAX_TAG_SUGGESTIONS)
                    || takenTitles.contains(candidate.name().toLowerCase(Locale.ROOT))) {
                continue;
            }
            Set<UUID> group = new HashSet<>(candidate.photoIds());
            boolean coveredByAlbum = existingAlbums.stream()
                    .anyMatch(album -> shareOf(group, album) >= OVERLAP_THRESHOLD);
            boolean repeatsSuggestion = accepted.stream()
                    .anyMatch(other -> jaccard(group, new HashSet<>(other.photoIds())) >= OVERLAP_THRESHOLD);
            if (!coveredByAlbum && !repeatsSuggestion) {
                accepted.add(candidate);
                tagSuggestions += isTag ? 1 : 0;
                takenTitles.add(candidate.name().toLowerCase(Locale.ROOT));
            }
        }
        return accepted;
    }

    private static List<Suggestion> sceneGroups(List<PhotoFacts> photos, Map<UUID, PhotoFacts> byId) {
        Map<String, List<UUID>> groups = new LinkedHashMap<>();
        for (PhotoFacts photo : photos) {
            String scene = photo.sceneType();
            if (scene != null && SCENE_ALBUM_NAMES.containsKey(scene)) {
                groups.computeIfAbsent(scene, key -> new ArrayList<>()).add(photo.id());
            }
        }
        return groups.entrySet().stream()
                .filter(entry -> entry.getValue().size() >= MIN_SCENE_PHOTOS)
                .sorted(bySizeThenKey())
                .map(entry -> build("scene:" + entry.getKey(), "SCENE", SCENE_ALBUM_NAMES.get(entry.getKey()),
                        entry.getValue(), byId,
                        entry.getValue().size() + " photos AI recognized as " + entry.getKey() + " scenes"))
                .toList();
    }

    private static List<Suggestion> tagGroups(List<PhotoFacts> photos, Map<UUID, PhotoFacts> byId) {
        Map<String, List<UUID>> groups = new LinkedHashMap<>();
        for (PhotoFacts photo : photos) {
            if (photo.tags() == null) {
                continue;
            }
            for (String tag : new HashSet<>(photo.tags())) {
                if (!TagVocabulary.isGeneric(tag)) {
                    groups.computeIfAbsent(tag, key -> new ArrayList<>()).add(photo.id());
                }
            }
        }
        return groups.entrySet().stream()
                .filter(entry -> entry.getValue().size() >= MIN_TAG_PHOTOS)
                .sorted(bySizeThenKey())
                .map(entry -> build("tag:" + entry.getKey(), "TAG", titleCase(entry.getKey()) + " Photos",
                        entry.getValue(), byId,
                        entry.getValue().size() + " photos tagged \"" + entry.getKey() + "\""))
                .toList();
    }

    /** Greedy two-hour windows over capture time (upload time for photos without EXIF). */
    private static List<Suggestion> dateBursts(List<PhotoFacts> photos, Map<UUID, PhotoFacts> byId, ZoneId zone) {
        List<PhotoFacts> chronological = photos.stream()
                .filter(photo -> photo.takenAt() != null)
                .sorted(Comparator.comparing(PhotoFacts::takenAt))
                .toList();

        List<List<PhotoFacts>> bursts = new ArrayList<>();
        int start = 0;
        while (start < chronological.size()) {
            Instant windowEnd = chronological.get(start).takenAt().plus(BURST_WINDOW);
            int end = start;
            while (end + 1 < chronological.size() && !chronological.get(end + 1).takenAt().isAfter(windowEnd)) {
                end++;
            }
            if (end - start + 1 >= MIN_BURST_PHOTOS) {
                bursts.add(chronological.subList(start, end + 1));
                start = end + 1;
            } else {
                start++;
            }
        }

        List<Suggestion> suggestions = new ArrayList<>();
        Map<String, Integer> nameCounts = new HashMap<>();
        // Newest bursts first, like the timeline.
        for (int i = bursts.size() - 1; i >= 0 && suggestions.size() < MAX_DATE_SUGGESTIONS; i--) {
            List<PhotoFacts> burst = bursts.get(i);
            ZonedDateTime first = burst.get(0).takenAt().atZone(zone);
            String name = DATE_FORMAT.format(first) + " — " + partOfDay(first.getHour());
            int count = nameCounts.merge(name, 1, Integer::sum);
            if (count > 1) {
                name = name + " (" + count + ")";
            }
            List<UUID> ids = new ArrayList<>(burst.stream().map(PhotoFacts::id).toList());
            Collections.reverse(ids);
            suggestions.add(build("date:" + burst.get(0).takenAt().getEpochSecond(), "DATE", name, ids, byId,
                    burst.size() + " photos taken within two hours"));
        }
        return suggestions;
    }

    static String partOfDay(int hour) {
        if (hour >= 5 && hour < 12) {
            return "Morning";
        }
        if (hour >= 12 && hour < 17) {
            return "Afternoon";
        }
        if (hour >= 17 && hour < 21) {
            return "Evening";
        }
        return "Night";
    }

    private static Suggestion build(String id, String kind, String name, List<UUID> photoIds,
                                    Map<UUID, PhotoFacts> byId, String reason) {
        UUID cover = photoIds.stream()
                .filter(photoId -> byId.get(photoId).starred())
                .findFirst()
                .orElse(photoIds.get(0));

        List<String> previews = new ArrayList<>();
        previews.add(byId.get(cover).thumbnailUrl());
        for (UUID photoId : photoIds) {
            if (previews.size() == PREVIEW_SIZE) {
                break;
            }
            if (!photoId.equals(cover)) {
                previews.add(byId.get(photoId).thumbnailUrl());
            }
        }
        return new Suggestion(id, kind, name, List.copyOf(photoIds), cover, previews, reason);
    }

    private static Comparator<Map.Entry<String, List<UUID>>> bySizeThenKey() {
        return Comparator.<Map.Entry<String, List<UUID>>>comparingInt(entry -> entry.getValue().size())
                .reversed()
                .thenComparing(Map.Entry::getKey);
    }

    static String titleCase(String tag) {
        StringBuilder out = new StringBuilder(tag.length());
        boolean upperNext = true;
        for (char c : tag.toCharArray()) {
            out.append(upperNext ? Character.toUpperCase(c) : c);
            upperNext = c == ' ' || c == '-';
        }
        return out.toString();
    }

    /** How much of the group the album already holds. */
    private static double shareOf(Set<UUID> group, Set<UUID> album) {
        if (group.isEmpty()) {
            return 0;
        }
        long inAlbum = group.stream().filter(album::contains).count();
        return (double) inAlbum / group.size();
    }

    private static double jaccard(Set<UUID> a, Set<UUID> b) {
        long shared = a.stream().filter(b::contains).count();
        long union = a.size() + b.size() - shared;
        return union == 0 ? 0 : (double) shared / union;
    }
}
