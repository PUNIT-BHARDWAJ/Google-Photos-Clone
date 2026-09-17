package project.backend.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PhotoDisplayFileNameTest {

    @Test
    void prefersStoredOriginalName() {
        Photo photo = Photo.builder()
                .fileName("beach_a7kpyJDaR.jpg")
                .originalFileName("beach_trip_2024.jpg")
                .build();

        assertThat(photo.getDisplayFileName()).isEqualTo("beach_trip_2024.jpg");
    }

    @Test
    void stripsImageKitUniqueSuffixesSeenInRealUploads() {
        assertThat(Photo.stripImageKitUniqueSuffix("01_landscape_3x2_tcF0xRuzLN.jpg")).isEqualTo("01_landscape_3x2.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("08_panorama_3x1_euS7oScg-.jpg")).isEqualTo("08_panorama_3x1.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("07_portrait_3x4_pJVnS3fG_.jpg")).isEqualTo("07_portrait_3x4.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("04_wide_16x9_77ktnhcip.jpg")).isEqualTo("04_wide_16x9.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("14_landscape_7x5_dmsKmtTag.jpg")).isEqualTo("14_landscape_7x5.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("03_square_1x1_EqQtMruvfu.jpg")).isEqualTo("03_square_1x1.jpg");
    }

    @Test
    void leavesOrdinaryNamesAlone() {
        assertThat(Photo.stripImageKitUniqueSuffix("IMG_20240101.jpg")).isEqualTo("IMG_20240101.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("IMG_20240101_123456.jpg")).isEqualTo("IMG_20240101_123456.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("summer_holiday.jpg")).isEqualTo("summer_holiday.jpg");
        assertThat(Photo.stripImageKitUniqueSuffix("DSC_0001.JPG")).isEqualTo("DSC_0001.JPG");
        assertThat(Photo.stripImageKitUniqueSuffix("sunset.png")).isEqualTo("sunset.png");
    }

    @Test
    void usesStrippedNameWhenNoOriginalIsStored() {
        Photo photo = Photo.builder().fileName("01_landscape_3x2_tcF0xRuzLN.jpg").build();

        assertThat(photo.getDisplayFileName()).isEqualTo("01_landscape_3x2.jpg");
    }
}
