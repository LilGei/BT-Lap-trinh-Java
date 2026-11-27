package com.oism.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;
import java.time.Instant;

/** Sổ cái kho: CHỈ INSERT. Không có setter, @Immutable, chặn update/delete ở mức entity (FR-INV-01, NFR-SEC-03). */
@Entity
@Table(name = "inventory_ledger")
@Immutable
public class InventoryLedger {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private Long tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private Long branchId;
    @Column(name = "sku_id", nullable = false, updatable = false) private Long skuId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, updatable = false) private LedgerType type;
    @Enumerated(EnumType.STRING) @Column(nullable = false, updatable = false) private LedgerReason reason;
    @Column(nullable = false, updatable = false) private int quantity;
    @Column(name = "balance_after", nullable = false, updatable = false) private int balanceAfter;
    @Column(name = "reference_type", updatable = false) private String referenceType;
    @Column(name = "reference_id", updatable = false) private Long referenceId;
    @Column(name = "created_by", updatable = false) private Long createdBy;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected InventoryLedger() {}

    public static InventoryLedger of(Long tenantId, Long branchId, Long skuId, LedgerType type, LedgerReason reason,
                                     int quantity, int balanceAfter, String refType, Long refId, Long userId) {
        InventoryLedger l = new InventoryLedger();
        l.tenantId = tenantId; l.branchId = branchId; l.skuId = skuId; l.type = type; l.reason = reason;
        l.quantity = quantity; l.balanceAfter = balanceAfter; l.referenceType = refType; l.referenceId = refId;
        l.createdBy = userId;
        return l;
    }

    @PreUpdate @PreRemove
    void forbid() { throw new UnsupportedOperationException("InventoryLedger is append-only"); }

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public Long getBranchId() { return branchId; }
    public Long getSkuId() { return skuId; }
    public LedgerType getType() { return type; }
    public LedgerReason getReason() { return reason; }
    public int getQuantity() { return quantity; }
    public int getBalanceAfter() { return balanceAfter; }
    public String getReferenceType() { return referenceType; }
    public Long getReferenceId() { return referenceId; }
    public Long getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
