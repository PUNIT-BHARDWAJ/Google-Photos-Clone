package project.backend.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Maps edit requests to ImageKit URL transformations - free, instant, no AI
 * call. Only transformations verified to change the image are used: ImageKit
 * has no brightness, saturation or sepia parameter (e-brightness, e-saturation,
 * e-sepia and e-vintage are silently ignored), so those looks are approximated
 * with semi-transparent e-gradient overlays, whose alpha is a two-digit
 * percentage ("FFFFFF22" = white at 22%). Each approximation says so in its
 * note so the UI can be honest about it.
 */
public final class ImageEditMapper {

    public enum Stage { GEOMETRY, TONE, DETAIL, CUTOUT }

    public enum EditOperation {
        CROP_PORTRAIT("crop_portrait", "Crop to portrait (3:4)", Stage.GEOMETRY, null, null),
        CROP_SQUARE("crop_square", "Crop to square", Stage.GEOMETRY, null, null),
        CROP_LANDSCAPE("crop_landscape", "Crop to landscape (16:9)", Stage.GEOMETRY, null, null),
        ROTATE_LEFT("rotate_left", "Rotate left", Stage.GEOMETRY, "rt-270", null),
        ROTATE_RIGHT("rotate_right", "Rotate right", Stage.GEOMETRY, "rt-90", null),
        FLIP_HORIZONTAL("flip_horizontal", "Flip horizontally", Stage.GEOMETRY, "fl-h", null),
        FLIP_VERTICAL("flip_vertical", "Flip vertically", Stage.GEOMETRY, "fl-v", null),
        GRAYSCALE("grayscale", "Black & white", Stage.TONE, "e-grayscale", null),
        SEPIA("sepia", "Sepia", Stage.TONE, "e-grayscale:e-gradient-from-A0703040_to-A0703040",
                "Black & white with a warm brown overlay"),
        VINTAGE("vintage", "Vintage", Stage.TONE,
                "e-gradient-from-E0A06035_to-E0A06035:e-gradient-ld-180_from-00000000_to-00000035",
                "Warm faded overlay - ImageKit has no saturation control"),
        WARM("warm", "Warmer tones", Stage.TONE, "e-gradient-from-FF990025_to-FF990025", "Warm color overlay"),
        COOL("cool", "Cooler tones", Stage.TONE, "e-gradient-from-3399FF20_to-3399FF20", "Cool color overlay"),
        LIGHTEN("lighten", "Brighter", Stage.TONE, "e-gradient-from-FFFFFF22_to-FFFFFF22",
                "Soft white overlay - ImageKit has no brightness control"),
        DARKEN("darken", "Darker", Stage.TONE, "e-gradient-from-00000025_to-00000025",
                "Dark overlay - ImageKit has no brightness control"),
        CONTRAST("contrast", "More contrast", Stage.TONE, "e-contrast", null),
        SHARPEN("sharpen", "Sharpen", Stage.DETAIL, "e-sharpen", null),
        BLUR("blur", "Blur", Stage.DETAIL, "bl-10", null),
        REMOVE_BACKGROUND("remove_background", "Remove background", Stage.CUTOUT, "e-bgremove",
                "ImageKit AI extension - can take a few seconds");

        private final String key;
        private final String label;
        private final Stage stage;
        private final String chain;
        private final String note;

        EditOperation(String key, String label, Stage stage, String chain, String note) {
            this.key = key;
            this.label = label;
            this.stage = stage;
            this.chain = chain;
            this.note = note;
        }

        public String key() {
            return key;
        }

        public String label() {
            return label;
        }

        public String note() {
            return note;
        }

        public static Optional<EditOperation> fromKey(String key) {
            if (key == null) {
                return Optional.empty();
            }
            String normalized = key.trim().toLowerCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
            return Arrays.stream(values()).filter(op -> op.key.equals(normalized)).findFirst();
        }
    }

    private record Rule(EditOperation operation, List<String> phrases) {
    }

    // Checked in order; the first matching tone rule wins so "black and white
    // vintage" doesn't stack two competing looks.
    private static final List<Rule> RULES = List.of(
            new Rule(EditOperation.REMOVE_BACKGROUND, List.of("remove background", "remove the background",
                    "background removal", "remove bg", "no background", "transparent background", "cut out", "cutout")),
            new Rule(EditOperation.GRAYSCALE, List.of("black and white", "black & white", "b&w", "grayscale",
                    "greyscale", "monochrome", "gray scale", "grey scale")),
            new Rule(EditOperation.SEPIA, List.of("sepia")),
            new Rule(EditOperation.VINTAGE, List.of("vintage", "retro", "old photo", "old-fashioned", "film look", "faded")),
            new Rule(EditOperation.WARM, List.of("warmer", "warm tone", "warm it", "golden hour")),
            new Rule(EditOperation.COOL, List.of("cooler", "cool tone", "colder", "bluer")),
            new Rule(EditOperation.LIGHTEN, List.of("brighter", "brighten", "lighter", "lighten", "more light",
                    "too dark", "increase brightness", "exposure up")),
            new Rule(EditOperation.DARKEN, List.of("darker", "darken", "dimmer", "too bright", "decrease brightness", "moodier")),
            new Rule(EditOperation.CONTRAST, List.of("contrast", "enhance color", "enhance colour", "vivid", "vibrant",
                    "saturat", "make it pop", "punchy")),
            new Rule(EditOperation.SHARPEN, List.of("sharpen", "sharper", "crisp", "enhance color", "enhance colour", "clearer")),
            new Rule(EditOperation.BLUR, List.of("blur", "soften", "softer", "dreamy")),
            new Rule(EditOperation.CROP_PORTRAIT, List.of("crop to portrait", "portrait crop", "portrait orientation",
                    "make it portrait", "vertical crop", "3:4")),
            new Rule(EditOperation.CROP_SQUARE, List.of("crop to square", "square crop", "make it square", "1:1")),
            new Rule(EditOperation.CROP_LANDSCAPE, List.of("crop to landscape", "landscape crop", "landscape orientation",
                    "make it landscape", "widescreen", "16:9", "horizontal crop")),
            new Rule(EditOperation.FLIP_VERTICAL, List.of("flip vertical", "flip it vertically", "upside down")),
            new Rule(EditOperation.FLIP_HORIZONTAL, List.of("flip", "mirror")),
            new Rule(EditOperation.ROTATE_LEFT, List.of("rotate left", "counterclockwise", "counter-clockwise", "anticlockwise")),
            new Rule(EditOperation.ROTATE_RIGHT, List.of("rotate", "clockwise")));

    private static final Set<EditOperation> TONE_LOOKS = Set.of(
            EditOperation.GRAYSCALE, EditOperation.SEPIA, EditOperation.VINTAGE, EditOperation.WARM, EditOperation.COOL);

    private ImageEditMapper() {
    }

    public static List<String> operationKeys() {
        return Arrays.stream(EditOperation.values()).map(EditOperation::key).toList();
    }

    /** Keyword matching on the user's own words - works with AI switched off. */
    public static List<EditOperation> fromInstruction(String instruction) {
        if (instruction == null || instruction.isBlank()) {
            return List.of();
        }
        String text = " " + instruction.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ") + " ";
        List<EditOperation> matched = new ArrayList<>();
        for (Rule rule : RULES) {
            if (rule.phrases().stream().anyMatch(text::contains)) {
                matched.add(rule.operation());
            }
        }
        return normalize(matched);
    }

    /** Gemini's operation keys when it named any we support, otherwise the keyword match. */
    public static List<EditOperation> resolve(String instruction, List<String> aiOperations) {
        List<EditOperation> fromAi = fromKeys(aiOperations);
        return fromAi.isEmpty() ? fromInstruction(instruction) : fromAi;
    }

    public static List<EditOperation> fromKeys(List<String> keys) {
        if (keys == null) {
            return List.of();
        }
        List<EditOperation> operations = new ArrayList<>();
        for (String key : keys) {
            EditOperation.fromKey(key).ifPresent(operations::add);
        }
        return normalize(operations);
    }

    /**
     * Deduplicated, at most one of each kind (crop, tone look, lighten/darken,
     * rotation, flip),
     * ordered geometry -> tone -> detail -> background removal.
     */
    static List<EditOperation> normalize(List<EditOperation> operations) {
        Set<EditOperation> kept = new LinkedHashSet<>();
        boolean hasCrop = false;
        boolean hasLook = false;
        boolean hasExposure = false;
        boolean hasRotation = false;
        boolean hasFlip = false;
        for (EditOperation op : operations) {
            boolean isCrop = op == EditOperation.CROP_PORTRAIT || op == EditOperation.CROP_SQUARE || op == EditOperation.CROP_LANDSCAPE;
            boolean isLook = TONE_LOOKS.contains(op);
            boolean isExposure = op == EditOperation.LIGHTEN || op == EditOperation.DARKEN;
            boolean isRotation = op == EditOperation.ROTATE_LEFT || op == EditOperation.ROTATE_RIGHT;
            boolean isFlip = op == EditOperation.FLIP_HORIZONTAL || op == EditOperation.FLIP_VERTICAL;
            if ((isCrop && hasCrop) || (isLook && hasLook) || (isExposure && hasExposure)
                    || (isRotation && hasRotation) || (isFlip && hasFlip)) {
                continue;
            }
            hasCrop |= isCrop;
            hasLook |= isLook;
            hasExposure |= isExposure;
            hasRotation |= isRotation;
            hasFlip |= isFlip;
            kept.add(op);
        }
        return kept.stream().sorted(Comparator.comparing(op -> op.stage)).toList();
    }

    /** The ImageKit tr= value; crops use the photo's size so they cut rather than upscale. */
    public static String buildChain(List<EditOperation> operations, Integer width, Integer height) {
        List<String> steps = new ArrayList<>();
        for (EditOperation op : operations) {
            String step = switch (op) {
                case CROP_PORTRAIT -> aspectCrop(width, height, 3, 4);
                case CROP_SQUARE -> aspectCrop(width, height, 1, 1);
                case CROP_LANDSCAPE -> aspectCrop(width, height, 16, 9);
                default -> op.chain;
            };
            steps.add(step);
        }
        return String.join(":", steps);
    }

    /** The largest ratioW:ratioH box that fits the photo, cropped around the detected subject. */
    static String aspectCrop(Integer width, Integer height, int ratioW, int ratioH) {
        if (width == null || height == null || width <= 0 || height <= 0) {
            return "ar-" + ratioW + "-" + ratioH + ",w-1200,fo-auto";
        }
        int cropWidth = width;
        int cropHeight = (int) Math.round((double) width * ratioH / ratioW);
        if (cropHeight > height) {
            cropHeight = height;
            cropWidth = (int) Math.round((double) height * ratioW / ratioH);
        }
        return "w-" + cropWidth + ",h-" + cropHeight + ",fo-auto";
    }
}
