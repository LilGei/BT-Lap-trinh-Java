package com.oism.order;

import com.oism.common.BusinessException;

import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    DRAFT, RESERVED, CONFIRMED, COMPLETED, CANCELLED;

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = Map.of(
            DRAFT, Set.of(RESERVED, CANCELLED),
            RESERVED, Set.of(CONFIRMED, CANCELLED),
            CONFIRMED, Set.of(COMPLETED, CANCELLED),
            COMPLETED, Set.of(),
            CANCELLED, Set.of());

    public void requireTransitionTo(OrderStatus next) {
        if (!TRANSITIONS.get(this).contains(next))
            throw BusinessException.conflict("Order cannot transition from " + this + " to " + next);
    }
}
