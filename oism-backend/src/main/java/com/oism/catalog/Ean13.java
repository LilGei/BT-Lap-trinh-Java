package com.oism.catalog;

import java.security.SecureRandom;

/** Tiện ích mã vạch EAN-13 (FR-PROD-03). */
public final class Ean13 {
    private static final SecureRandom RANDOM = new SecureRandom();
    private Ean13() {}

    /** Chữ số kiểm tra của 12 chữ số đầu: vị trí lẻ x1, chẵn x3. */
    public static int checkDigit(String first12) {
        int sum = 0;
        for (int i = 0; i < 12; i++) sum += (first12.charAt(i) - '0') * (i % 2 == 0 ? 1 : 3);
        return (10 - sum % 10) % 10;
    }

    public static boolean isValid(String code) {
        return code != null && code.matches("\\d{13}") && checkDigit(code.substring(0, 12)) == code.charAt(12) - '0';
    }

    /** Sinh mã nội bộ: tiền tố 29 (dải GS1 dành cho lưu hành nội bộ) + 10 số ngẫu nhiên + số kiểm tra. */
    public static String generateInternal() {
        StringBuilder sb = new StringBuilder("29");
        for (int i = 0; i < 10; i++) sb.append(RANDOM.nextInt(10));
        return sb.append(checkDigit(sb.toString())).toString();
    }
}
