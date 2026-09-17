package project.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import project.backend.domain.User;
import project.backend.dto.AddPhotosToAlbumReqest;
import project.backend.dto.AlbumResponse;
import project.backend.dto.CreateAlbumRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.UpdateAlbumRequest;
import project.backend.services.AlbumService;
import project.backend.services.UserService;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

    private final AlbumService albumService;
    private final UserService userService;

    public AlbumController(AlbumService albumService, UserService userService) {
        this.albumService = albumService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<AlbumResponse>> listAlbums(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumService.listAlbums(user));
    }

    @PostMapping
    public ResponseEntity<AlbumResponse> createAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateAlbumRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        AlbumResponse album = albumService.createAlbum(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(album);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlbumResponse> getAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumService.getAlbum(user, id));
    }

    @GetMapping("/{id}/photos")
    public ResponseEntity<PageResponse<PhotoResponse>> getAlbumPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PageResponse<PhotoResponse> photos = albumService.getPhotosForAlbum(
            // PageResponse<PhotoResponse> photos = albumService.getAlbumPhotos(
                user,
                id,
                PageRequest.of(page, size)
        );
        return ResponseEntity.ok(photos);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AlbumResponse> updateAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAlbumRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(albumService.updateAlbum(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumService.deleteAlbum(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<Void> addPhotos(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody AddPhotosToAlbumReqest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumService.addPhotosToAlbum(user, id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    public ResponseEntity<Void> removePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @PathVariable UUID photoId
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        albumService.removePhotosFromAlbum(user, id, photoId);
        return ResponseEntity.noContent().build();
    }
}
