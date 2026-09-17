package project.backend.services;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Photos with an AI analysis queued or running, so responses can report
 * aiPending and the UI can show "Analyzing..." instead of an Analyze button.
 * Its own bean (no dependencies) so PhotoService can read it without a cycle
 * through AiAnalysisService.
 */
@Component
public class AiQueueTracker {

    private final Set<UUID> pending = ConcurrentHashMap.newKeySet();

    /** False if the photo was already pending. */
    public boolean markPending(UUID photoId) {
        return pending.add(photoId);
    }

    public void clear(UUID photoId) {
        pending.remove(photoId);
    }

    public boolean isPending(UUID photoId) {
        return pending.contains(photoId);
    }
}
