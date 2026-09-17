package project.backend.dto;

/** Item counts for the navigation badges. */
public record LibraryCountsResponse(
        long photos,
        long favorites,
        long albums,
        long sharedLinks,
        long archive,
        long trash
) {
}
