package project.backend.dto;

import java.util.List;

public record PublicAlbumResponse(
        String title,
        List<PublicPhotoResponse> photos
) {
}
