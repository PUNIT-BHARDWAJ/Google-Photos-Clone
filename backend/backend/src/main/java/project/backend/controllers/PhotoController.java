package project.backend.controllers;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.BulkPhotoActionReqest;
import project.backend.dto.CreatePhotoRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoFacetsResponse;
import project.backend.dto.PhotoMetadataResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.PhotoSearchResponse;
import project.backend.services.PhotoDownloadService;
import project.backend.services.PhotoFilter;
import project.backend.services.PhotoSearchService;
import project.backend.services.PhotoSort;
import project.backend.services.PhotoService;
import project.backend.services.UserService;

@RestController 
@RequestMapping("/api")

public class PhotoController {
    private final PhotoService photoService;
    private final PhotoSearchService photoSearchService;
    private final PhotoDownloadService photoDownloadService;
    private final UserService userService;

    public PhotoController(
            PhotoService photoService,
            PhotoSearchService photoSearchService,
            PhotoDownloadService photoDownloadService,
            UserService userService
    ) {
        this.photoService = photoService;
        this.photoSearchService = photoSearchService;
        this.photoDownloadService = photoDownloadService;
        this.userService = userService;
    }
    @GetMapping("/photos/{id}")
    public ResponseEntity<PhotoResponse> getPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoService.getPhoto(user, id));
    }

    @GetMapping("/photos/{id}/metadata")
    public ResponseEntity<PhotoMetadataResponse> getPhotoMetadata(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoService.getPhotoMetadata(user, id));
    }


    /**
     * The timeline, optionally narrowed (starred, scene, color, tag, date
     * range, added after) and sorted: taken_desc (default), taken_asc,
     * added_desc or added_asc.
     */
    @GetMapping("/photos")
    public ResponseEntity<PageResponse<PhotoResponse>> listPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "ACTIVE") PhotoStatus status,
            @RequestParam(required = false) Boolean starred,
            @RequestParam(required = false) String scene,
            @RequestParam(required = false) String color,
            @RequestParam(name = "tag", required = false) List<String> tags,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Instant addedAfter,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoFilter filter = new PhotoFilter(status, starred, scene, color, tags, from, to, addedAfter, PhotoSort.fromParam(sort));
        return ResponseEntity.ok(photoService.listPhotos(user, filter, pageRequest(page, size)));
    }

    /** AI scene types, color families and tags in the library, with counts - filter options. */
    @GetMapping("/photos/facets")
    public ResponseEntity<PhotoFacetsResponse> getFacets(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoSearchService.facets(user));
    }

    /** One photo as its original file, or several as a zip. */
    @PostMapping("/photos/download")
    public void downloadPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionReqest request,
            HttpServletResponse response
    ) throws IOException {
        User user = userService.getByEmail(userDetails.getUsername());
        List<PhotoDownloadService.DownloadItem> items = photoDownloadService.prepare(user, request.photoIds());
        if (items.size() == 1) {
            photoDownloadService.writeSingle(items.get(0), response);
            return;
        }
        response.setContentType("application/zip");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename("photos.zip").build().toString());
        photoDownloadService.writeZip(items, response.getOutputStream());
    }

    @PutMapping("/photos/{id}/star")
    public ResponseEntity<PhotoResponse> toggleStar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoService.toggleStar(user, id));
    }

    // Matches file names, AI captions, AI tags and scene types, narrowed by the
    // same filters as the timeline. q may be empty when a filter is given.
    // ai=true lets Gemini choose and rank matches for descriptive (3+ word) queries.
    @GetMapping("/photos/search")
    public ResponseEntity<PhotoSearchResponse> searchPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "ACTIVE") PhotoStatus status,
            @RequestParam(required = false) String scene,
            @RequestParam(required = false) String color,
            @RequestParam(name = "tag", required = false) List<String> tags,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "false") boolean ai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoFilter filter = new PhotoFilter(status, null, scene, color, tags, from, to, null, PhotoSort.TAKEN_DESC);
        return ResponseEntity.ok(photoSearchService.search(
                user, q, filter, ai, Math.max(0, page), Math.clamp(size, 1, 100)));
    }

    private static PageRequest pageRequest(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 100));
    }

    @PostMapping(value = "/photos/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("file") MultipartFile file
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoResponse photo = photoService.uploadPhoto(user, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }

    @PostMapping("/photos")
    public ResponseEntity<PhotoResponse> createPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePhotoRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoResponse photo = photoService.createPhoto(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }

    @PostMapping("/photos/archive")
    public ResponseEntity<Void> archivePhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionReqest reqest
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.archivePhotos(user, reqest.photoIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photos/trash")
    public ResponseEntity<Void> trashPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionReqest reqest
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.movePhotosToTrash(user, reqest.photoIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photos/restore")
    public ResponseEntity<Void> responseEntity(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam PhotoStatus status,
            @Valid @RequestBody BulkPhotoActionReqest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.restorePhotos(user, request.photoIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photos/delete-permanent")
    public ResponseEntity<Void> permanentlyDeletePhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BulkPhotoActionReqest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.permanentlyDeletePhotos(user, request.photoIds());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> deletePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        photoService.permanentlyDeletePhoto(user, id);
        return ResponseEntity.noContent().build();
    }
}