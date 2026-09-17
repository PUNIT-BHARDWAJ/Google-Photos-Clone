package project.backend.dto;

/** One filter option and how many photos have it. generic marks tags too broad to suggest on their own. */
public record FacetCountResponse(
        String value,
        long count,
        boolean generic
) {
}
