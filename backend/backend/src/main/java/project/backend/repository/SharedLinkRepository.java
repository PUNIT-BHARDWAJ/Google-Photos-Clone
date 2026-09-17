package project.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import project.backend.domain.SharedLink;

public interface SharedLinkRepository extends JpaRepository<SharedLink, UUID> {

    Optional<SharedLink> findByToken(String token);

    Optional<SharedLink> findByPhotoIdAndUserId(UUID photoId, UUID userId);

    Optional<SharedLink> findByAlbumIdAndUserId(UUID albumId, UUID userId);

    List<SharedLink> findByUserId(UUID userId);

    void deleteByPhotoId(UUID photoId);

    void deleteByAlbumId(UUID albumId);
}
