package com.oism.inventory;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Ledger APPEND-ONLY: @Immutable (app-level) + trigger trg_ledger_no_update_delete (DB-level). */
@Entity @Table(name = "inventory_transactions") @Immutable
@Getter @Setter @NoArgsConstructor
public class InventoryTransaction extends TenantAwareEntity {
    public enum Type { IN, OUT }
    /** Theo sơ đồ: PurchaseReceipt, TransferOut, TransferIn, Sale, Return, StocktakeAdjust. */
    public enum ReferenceType { PURCHASE_RECEIPT, TRANSFER_OUT, TRANSFER_IN, SALE, RETURN, STOCKTAKE_ADJUST }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "branch_id", nullable = false) private UUID branchId;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Type type;
    @Enumerated(EnumType.STRING) @Column(name = "reference_type", nullable = false) private ReferenceType referenceType;
    @Column(name = "reference_id") private UUID referenceId;
    @Column(nullable = false) private BigDecimal quantity;
    @Column(name = "balance_after", nullable = false) private BigDecimal balanceAfter;
    @Column(name = "unit_cost") private BigDecimal unitCost;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
