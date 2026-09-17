package project.backend.services;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Date;
import java.util.TimeZone;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.lang.GeoLocation;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;

import project.backend.domain.PhotoMetadata;

// Best-effort only: a large share of real-world uploads (screenshots, PNGs,
// re-saved/edited photos) simply carry no EXIF at all, and malformed EXIF
// blocks are common enough in the wild that the underlying library can throw.
// None of that may ever fail an upload, so the whole read is one try-catch
// that falls back to an all-null PhotoMetadata.
@Service
public class MetadataExtractionService {

    private static final TimeZone UTC = TimeZone.getTimeZone("UTC");

    public PhotoMetadata extractMetadata(byte[] bytes) {
        PhotoMetadata.PhotoMetadataBuilder result = PhotoMetadata.builder();
        Integer width = null;
        Integer height = null;

        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));

            ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (subIfd != null) {
                // DateTimeOriginal is the camera's wall-clock reading. It's kept
                // as that reading at UTC - deliberately ignoring any
                // OffsetTimeOriginal - so every client can show and group it by
                // capture day with UTC fields, instead of some photos being
                // real instants and others UTC-shifted local times that land
                // on the wrong day for anyone east or west of Greenwich.
                Date dateTaken = subIfd.getDate(
                        ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL,
                        subIfd.getString(ExifSubIFDDirectory.TAG_SUBSECOND_TIME_ORIGINAL),
                        UTC);
                if (dateTaken != null) {
                    result.dateTaken(dateTaken.toInstant());
                }
                result.focalLength(formatFocalLength(subIfd));
                result.aperture(formatAperture(subIfd));
                result.shutterSpeed(formatShutterSpeed(subIfd));
                result.iso(subIfd.getInteger(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT));
                width = subIfd.getInteger(ExifSubIFDDirectory.TAG_EXIF_IMAGE_WIDTH);
                height = subIfd.getInteger(ExifSubIFDDirectory.TAG_EXIF_IMAGE_HEIGHT);
            }

            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (ifd0 != null) {
                result.cameraMake(trimToNull(ifd0.getString(ExifIFD0Directory.TAG_MAKE)));
                result.cameraModel(trimToNull(ifd0.getString(ExifIFD0Directory.TAG_MODEL)));
            }

            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null) {
                GeoLocation location = gps.getGeoLocation();
                if (location != null && !location.isZero()) {
                    result.latitude(location.getLatitude());
                    result.longitude(location.getLongitude());
                }
            }
        } catch (Exception e) {
            // No EXIF, unsupported format, or corrupt file - fine, dimensions
            // still get a second chance below and everything else stays null.
        }

        if (width == null || height == null) {
            int[] pixelDimensions = readPixelDimensions(bytes);
            if (pixelDimensions != null) {
                width = pixelDimensions[0];
                height = pixelDimensions[1];
            }
        }

        result.imageWidth(width);
        result.imageHeight(height);

        return result.build();
    }

    // EXIF rarely carries pixel dimensions in practice - this is the fallback
    // that makes width/height available for every decodable image, not just
    // ones with a full EXIF block (screenshots, PNGs, etc. included).
    private int[] readPixelDimensions(byte[] bytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                return null;
            }
            return new int[] { image.getWidth(), image.getHeight() };
        } catch (IOException e) {
            return null;
        }
    }

    private String formatFocalLength(ExifSubIFDDirectory dir) {
        Double value = dir.getDoubleObject(ExifSubIFDDirectory.TAG_FOCAL_LENGTH);
        return value != null ? formatDecimal(value) + "mm" : null;
    }

    private String formatAperture(ExifSubIFDDirectory dir) {
        Double value = dir.getDoubleObject(ExifSubIFDDirectory.TAG_FNUMBER);
        return value != null ? "f/" + formatDecimal(value) : null;
    }

    private String formatShutterSpeed(ExifSubIFDDirectory dir) {
        String raw = dir.getString(ExifSubIFDDirectory.TAG_EXPOSURE_TIME);
        return raw != null ? raw + "s" : null;
    }

    private String formatDecimal(double value) {
        if (value == Math.floor(value)) {
            return String.valueOf((long) value);
        }
        return String.valueOf(Math.round(value * 100) / 100.0);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
