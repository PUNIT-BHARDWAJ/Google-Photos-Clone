package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import project.backend.services.ImageEditMapper.EditOperation;

class ImageEditMapperTest {

    @Test
    void mapsTheDialogExampleChips() {
        assertThat(ImageEditMapper.fromInstruction("Make it brighter")).containsExactly(EditOperation.LIGHTEN);
        assertThat(ImageEditMapper.fromInstruction("Remove background")).containsExactly(EditOperation.REMOVE_BACKGROUND);
        assertThat(ImageEditMapper.fromInstruction("Convert to black and white")).containsExactly(EditOperation.GRAYSCALE);
        assertThat(ImageEditMapper.fromInstruction("Enhance colors"))
                .containsExactly(EditOperation.CONTRAST, EditOperation.SHARPEN);
        assertThat(ImageEditMapper.fromInstruction("Make it look vintage")).containsExactly(EditOperation.VINTAGE);
        assertThat(ImageEditMapper.fromInstruction("Crop to portrait")).containsExactly(EditOperation.CROP_PORTRAIT);
    }

    @Test
    void unrelatedInstructionsMapToNothing() {
        assertThat(ImageEditMapper.fromInstruction("Add a unicorn in the sky")).isEmpty();
        assertThat(ImageEditMapper.fromInstruction("   ")).isEmpty();
        // "portrait" alone describes the photo, not a crop.
        assertThat(ImageEditMapper.fromInstruction("make this portrait of my dad sharper"))
                .containsExactly(EditOperation.SHARPEN);
    }

    @Test
    void keepsOneOperationOfEachKindInPipelineOrder() {
        List<EditOperation> operations = ImageEditMapper.fromKeys(
                List.of("remove_background", "sharpen", "grayscale", "vintage", "lighten", "darken", "crop_square",
                        "crop_portrait", "rotate_left", "rotate_right", "flip_vertical", "flip_horizontal"));

        assertThat(operations).containsExactly(
                EditOperation.CROP_SQUARE, EditOperation.ROTATE_LEFT, EditOperation.FLIP_VERTICAL,
                EditOperation.GRAYSCALE, EditOperation.LIGHTEN, EditOperation.SHARPEN,
                EditOperation.REMOVE_BACKGROUND);
    }

    @Test
    void prefersGeminiOperationsAndIgnoresUnknownKeys() {
        assertThat(ImageEditMapper.resolve("Make it brighter", List.of("lighten", "contrast", "teleport")))
                .containsExactly(EditOperation.LIGHTEN, EditOperation.CONTRAST);
        // Nothing usable from Gemini - fall back to the user's own words.
        assertThat(ImageEditMapper.resolve("Make it brighter", List.of("teleport")))
                .containsExactly(EditOperation.LIGHTEN);
        assertThat(ImageEditMapper.resolve("Make it brighter", null)).containsExactly(EditOperation.LIGHTEN);
    }

    @Test
    void buildsVerifiedImageKitChains() {
        assertThat(ImageEditMapper.buildChain(List.of(EditOperation.GRAYSCALE), 800, 600)).isEqualTo("e-grayscale");
        assertThat(ImageEditMapper.buildChain(List.of(EditOperation.BLUR, EditOperation.REMOVE_BACKGROUND), null, null))
                .isEqualTo("bl-10:e-bgremove");
        assertThat(ImageEditMapper.buildChain(List.of(EditOperation.LIGHTEN), 800, 600))
                .isEqualTo("e-gradient-from-FFFFFF22_to-FFFFFF22");
    }

    @Test
    void cropsFitInsideThePhotoInsteadOfUpscaling() {
        // Landscape 1200x800 -> the tallest 3:4 box is 600x800.
        assertThat(ImageEditMapper.aspectCrop(1200, 800, 3, 4)).isEqualTo("w-600,h-800,fo-auto");
        // Portrait 800x1200 -> a 16:9 box keeps the full width.
        assertThat(ImageEditMapper.aspectCrop(800, 1200, 16, 9)).isEqualTo("w-800,h-450,fo-auto");
        assertThat(ImageEditMapper.aspectCrop(1000, 1000, 1, 1)).isEqualTo("w-1000,h-1000,fo-auto");
        assertThat(ImageEditMapper.aspectCrop(null, 800, 1, 1)).isEqualTo("ar-1-1,w-1200,fo-auto");
    }

    @Test
    void operationKeysAreStableAndParseable() {
        for (String key : ImageEditMapper.operationKeys()) {
            assertThat(EditOperation.fromKey(key)).isPresent();
        }
        assertThat(EditOperation.fromKey("Crop-Portrait")).contains(EditOperation.CROP_PORTRAIT);
        assertThat(EditOperation.fromKey("brightness")).isEmpty();
    }

    @Test
    void editedCopiesGetADescriptiveName() {
        assertThat(ImageEditService.editedFileName("beach.jpg", false)).isEqualTo("beach-edited.jpg");
        assertThat(ImageEditService.editedFileName("beach.jpg", true)).isEqualTo("beach-edited.png");
        assertThat(ImageEditService.editedFileName("scan", false)).isEqualTo("scan-edited.jpg");
    }
}
