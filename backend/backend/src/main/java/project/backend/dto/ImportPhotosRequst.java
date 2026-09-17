package project.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record ImportPhotosRequst(
   @NotEmpty List<String> imagekitFileIds
) {
} 