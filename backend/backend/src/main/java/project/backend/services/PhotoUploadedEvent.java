package project.backend.services;

import java.util.UUID;

/** Published inside the upload transaction; AI analysis starts after it commits. */
public record PhotoUploadedEvent(UUID photoId) {
}
