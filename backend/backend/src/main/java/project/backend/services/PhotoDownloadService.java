package project.backend.services;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;
import project.backend.domain.Photo;
import project.backend.domain.User;
import project.backend.exception.BadRequestException;
import project.backend.exception.ImageKitUploadException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.PhotoRepository;

/**
 * "Download" in the selection toolbar: one photo comes back as the original
 * file, several as a zip streamed straight from ImageKit (nothing is held in
 * memory or written to disk).
 */
@Service
public class PhotoDownloadService {

    private static final Logger log = LoggerFactory.getLogger(PhotoDownloadService.class);

    static final int MAX_PHOTOS = 200;

    public record DownloadItem(String name, String url, String mimeType) {
    }

    private final PhotoRepository photoRepository;
    private final ImageKitService imageKitService;

    public PhotoDownloadService(PhotoRepository photoRepository, ImageKitService imageKitService) {
        this.photoRepository = photoRepository;
        this.imageKitService = imageKitService;
    }

    /** Validates ownership up front, so a bad request fails before any bytes are written. */
    public List<DownloadItem> prepare(User user, List<UUID> photoIds) {
        List<UUID> unique = photoIds.stream().distinct().toList();
        if (unique.size() > MAX_PHOTOS) {
            throw new BadRequestException("Download up to " + MAX_PHOTOS + " photos at a time");
        }
        Map<UUID, Photo> byId = new HashMap<>();
        photoRepository.findByIdInAndUserId(unique, user.getId()).forEach(photo -> byId.put(photo.getId(), photo));
        if (byId.size() != unique.size()) {
            throw new ResourceNotFoundException("One or more photos were not found");
        }

        Set<String> usedNames = new HashSet<>();
        List<DownloadItem> items = new ArrayList<>();
        for (UUID id : unique) {
            Photo photo = byId.get(id);
            items.add(new DownloadItem(uniqueName(safeName(photo.getDisplayFileName()), usedNames), photo.getUrl(), photo.getMimeType()));
        }
        return items;
    }

    public void writeSingle(DownloadItem item, HttpServletResponse response) throws IOException {
        HttpResponse<InputStream> original = imageKitService.openOriginal(item.url());
        try (InputStream body = original.body()) {
            if (original.statusCode() >= 400) {
                throw new ImageKitUploadException("Couldn't download " + item.name() + " (HTTP " + original.statusCode() + ")");
            }
            String contentType = original.headers().firstValue("Content-Type")
                    .orElse(item.mimeType() != null ? item.mimeType() : "application/octet-stream");
            response.setContentType(contentType);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment().filename(item.name(), StandardCharsets.UTF_8).build().toString());
            body.transferTo(response.getOutputStream());
        }
    }

    /**
     * Photos are already compressed, so entries are stored rather than
     * deflated. A photo that can't be fetched is skipped and listed in
     * download-errors.txt instead of breaking the whole archive.
     */
    public void writeZip(List<DownloadItem> items, OutputStream output) throws IOException {
        List<String> failures = new ArrayList<>();
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.setLevel(Deflater.NO_COMPRESSION);
            for (DownloadItem item : items) {
                try {
                    HttpResponse<InputStream> original = imageKitService.openOriginal(item.url());
                    try (InputStream body = original.body()) {
                        if (original.statusCode() >= 400) {
                            failures.add(item.name() + " (HTTP " + original.statusCode() + ")");
                            continue;
                        }
                        zip.putNextEntry(new ZipEntry(item.name()));
                        body.transferTo(zip);
                        zip.closeEntry();
                    }
                } catch (ImageKitUploadException ex) {
                    log.info("Skipping {} in download: {}", item.name(), ex.getMessage());
                    failures.add(item.name() + " (" + ex.getMessage() + ")");
                }
            }
            if (!failures.isEmpty()) {
                zip.putNextEntry(new ZipEntry("download-errors.txt"));
                zip.write(("These photos couldn't be downloaded:\n" + String.join("\n", failures) + "\n")
                        .getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        }
    }

    /** A file name safe on every OS: no path separators or control characters. */
    static String safeName(String name) {
        String cleaned = name == null ? "" : name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").trim();
        return cleaned.isEmpty() || cleaned.equals(".") || cleaned.equals("..") ? "photo.jpg" : cleaned;
    }

    /** "beach.jpg", then "beach (2).jpg" - zip entries with the same name would overwrite each other on extraction. */
    static String uniqueName(String name, Set<String> used) {
        String candidate = name;
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String extension = dot > 0 ? name.substring(dot) : "";
        for (int copy = 2; !used.add(candidate.toLowerCase(Locale.ROOT)); copy++) {
            candidate = base + " (" + copy + ")" + extension;
        }
        return candidate;
    }
}
