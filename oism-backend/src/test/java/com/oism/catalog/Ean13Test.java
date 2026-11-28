package com.oism.catalog;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class Ean13Test {
    @Test
    void knownValidCodeIsAccepted() {
        assertTrue(Ean13.isValid("4006381333931"));   // mã EAN-13 mẫu phổ biến
    }

    @Test
    void wrongCheckDigitOrFormatIsRejected() {
        assertFalse(Ean13.isValid("4006381333932"));
        assertFalse(Ean13.isValid("400638133393"));    // 12 số
        assertFalse(Ean13.isValid("40063813339A1"));
        assertFalse(Ean13.isValid(null));
    }

    @Test
    void generatedInternalCodesAreValidAndUseInternalPrefix() {
        for (int i = 0; i < 200; i++) {
            String code = Ean13.generateInternal();
            assertEquals(13, code.length());
            assertTrue(code.startsWith("29"));
            assertTrue(Ean13.isValid(code), code);
        }
    }
}
