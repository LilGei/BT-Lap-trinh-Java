package com.oism.catalog;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Một dòng = một SKU. currentAverageCost là giá vốn bình quân, KHÔNG phải giá bán. */
@Entity @Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor
public class ProductVariant extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "product_id", nullable = false) private UUID productId;
    @Column(name = "sku_code", nullable = false) private String skuCode;
    private String color;
    private String size;
    @Column(name = "current_average_cost", nullable = false) private BigDecimal currentAverageCost = BigDecimal.ZERO;
    @Column(name = "retail_price", nullable = false) private BigDecimal retailPrice = BigDecimal.ZERO;
    @Column(name = "wholesale_price", nullable = false) private BigDecimal wholesalePrice = BigDecimal.ZERO;
    @Column(name = "reorder_threshold", nullable = false) private BigDecimal reorderThreshold = BigDecimal.ZERO;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
