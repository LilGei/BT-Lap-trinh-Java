package com.oism.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class CogsCalculatorTest {
    private static BigDecimal bd(String s) { return new BigDecimal(s); }

    @Test void firstImportTakesImportPrice() {
        assertEquals(bd("50000.0000"), CogsCalculator.weightedAverage(0, null, 10, bd("50000")));
    }
    @Test void weightedAverageFormula() {
        // (100*10.000 + 50*13.000) / 150 = 11.000
        assertEquals(bd("11000.0000"), CogsCalculator.weightedAverage(100, bd("10000"), 50, bd("13000")));
    }
    @Test void roundsHalfUpToFourDecimals() {
        // (1*10 + 2*11)/3 = 10.6667
        assertEquals(bd("10.6667"), CogsCalculator.weightedAverage(1, bd("10"), 2, bd("11")));
    }
    @Test void negativeOldStockTreatedAsZero() {
        assertEquals(bd("7.0000"), CogsCalculator.weightedAverage(-5, bd("99"), 4, bd("7")));
    }
    @Test void sequentialImportsChain() {
        BigDecimal c1 = CogsCalculator.weightedAverage(0, BigDecimal.ZERO, 10, bd("100"));   // 100
        BigDecimal c2 = CogsCalculator.weightedAverage(10, c1, 10, bd("200"));               // 150
        BigDecimal c3 = CogsCalculator.weightedAverage(20, c2, 20, bd("300"));               // 225
        assertEquals(bd("225.0000"), c3);
    }
    @Test void rejectsInvalidInput() {
        assertThrows(IllegalArgumentException.class, () -> CogsCalculator.weightedAverage(1, bd("1"), 0, bd("1")));
        assertThrows(IllegalArgumentException.class, () -> CogsCalculator.weightedAverage(1, bd("1"), 1, bd("-1")));
    }
}
