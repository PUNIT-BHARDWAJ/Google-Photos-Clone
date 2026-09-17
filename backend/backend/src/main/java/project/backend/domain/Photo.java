package project.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

import java.time.Instant;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Entity
@Table(name = "photos")
@Getter 
@Setter  
@Builder 
@NoArgsConstructor
@AllArgsConstructor 
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne (fetch = FetchType.LAZY, optional = false)
    @JoinColumn (name = "user_id", nullable = false)
    private User user;

    @Column (name = "imagekit_file_id", nullable = false)
    private String imageKitFileId;

    // ImageKit's storage name. With useUniqueFileName it carries a random
    // suffix ("beach.jpg" -> "beach_a7kpyJDaR.jpg"), so it isn't what the
    // user should see - use getDisplayFileName() for anything user-facing.
    @Column(name = "file_name", nullable = false)
    private String fileName;

    // The name the file had on the user's device. Null for photos uploaded
    // before this column existed and for assets imported from ImageKit.
    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    private Integer width;

    
    private Integer height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PhotoStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "parent_photo_id")
    private UUID parentPhotoId;


    @Enumerated(EnumType.STRING)
    @Column(name = "ai_transform_type", length = 50)
    private AiTransformType aiTransformType;

    // columnDefinition supplies a DEFAULT so ddl-auto=update can add this
    // NOT NULL column to a table that already has rows without failing.
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean starred;

    @Embedded
    private PhotoMetadata metadata;

    // "_" plus 9-10 random URL-safe characters right before the extension.
    private static final Pattern IMAGEKIT_UNIQUE_SUFFIX =
            Pattern.compile("^(.+)_([A-Za-z0-9_-]{9,10})(\\.[A-Za-z0-9]+)?$");

    public String getDisplayFileName() {
        if (originalFileName != null && !originalFileName.isBlank()) {
            return originalFileName;
        }
        return stripImageKitUniqueSuffix(fileName);
    }

    // Only for rows with no stored original name. The suffix must also look
    // random (lowercase mixed with uppercase or digits) so ordinary names
    // like "IMG_20240101.jpg" or "summer_holiday.jpg" are left alone.
    static String stripImageKitUniqueSuffix(String name) {
        if (name == null) {
            return null;
        }
        Matcher matcher = IMAGEKIT_UNIQUE_SUFFIX.matcher(name);
        if (!matcher.matches()) {
            return name;
        }
        String suffix = matcher.group(2);
        boolean hasLower = suffix.chars().anyMatch(Character::isLowerCase);
        boolean hasUpperOrDigit = suffix.chars().anyMatch(c -> Character.isUpperCase(c) || Character.isDigit(c));
        if (!hasLower || !hasUpperOrDigit) {
            return name;
        }
        String extension = matcher.group(3);
        return matcher.group(1) + (extension != null ? extension : "");
    }

    @PrePersist
     void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = PhotoStatus.ACTIVE;
        }
        if (sizeBytes == null) {
            sizeBytes = 0L;
        }
    }
}