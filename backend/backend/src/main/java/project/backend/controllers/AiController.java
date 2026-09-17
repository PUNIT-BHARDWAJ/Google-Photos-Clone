package project.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import project.backend.domain.User;
import project.backend.dto.AiStatusResponse;
import project.backend.dto.AnalyzeAllResponse;
import project.backend.dto.TagCountResponse;
import project.backend.services.AiAnalysisService;
import project.backend.services.PhotoSearchService;
import project.backend.services.UserService;

/** Library-wide AI endpoints; per-photo ones live in PhotoAiController. */
@RestController
@RequestMapping("/api/photos/ai")
public class AiController {

    private final AiAnalysisService aiAnalysisService;
    private final PhotoSearchService photoSearchService;
    private final UserService userService;

    public AiController(AiAnalysisService aiAnalysisService, PhotoSearchService photoSearchService, UserService userService) {
        this.aiAnalysisService = aiAnalysisService;
        this.photoSearchService = photoSearchService;
        this.userService = userService;
    }

    /** Starts analyzing every photo without AI data, one every few seconds. Returns immediately. */
    @PostMapping("/analyze-all")
    public ResponseEntity<AnalyzeAllResponse> analyzeAll(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.accepted().body(aiAnalysisService.startAnalyzeAll(user));
    }

    /** Stops the running bulk analysis after the photo in progress. */
    @PostMapping("/analyze-all/cancel")
    public ResponseEntity<AiStatusResponse> cancelAnalyzeAll(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getByEmail(userDetails.getUsername());
        aiAnalysisService.cancelAnalyzeAll(user);
        return ResponseEntity.ok(aiAnalysisService.status(user, false));
    }

    /** Gemini connection state, analysis progress and the current bulk run. refresh re-checks the key. */
    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> status(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "false") boolean refresh
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(aiAnalysisService.status(user, refresh));
    }

    /** The user's most common AI tags, for search suggestions - style and color words left out by default. */
    @GetMapping("/top-tags")
    public ResponseEntity<List<TagCountResponse>> topTags(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(defaultValue = "false") boolean includeGeneric
    ) {
        User user = userService.getByEmail(userDetails.getUsername());
        return ResponseEntity.ok(photoSearchService.topTags(user, limit, includeGeneric));
    }
}
