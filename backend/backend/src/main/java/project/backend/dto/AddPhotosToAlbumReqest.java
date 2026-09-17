package project.backend.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

public record AddPhotosToAlbumReqest( 
    @NotEmpty List<UUID> photoIds
) {
}
