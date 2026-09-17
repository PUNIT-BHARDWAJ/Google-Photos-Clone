package project.backend.services;

import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import project.backend.domain.Photo;
import project.backend.repository.PhotoRepository;

/**
 * Brings analyses stored before a normalization rule existed in line with it,
 * once at startup: tags and colors saved as "grey" become "gray", so search and
 * the color filter see one spelling. Idempotent - a no-op once nothing matches.
 */
@Component
public class AiDataMaintenance {

    private static final Logger log = LoggerFactory.getLogger(AiDataMaintenance.class);

    private final PhotoRepository photoRepository;

    public AiDataMaintenance(PhotoRepository photoRepository) {
        this.photoRepository = photoRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void normalizeStoredSpellings() {
        int updated = 0;
        for (Photo photo : photoRepository.findWithGreySpelling()) {
            String tags = Photo.joinList(TagVocabulary.normalizeSpelling(photo.getAiTagList()));
            String colors = Photo.joinList(TagVocabulary.normalizeSpelling(photo.getAiDominantColorList()));
            boolean changed = !Objects.equals(tags, photo.getAiTags())
                    || !Objects.equals(colors, photo.getAiDominantColors());
            if (changed) {
                updated += photoRepository.saveAiLists(photo.getId(), tags, colors);
            }
        }
        if (updated > 0) {
            log.info("Normalized grey -> gray in the AI tags or colors of {} photos", updated);
        }
    }
}
