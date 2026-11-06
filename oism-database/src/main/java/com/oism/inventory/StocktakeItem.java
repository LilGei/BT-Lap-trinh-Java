package com.oism.inventory;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "stocktake_items")
@Getter @Setter @NoArgsConstructor
public class StocktakeItem extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "stocktake_id", nullable = false) private UUID stocktakeId;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Column(name = "system_qty", nullable = false) private BigDecimal systemQty = BigDecimal.ZERO;
    @Column(name = "actual_qty", nullable = false) private BigDecimal actualQty = BigDecimal.ZERO;
    @Column(name = "difference_qty", nullable = false) private BigDecimal differenceQty = BigDecimal.ZERO;
}
