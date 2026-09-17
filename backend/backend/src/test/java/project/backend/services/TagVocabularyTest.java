package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import project.backend.domain.PhotoStatus;

class TagVocabularyTest {

    @Test
    void styleFormatAndColorWordsAreGeneric() {
        assertThat(TagVocabulary.isGeneric("minimalist")).isTrue();
        assertThat(TagVocabulary.isGeneric("Diagonal Lines")).isTrue();
        assertThat(TagVocabulary.isGeneric("texture")).isTrue();
        assertThat(TagVocabulary.isGeneric("sky blue")).isTrue();
        assertThat(TagVocabulary.isGeneric("   ")).isTrue();

        assertThat(TagVocabulary.isGeneric("beach")).isFalse();
        assertThat(TagVocabulary.isGeneric("blue sky")).isFalse();
        assertThat(TagVocabulary.isGeneric("golden hour")).isFalse();
        assertThat(TagVocabulary.isGeneric("nature")).isFalse();
    }

    @Test
    void colorsGroupIntoFamilies() {
        assertThat(TagVocabulary.colorFamily("Light Blue")).isEqualTo("blue");
        assertThat(TagVocabulary.colorFamily("dark grey")).isEqualTo("gray");
        assertThat(TagVocabulary.colorFamily("coral")).isEqualTo("coral");
    }

    @Test
    void greyBecomesGrayAsAWholeWordOnly() {
        assertThat(TagVocabulary.normalizeSpelling("grey")).isEqualTo("gray");
        assertThat(TagVocabulary.normalizeSpelling("dark grey sky")).isEqualTo("dark gray sky");
        assertThat(TagVocabulary.normalizeSpelling("greyhound")).isEqualTo("greyhound");
        assertThat(TagVocabulary.normalizeSpelling(List.of("grey", "gray", "white"))).containsExactly("gray", "white");
    }

    @Test
    void geminiColorsAndTagsUseOneSpelling() {
        assertThat(GeminiResponseParser.normalizeColors(List.of("Grey", "gray", "blue"))).containsExactly("gray", "blue");
        assertThat(GeminiResponseParser.normalizeTags(List.of("grey cat", "gray cat", "sofa"))).containsExactly("gray cat", "sofa");
        assertThat(SearchQueryParser.parse("grey cats").terms()).containsExactly("gray", "cat");
    }

    @Test
    void filtersNormalizeTheirValues() {
        PhotoFilter filter = new PhotoFilter(null, null, " Landscape ", "Grey", List.of("Beach", "beach", " ", "Palm Tree"),
                null, null, null, null);

        assertThat(filter.status()).isEqualTo(PhotoStatus.ACTIVE);
        assertThat(filter.scene()).isEqualTo("landscape");
        assertThat(filter.color()).isEqualTo("gray");
        assertThat(filter.tags()).containsExactly("beach", "palm tree");
        assertThat(filter.sort()).isEqualTo(PhotoSort.TAKEN_DESC);
        assertThat(filter.hasConstraints()).isTrue();
        assertThat(PhotoFilter.of(PhotoStatus.ARCHIVE).hasConstraints()).isFalse();
        assertThat(new PhotoFilter(null, null, null, null, null, Instant.EPOCH, null, null, null).hasConstraints()).isTrue();
    }

    @Test
    void sortParamsAreLenient() {
        assertThat(PhotoSort.fromParam("added_asc")).isEqualTo(PhotoSort.ADDED_ASC);
        assertThat(PhotoSort.fromParam("TAKEN_ASC")).isEqualTo(PhotoSort.TAKEN_ASC);
        assertThat(PhotoSort.fromParam("sideways")).isEqualTo(PhotoSort.TAKEN_DESC);
        assertThat(PhotoSort.fromParam(null)).isEqualTo(PhotoSort.TAKEN_DESC);
        assertThat(PhotoSort.ADDED_ASC.ascending()).isTrue();
        assertThat(PhotoSort.ADDED_ASC.byUploadDate()).isTrue();
        assertThat(PhotoSort.TAKEN_DESC.byUploadDate()).isFalse();
    }

    @Test
    void downloadNamesAreSafeAndUnique() {
        assertThat(PhotoDownloadService.safeName("../evil/name?.jpg")).isEqualTo(".._evil_name_.jpg");
        assertThat(PhotoDownloadService.safeName("  ")).isEqualTo("photo.jpg");
        assertThat(PhotoDownloadService.safeName("..")).isEqualTo("photo.jpg");

        Set<String> used = new HashSet<>();
        assertThat(PhotoDownloadService.uniqueName("beach.jpg", used)).isEqualTo("beach.jpg");
        assertThat(PhotoDownloadService.uniqueName("Beach.jpg", used)).isEqualTo("Beach (2).jpg");
        assertThat(PhotoDownloadService.uniqueName("beach.jpg", used)).isEqualTo("beach (3).jpg");
        assertThat(PhotoDownloadService.uniqueName("scan", used)).isEqualTo("scan");
        assertThat(PhotoDownloadService.uniqueName("scan", used)).isEqualTo("scan (2)");
    }
}
