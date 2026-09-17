package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import project.backend.services.AlbumSuggestionEngine.PhotoFacts;
import project.backend.services.AlbumSuggestionEngine.Suggestion;

class AlbumSuggestionEngineTest {

    // Photos are spread a day apart unless a test says otherwise, so no
    // accidental two-hour bursts.
    private static final Instant BASE = Instant.parse("2026-01-01T09:00:00Z");

    private static PhotoFacts photo(int index, String scene, List<String> tags) {
        return new PhotoFacts(UUID.randomUUID(), "https://ik.example/" + index + ".jpg", scene, tags,
                BASE.plus(Duration.ofDays(index)), false);
    }

    private static List<PhotoFacts> newestFirst(List<PhotoFacts> photos) {
        List<PhotoFacts> copy = new ArrayList<>(photos);
        copy.sort((a, b) -> b.takenAt().compareTo(a.takenAt()));
        return copy;
    }

    @Test
    void groupsByScene() {
        List<PhotoFacts> photos = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            photos.add(photo(i, "food", List.of("dinner")));
        }
        photos.add(photo(10, "portrait", List.of()));

        List<Suggestion> suggestions = AlbumSuggestionEngine.suggest(newestFirst(photos), List.of(), List.of(), ZoneOffset.UTC);

        assertThat(suggestions).extracting(Suggestion::name).containsExactly("Food & Drinks");
        Suggestion food = suggestions.get(0);
        assertThat(food.id()).isEqualTo("scene:food");
        assertThat(food.photoIds()).hasSize(5);
        assertThat(food.previewThumbnailUrls()).hasSize(4);
        assertThat(food.reason()).isEqualTo("5 photos AI recognized as food scenes");
    }

    @Test
    void suggestsTagsSharedByFiveOrMorePhotos() {
        List<PhotoFacts> photos = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            photos.add(photo(i, i % 2 == 0 ? "outdoor" : "landscape", List.of("beach", "outdoor", "blue")));
        }
        for (int i = 5; i < 9; i++) {
            photos.add(photo(i, null, List.of("snow")));
        }

        List<Suggestion> suggestions = AlbumSuggestionEngine.suggest(newestFirst(photos), List.of(), List.of(), ZoneOffset.UTC);

        // "outdoor" and "blue" are too generic, "snow" has only 4 photos.
        assertThat(suggestions).extracting(Suggestion::name).containsExactly("Beach Photos");
        assertThat(suggestions.get(0).reason()).isEqualTo("5 photos tagged \"beach\"");
    }

    @Test
    void findsTenPhotosTakenWithinTwoHours() {
        List<PhotoFacts> photos = new ArrayList<>();
        Instant start = Instant.parse("2026-09-16T08:30:00Z"); // 14:00 in Kolkata
        for (int i = 0; i < 10; i++) {
            photos.add(new PhotoFacts(UUID.randomUUID(), "t" + i, null, List.of(), start.plus(Duration.ofMinutes(12L * i)), false));
        }
        // Outside the window - not part of the burst.
        photos.add(new PhotoFacts(UUID.randomUUID(), "late", null, List.of(), start.plus(Duration.ofHours(5)), false));

        List<Suggestion> suggestions = AlbumSuggestionEngine.suggest(
                newestFirst(photos), List.of(), List.of(), ZoneId.of("Asia/Kolkata"));

        assertThat(suggestions).hasSize(1);
        Suggestion burst = suggestions.get(0);
        assertThat(burst.name()).isEqualTo("Sep 16 2026 — Afternoon");
        assertThat(burst.kind()).isEqualTo("DATE");
        assertThat(burst.photoIds()).hasSize(10);
        assertThat(burst.reason()).isEqualTo("10 photos taken within two hours");
    }

    @Test
    void nineClosePhotosAreNotABurst() {
        List<PhotoFacts> photos = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            photos.add(new PhotoFacts(UUID.randomUUID(), "t", null, List.of(), BASE.plus(Duration.ofMinutes(i)), false));
        }
        assertThat(AlbumSuggestionEngine.suggest(photos, List.of(), List.of(), ZoneOffset.UTC)).isEmpty();
    }

    @Test
    void skipsGroupsAnExistingAlbumCoversOrTitlesAlreadyUsed() {
        List<PhotoFacts> photos = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            photos.add(photo(i, "food", List.of("mountain")));
        }
        Set<UUID> album = new HashSet<>(photos.stream().map(PhotoFacts::id).toList().subList(0, 5));

        // 5 of 6 food photos (83%) are already in an album.
        assertThat(AlbumSuggestionEngine.suggest(newestFirst(photos), List.of(), List.of(album), ZoneOffset.UTC)).isEmpty();

        // The same photos under a scene and a tag: the title check removes the
        // scene, and the tag group is kept because nothing else covers it.
        List<Suggestion> suggestions = AlbumSuggestionEngine.suggest(
                newestFirst(photos), List.of("food & drinks"), List.of(), ZoneOffset.UTC);
        assertThat(suggestions).extracting(Suggestion::name).containsExactly("Mountain Photos");
    }

    @Test
    void doesNotRepeatTheSameGroupUnderTwoNames() {
        List<PhotoFacts> photos = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            photos.add(photo(i, "animal", List.of("dog")));
        }

        List<Suggestion> suggestions = AlbumSuggestionEngine.suggest(newestFirst(photos), List.of(), List.of(), ZoneOffset.UTC);

        assertThat(suggestions).extracting(Suggestion::name).containsExactly("Animals & Pets");
    }

    @Test
    void prefersAStarredCoverPhoto() {
        List<PhotoFacts> photos = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            photos.add(photo(i, "night", List.of()));
        }
        PhotoFacts starred = new PhotoFacts(UUID.randomUUID(), "starred.jpg", "night", List.of(), BASE, true);
        photos.add(starred);

        Suggestion night = AlbumSuggestionEngine.suggest(newestFirst(photos), List.of(), List.of(), ZoneOffset.UTC).get(0);

        assertThat(night.coverPhotoId()).isEqualTo(starred.id());
        assertThat(night.previewThumbnailUrls().get(0)).isEqualTo("starred.jpg");
    }

    @Test
    void namesPartsOfTheDay() {
        assertThat(AlbumSuggestionEngine.partOfDay(6)).isEqualTo("Morning");
        assertThat(AlbumSuggestionEngine.partOfDay(12)).isEqualTo("Afternoon");
        assertThat(AlbumSuggestionEngine.partOfDay(18)).isEqualTo("Evening");
        assertThat(AlbumSuggestionEngine.partOfDay(23)).isEqualTo("Night");
        assertThat(AlbumSuggestionEngine.partOfDay(2)).isEqualTo("Night");
        assertThat(AlbumSuggestionEngine.titleCase("golden retriever")).isEqualTo("Golden Retriever");
    }
}
