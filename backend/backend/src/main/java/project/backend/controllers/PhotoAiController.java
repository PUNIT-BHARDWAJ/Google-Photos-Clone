package project.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import java.util.UUID;

import project.backend.domain.User;
import project.backend.dto.AiTransformPreviewResponse;
import project.backend.dto.AiTransformRequest;
import project.backend.dto.EditSuggestionRequest;
import project.backend.dto.EditSuggestionResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.SaveEditRequest;
import project.backend.services.AiAnalysisService;
import project.backend.services.AiTransformService;
import project.backend.services.ImageEditService;
import project.backend.services.UserService;

@RestController
@RequestMapping("/api/photos/{photoId}/ai")
public class PhotoAiController {

    private final AiTransformService aiTransformService;
    private final AiAnalysisService aiAnalysisService;
    private final ImageEditService imageEditService;
    private final UserService userService;

    public PhotoAiController(
            AiTransformService aiTransformService,
            AiAnalysisService aiAnalysisService,
            ImageEditService imageEditService,
            UserService userService
    ) {
        this.aiTransformService = aiTransformService;
        this.aiAnalysisService = aiAnalysisService;
        this.imageEditService = imageEditService;
        this.userService = userService;
    }

    /** Runs (or re-runs) Gemini analysis for this photo and returns it with the new AI data. */
    @PostMapping("/analyze")
    public ResponseEntity<PhotoResponse> analyze(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(aiAnalysisService.analyzeNow(user, photoId));
    }

    /** Gemini's advice for a described edit, mapped to an ImageKit preview. */
    @PostMapping("/suggest-edit")
    public ResponseEntity<EditSuggestionResponse> suggestEdit(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody EditSuggestionRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(imageEditService.suggest(user, photoId, request.instruction()));
    }

    /** Saves the ImageKit-transformed image as a new photo; the original is untouched. */
    @PostMapping("/save-edit")
    public ResponseEntity<PhotoResponse> saveEdit(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody SaveEditRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(imageEditService.saveAsNewPhoto(user, photoId, request.operations()));
    }

    @PostMapping("/preview")
    public ResponseEntity<AiTransformPreviewResponse> preview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody AiTransformRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(aiTransformService.preview(user, photoId, request));
    }

    @PostMapping("/apply")
    public ResponseEntity<PhotoResponse> apply(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody AiTransformRequest request
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        PhotoResponse photo = aiTransformService.apply(user, photoId, request);
        return ResponseEntity.ok(photo);
    }
}