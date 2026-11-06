package com.oism.cost;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "cost_history") @Immutable
@Getter @Setter @NoArgsConstructor
public class CostHistory extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Column(name = "receipt_id") private UUID receiptId;
    @Column(name = "old_stock", nullable = false) private BigDecimal oldStock;
    @Column(name = "old_cost", nullable = false) private BigDecimal oldCost;
    @Column(name = "import_qty", nullable = false) private BigDecimal importQty;
    @Column(name = "import_price", nullable = false) private BigDecimal importPrice;
    @Column(name = "new_cost", nullable = false) private BigDecimal newCost;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
