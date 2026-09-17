package project.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import project.backend.domain.SharedLink;

public interface SharedLinkRepository extends JpaRepository<SharedLink, UUID> {

    Optional<SharedLink> findByToken(String token);

    Optional<SharedLink> findByPhotoIdAndUserId(UUID photoId, UUID userId);

    Optional<SharedLink> findByAlbumIdAndUserId(UUID albumId, UUID userId);

    List<SharedLink> findByUserId(UUID userId);

    // Matches what the Shared Links page lists: expired links are left out.
    @Query("""
        SELECT COUNT(l) FROM SharedLink l
        WHERE l.user.id = :userId AND (l.expiresAt IS NULL OR l.expiresAt > :now)
    """)
    long countActiveByUserId(@Param("userId") UUID userId, @Param("now") Instant now);

    void deleteByPhotoId(UUID photoId);

    void deleteByAlbumId(UUID albumId);
}
