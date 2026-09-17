package project.backend.dto;

import java.util.List;

/** Filter options present in the library: AI scene types, color families and tags, most common first. */
public record PhotoFacetsResponse(
        List<FacetCountResponse> scenes,
        List<FacetCountResponse> colors,
        List<FacetCountResponse> tags
) {
}
