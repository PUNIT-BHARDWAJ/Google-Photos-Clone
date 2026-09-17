package project.backend.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Flattened onto the photos table (no join) - all fields nullable since most
// real-world uploads (screenshots, PNGs, re-saved/edited photos) simply have
// none of this data, and ddl-auto=update can add nullable columns to an
// existing non-empty table with no special handling.
@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoMetadata {

    @Column(name = "date_taken")
    private Instant dateTaken;

    @Column(name = "camera_make")
    private String cameraMake;

    @Column(name = "camera_model")
    private String cameraModel;

    @Column(name = "focal_length")
    private String focalLength;

    @Column(name = "aperture")
    private String aperture;

    @Column(name = "iso")
    private Integer iso;

    @Column(name = "shutter_speed")
    private String shutterSpeed;

    @Column(name = "exif_width")
    private Integer imageWidth;

    @Column(name = "exif_height")
    private Integer imageHeight;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "exif_file_size")
    private Long fileSize;

    public boolean hasCameraData() {
        return cameraMake != null || cameraModel != null || focalLength != null
                || aperture != null || iso != null || shutterSpeed != null;
    }

    public boolean hasGpsData() {
        return latitude != null && longitude != null;
    }

    public boolean hasAnyValue() {
        return dateTaken != null || hasCameraData() || hasGpsData()
                || imageWidth != null || imageHeight != null || fileSize != null;
    }
}
