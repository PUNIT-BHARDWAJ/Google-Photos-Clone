package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import project.backend.services.SearchQueryParser.SearchQuery;

class SearchQueryParserTest {

    @Test
    void dropsFillerWordsAndReducesPlurals() {
        SearchQuery query = SearchQueryParser.parse("  Show me photos of dogs at the Beaches ");

        assertThat(query.raw()).isEqualTo("Show me photos of dogs at the Beaches");
        assertThat(query.terms()).containsExactly("dog", "beach");
        assertThat(query.naturalLanguage()).isTrue();
    }

    @Test
    void shortQueriesAreNotNaturalLanguage() {
        SearchQuery query = SearchQueryParser.parse("sunset beach");

        assertThat(query.terms()).containsExactly("sunset", "beach");
        assertThat(query.naturalLanguage()).isFalse();
    }

    @Test
    void fileNamesStayWholeAndAreNotSentToAi() {
        SearchQuery query = SearchQueryParser.parse("IMG_2041.jpg from holiday");

        assertThat(query.terms()).containsExactly("img_2041.jpg", "holiday");
        assertThat(query.naturalLanguage()).isFalse();
    }

    @Test
    void aQueryOfOnlyFillerWordsStillSearchesForItself() {
        assertThat(SearchQueryParser.parse("my photos").terms()).containsExactly("my photos");
        assertThat(SearchQueryParser.parse("   ").terms()).isEmpty();
    }

    @Test
    void stemsOnlyWhereItKeepsAPrefix() {
        assertThat(SearchQueryParser.stem("cities")).isEqualTo("cit");
        assertThat(SearchQueryParser.stem("glasses")).isEqualTo("glass");
        assertThat(SearchQueryParser.stem("boxes")).isEqualTo("box");
        assertThat(SearchQueryParser.stem("grass")).isEqualTo("grass");
        assertThat(SearchQueryParser.stem("bus")).isEqualTo("bus");
        assertThat(SearchQueryParser.stem("cactus")).isEqualTo("cactus");
        assertThat(SearchQueryParser.stem("2024s")).isEqualTo("2024s");
    }

    @Test
    void trimsPunctuationAroundWordsOnly() {
        assertThat(SearchQueryParser.parse("\"sunset,\" sun-kissed!").terms()).containsExactly("sunset", "sun-kissed");
    }

    @Test
    void escapesLikeWildcards() {
        assertThat(PhotoSearchService.escapeLikePattern("100%_off\\")).isEqualTo("100\\%\\_off\\\\");
    }
}
