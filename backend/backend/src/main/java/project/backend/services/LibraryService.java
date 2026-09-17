package project.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.imagekit.models.assets.AssetListResponse;
import io.imagekit.models.files.File;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.PhotoResponse;
import project.backend.dto.LibraryCountsResponse;
import project.backend.dto.StorageUsageResponse;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.AlbumRepository;
import project.backend.repository.PhotoRepository;
import project.backend.repository.SharedLinkRepository;
import project.backend.dto.CreatePhotoRequest;
import project.backend.dto.ImageKitAssetResponse;
import project.backend.dto.ImportPhotosRequst;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LibraryService {

    private final PhotoRepository photoRepository;
    private final ImageKitService imageKitService;
    private final PhotoService photoService;
    private final AlbumRepository albumRepository;
    private final SharedLinkRepository sharedLinkRepository;

    public LibraryService(
            PhotoRepository photoRepository,
            ImageKitService imageKitService,
            PhotoService photoService,
            AlbumRepository albumRepository,
            SharedLinkRepository sharedLinkRepository
    ) {
        this.photoRepository = photoRepository;
        this.imageKitService = imageKitService;
        this.photoService = photoService;
        this.albumRepository = albumRepository;
        this.sharedLinkRepository = sharedLinkRepository;
    }

    @Transactional(readOnly = true)
    public StorageUsageResponse getStorageUsage(User user) {
        long usedBytes = photoRepository.sumActivePhotoBytesByUserId(user.getId());
        long photoCount = photoRepository.countByUserIdAndStatus(user.getId(), PhotoStatus.ACTIVE);
        return new StorageUsageResponse(usedBytes, photoCount, null, null);
    }

    @Transactional(readOnly = true)
    public LibraryCountsResponse getCounts(User user) {
        UUID userId = user.getId();
        return new LibraryCountsResponse(
                photoRepository.countByUserIdAndStatus(userId, PhotoStatus.ACTIVE),
                photoRepository.countByUserIdAndStatusAndStarredTrue(userId, PhotoStatus.ACTIVE),
                albumRepository.countByUserId(userId),
                sharedLinkRepository.countActiveByUserId(userId, Instant.now()),
                photoRepository.countByUserIdAndStatus(userId, PhotoStatus.ARCHIVE),
                photoRepository.countByUserIdAndStatus(userId, PhotoStatus.TRASH));
    }

    @Transactional(readOnly = true)
    public List<ImageKitAssetResponse> listImportableAssets(User user) {
        String folder = ImageKitService.userFolder(user.getId());
        List<AssetListResponse> assets = imageKitService.listAssetsInFolder(folder, 0, 100);

        List<ImageKitAssetResponse> responses = new ArrayList<>();
        for (AssetListResponse asset : assets) {
            if (!asset.isFile()) {
                continue;
            }
     
            File file = asset.asFile();
            String fileId = file.fileId().orElse(null);
            if (fileId == null) {
                continue;
            }

            String url = file.url().orElse("");
            responses.add(new ImageKitAssetResponse(
                    fileId,
                    file.name().orElse("Untitled"),
                    url,
                    file.thumbnail().orElse(url),
                    file.size().map(Double::longValue).orElse(0L),
                    file.width().map(Double::intValue).orElse(null),
                    file.height().map(Double::intValue).orElse(null),
                    file.mime().orElse(null),
    photoRepository.existsByImageKitFileIdAndUserId(fileId, user.getId())
            ));
        }

        return responses;
    }

    @Transactional
    public List<PhotoResponse> importAssets(User user, ImportPhotosRequst request) {
        List<PhotoResponse> imported = new ArrayList<>();

        for (String fileId : request.imagekitFileIds()) {
            if (photoRepository.existsByImageKitFileIdAndUserId(fileId, user.getId())) {
                continue;
            }

            File file = findFile(user, fileId);
            CreatePhotoRequest createRequest = new CreatePhotoRequest(
                    fileId,
                    file.name().orElse("Imported photo"),
                    file.url().orElseThrow(() -> new ResourceNotFoundException("Asset URL missing")),
                    file.thumbnail().orElse(null),
                    file.mime().orElse(null),
                    file.size().map(Double::longValue).orElse(0L),
                    file.width().map(Double::intValue).orElse(null),
                    file.height().map(Double::intValue).orElse(null)
            );

            imported.add(photoService.createPhoto(user, createRequest));
        }

        return imported;
    }

    private File findFile(User user, String fileId) {
        return imageKitService.listAssetsInFolder(ImageKitService.userFolder(user.getId()), 0, 100).stream()
                .filter(AssetListResponse::isFile)
                .map(AssetListResponse::asFile)
                .filter(file -> file.fileId().map(fileId::equals).orElse(false))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("ImageKit asset not found"));
    }
}
