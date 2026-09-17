package project.backend.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;

public interface PhotoRepository extends JpaRepository<Photo, UUID>, JpaSpecificationExecutor<Photo> {

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

    List<Photo> findByIdInAndUserId(List<UUID> ids, UUID userId);
    Optional<Photo> findByIdAndUserId(UUID id, UUID userId);

    Optional<Photo> findByIdAndUserIdAndStatus(UUID id, UUID userId, PhotoStatus status);

    boolean existsByImageKitFileIdAndUserId(String imageKitFileId, UUID userId);

    long countByUserIdAndStatus(UUID userId, PhotoStatus status);

    long countByUserIdAndStatusAndStarredTrue(UUID userId, PhotoStatus status);

    @Query("""
        SELECT COALESCE(SUM(p.sizeBytes), 0)
        FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status
    """)
    long sumActivePhotoBytesByUserId(UUID userId, PhotoStatus status);

    default long sumActivePhotoBytesByUserId(UUID userId) {
        return sumActivePhotoBytesByUserId(userId, PhotoStatus.ACTIVE);
    }

    // ---- AI analysis ----

    // Newest first, so a bulk run fills in the photos the user sees first.
    @Query("""
        SELECT p.id FROM Photo p
        WHERE p.user.id = :userId AND p.status IN :statuses AND p.aiProcessedAt IS NULL
        ORDER BY COALESCE(p.metadata.dateTaken, p.createdAt) DESC, p.createdAt DESC, p.id DESC
    """)
    List<UUID> findIdsNeedingAiAnalysis(UUID userId, Collection<PhotoStatus> statuses);

    long countByUserIdAndStatusIn(UUID userId, Collection<PhotoStatus> statuses);

    long countByUserIdAndStatusInAndAiProcessedAtIsNotNull(UUID userId, Collection<PhotoStatus> statuses);

    long countByUserIdAndStatusInAndAiProcessedAtIsNullAndAiErrorIsNotNull(UUID userId, Collection<PhotoStatus> statuses);

    // Targeted updates rather than save(): analysis runs for seconds on a
    // background thread, and saving a stale entity would undo anything the
    // user changed meanwhile (starring, archiving, trashing).
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        UPDATE Photo p
        SET p.aiCaption = :caption, p.aiTags = :tags, p.aiSceneType = :sceneType,
            p.aiDominantColors = :dominantColors, p.aiProcessedAt = :processedAt, p.aiError = NULL
        WHERE p.id = :photoId
    """)
    int saveAiAnalysis(UUID photoId, String caption, String tags, String sceneType, String dominantColors, Instant processedAt);

    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Photo p SET p.aiError = :error WHERE p.id = :photoId")
    int saveAiError(UUID photoId, String error);

    @Query("""
        SELECT p.aiTags FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status AND p.aiTags IS NOT NULL
    """)
    List<String> findAiTags(UUID userId, PhotoStatus status);

    // [sceneType, dominantColors, tags] for every analyzed photo - facet counts.
    @Query("""
        SELECT p.aiSceneType, p.aiDominantColors, p.aiTags FROM Photo p
        WHERE p.user.id = :userId AND p.status = :status AND p.aiProcessedAt IS NOT NULL
    """)
    List<Object[]> findAiFacetValues(UUID userId, PhotoStatus status);

    // Analyses stored before tags and colors were normalized to "gray".
    @Query("""
        SELECT p FROM Photo p
        WHERE LOWER(p.aiTags) LIKE '%grey%' OR LOWER(p.aiDominantColors) LIKE '%grey%'
    """)
    List<Photo> findWithGreySpelling();

    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Photo p SET p.aiTags = :tags, p.aiDominantColors = :dominantColors WHERE p.id = :photoId")
    int saveAiLists(UUID photoId, String tags, String dominantColors);
}
