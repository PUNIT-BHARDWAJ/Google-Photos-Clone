package project.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import project.backend.domain.User;
import project.backend.dto.CreateSharedLinkRequest;
import project.backend.dto.PublicAlbumResponse;
import project.backend.dto.PublicPhotoResponse;
import project.backend.dto.SharedLinkResponse;
import project.backend.services.SharedLinkService;
import project.backend.services.UserService;

// Mirrors PhotoAiController's pattern of a dedicated controller for a
// cross-cutting concern, rather than folding this into PhotoController/
// AlbumController - it also owns the /api/public/** endpoints, which don't
// belong under either of those.
@RestController
public class SharedLinkController {

    private final SharedLinkService sharedLinkService;
    private final UserService userService;

    public SharedLinkController(SharedLinkService sharedLinkService, UserService userService) {
        this.sharedLinkService = sharedLinkService;
        this.userService = userService;
    }

    @PostMapping("/api/photos/{id}/share")
    public ResponseEntity<SharedLinkResponse> sharePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CreateSharedLinkRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        Integer expiryDays = request != null ? request.expiryDays() : null;
        return ResponseEntity.ok(sharedLinkService.createPhotoLink(user, id, expiryDays));
    }

    @PostMapping("/api/albums/{id}/share")
    public ResponseEntity<SharedLinkResponse> shareAlbum(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CreateSharedLinkRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        Integer expiryDays = request != null ? request.expiryDays() : null;
        return ResponseEntity.ok(sharedLinkService.createAlbumLink(user, id, expiryDays));
    }

    @GetMapping("/api/shared-links")
    public ResponseEntity<List<SharedLinkResponse>> listLinks(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(sharedLinkService.getUserLinks(user));
    }

    @DeleteMapping("/api/shared-links/{id}")
    public ResponseEntity<Void> revokeLink(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        sharedLinkService.revokeLink(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/public/photos/{token}")
    public ResponseEntity<PublicPhotoResponse> getSharedPhoto(@PathVariable String token) {
        return ResponseEntity.ok(sharedLinkService.getSharedPhoto(token));
    }

    @GetMapping("/api/public/albums/{token}")
    public ResponseEntity<PublicAlbumResponse> getSharedAlbum(@PathVariable String token) {
        return ResponseEntity.ok(sharedLinkService.getSharedAlbum(token));
    }
}
