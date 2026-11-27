package com.oism.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Công thức thuần (không phụ thuộc Spring/DB) để dễ unit test. FR-COST-01. */
public final class CogsCalculator {
    private CogsCalculator() {}

    /** New Cost = (OldStock*OldCost + ImportQty*ImportPrice) / (OldStock + ImportQty), làm tròn 4 chữ số. */
    public static BigDecimal weightedAverage(int oldStock, BigDecimal oldCost, int importQty, BigDecimal importPrice) {
        if (importQty <= 0) throw new IllegalArgumentException("importQty must be > 0");
        if (importPrice == null || importPrice.signum() < 0) throw new IllegalArgumentException("invalid importPrice");
        int stock = Math.max(0, oldStock);                       // tồn âm/0 coi như 0
        BigDecimal cost = oldCost == null ? BigDecimal.ZERO : oldCost;
        BigDecimal total = BigDecimal.valueOf((long) stock + importQty);
        BigDecimal numerator = cost.multiply(BigDecimal.valueOf(stock))
                .add(importPrice.multiply(BigDecimal.valueOf(importQty)));
        return numerator.divide(total, 4, RoundingMode.HALF_UP);
    }
}
