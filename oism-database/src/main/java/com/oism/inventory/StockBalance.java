package com.oism.inventory;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Số dư tồn kho theo (chi nhánh, SKU). Chỉ InventoryService được thay đổi, luôn đi kèm 1 dòng ledger. */
@Entity @Table(name = "stock_balances")
@Getter @Setter @NoArgsConstructor
public class StockBalance extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "branch_id", nullable = false) private UUID branchId;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Column(name = "on_hand", nullable = false) private BigDecimal onHand = BigDecimal.ZERO;
    @Column(nullable = false) private BigDecimal reserved = BigDecimal.ZERO;
    @Version private int version;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();

    /** FR-RSE-01: available = on_hand - reserved */
    public BigDecimal available() { return onHand.subtract(reserved); }
}
