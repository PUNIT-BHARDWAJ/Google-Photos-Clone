package project.backend.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;

public record UpdateAlbumRequest(
    @Size(min = 1, max = 255) String title,
    UUID coverPhotoId
) {
}