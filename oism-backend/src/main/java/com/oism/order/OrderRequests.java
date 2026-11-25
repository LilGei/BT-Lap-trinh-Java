package com.oism.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class OrderRequests {
    private OrderRequests() {}

    public record Line(@NotNull UUID skuId, @NotNull @Positive BigDecimal quantity) {}

    public record CreateOrder(@NotNull UUID branchId, @NotBlank String channel,
                              String externalOrderId, String customerName, String customerPhone,
                              @PositiveOrZero BigDecimal discount,
                              @NotEmpty List<@Valid Line> items) {}

    public record StatusChange(@NotBlank String status) {}

    public record Checkout(@NotNull UUID branchId, String customerName, String customerPhone,
                           @NotBlank String paymentMethod, @PositiveOrZero BigDecimal discount,
                           @NotEmpty List<@Valid Line> items) {}

    public record WebhookOrder(@NotBlank String externalOrderId, @NotNull UUID branchId,
                               String customerName, String customerPhone,
                               @PositiveOrZero BigDecimal discount,
                               @NotEmpty List<@Valid Line> items) {}
}
