package project.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    // Timeline order: when the photo was taken, falling back to when it was
    // uploaded - the same date the frontend groups day headings by. Ordering
    // by upload time alone let a page of recent uploads carry old capture
    // dates, so day groups reshuffled as later pages loaded. Callers pass an
    // unsorted Pageable; the ORDER BY here is the whole ordering.
    @Query(value = """
        SELECT p FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status
        ORDER BY COALESCE(p.metadata.dateTaken, p.createdAt) DESC, p.createdAt DESC, p.id DESC
    """, countQuery = """
        SELECT COUNT(p) FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status
    """)
    Page<Photo> findTimeline(UUID userId, PhotoStatus status, Pageable pageable);

    @Query(value = """
        SELECT p FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status AND p.starred = :starred
        ORDER BY COALESCE(p.metadata.dateTaken, p.createdAt) DESC, p.createdAt DESC, p.id DESC
    """, countQuery = """
        SELECT COUNT(p) FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status AND p.starred = :starred
    """)
    Page<Photo> findTimelineByStarred(UUID userId, PhotoStatus status, boolean starred, Pageable pageable);

    // `pattern` is a lowercase LIKE pattern with %, _ and \ already escaped.
    // Matches the stored ImageKit name or the original upload name.
    @Query(value = """
        SELECT p FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status
          AND (LOWER(p.fileName) LIKE :pattern ESCAPE '\\'
               OR LOWER(p.originalFileName) LIKE :pattern ESCAPE '\\')
        ORDER BY COALESCE(p.metadata.dateTaken, p.createdAt) DESC, p.createdAt DESC, p.id DESC
    """, countQuery = """
        SELECT COUNT(p) FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status
          AND (LOWER(p.fileName) LIKE :pattern ESCAPE '\\'
               OR LOWER(p.originalFileName) LIKE :pattern ESCAPE '\\')
    """)
    Page<Photo> searchTimeline(UUID userId, PhotoStatus status, String pattern, Pageable pageable);

    List<Photo> findByIdInAndUserId(List<UUID> ids, UUID userId);
    Optional<Photo> findByIdAndUserId(UUID id, UUID userId);

    Optional<Photo> findByIdAndUserIdAndStatus(UUID id, UUID userId, PhotoStatus status);

    boolean existsByImageKitFileIdAndUserId(String imageKitFileId, UUID userId);

    long countByUserIdAndStatus(UUID userId, PhotoStatus status);

    @Query("""
        SELECT COALESCE(SUM(p.sizeBytes), 0)
        FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status
    """)
    long sumActivePhotoBytesByUserId(UUID userId, PhotoStatus status);

    default long sumActivePhotoBytesByUserId(UUID userId) {
        return sumActivePhotoBytesByUserId(userId, PhotoStatus.ACTIVE);
    }
}
