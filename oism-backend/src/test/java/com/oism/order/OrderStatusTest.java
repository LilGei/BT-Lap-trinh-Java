package com.oism.order;

import com.oism.common.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderStatusTest {
    @Test void permitsOnlyDocumentedLifecycleMoves() {
        assertDoesNotThrow(() -> OrderStatus.DRAFT.requireTransitionTo(OrderStatus.RESERVED));
        assertDoesNotThrow(() -> OrderStatus.RESERVED.requireTransitionTo(OrderStatus.CONFIRMED));
        assertDoesNotThrow(() -> OrderStatus.CONFIRMED.requireTransitionTo(OrderStatus.COMPLETED));
        assertDoesNotThrow(() -> OrderStatus.RESERVED.requireTransitionTo(OrderStatus.CANCELLED));
    }

    @Test void rejectsSkippingOrRepeatingLifecycleStates() {
        assertThrows(BusinessException.class, () -> OrderStatus.DRAFT.requireTransitionTo(OrderStatus.CONFIRMED));
        assertThrows(BusinessException.class, () -> OrderStatus.COMPLETED.requireTransitionTo(OrderStatus.CANCELLED));
        assertThrows(BusinessException.class, () -> OrderStatus.CANCELLED.requireTransitionTo(OrderStatus.RESERVED));
    }
}
