package com.oism.entity;

import jakarta.persistence.*;

/** Tồn kho theo chi nhánh. on_hand CHỈ được đổi qua LedgerService. available = on_hand - reserved. */
@Entity
@Table(name = "branch_inventory",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "branch_id", "sku_id"}))
public class BranchInventory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "tenant_id", nullable = false) private Long tenantId;
    @Column(name = "branch_id", nullable = false) private Long branchId;
    @Column(name = "sku_id", nullable = false) private Long skuId;
    @Column(name = "on_hand", nullable = false) private int onHand;
    @Column(nullable = false) private int reserved;

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public Long getBranchId() { return branchId; }
    public Long getSkuId() { return skuId; }
    public int getOnHand() { return onHand; }
    public int getReserved() { return reserved; }
    public int getAvailable() { return onHand - reserved; }
    public void setOnHand(int onHand) { this.onHand = onHand; }
    public void setReserved(int reserved) { this.reserved = reserved; }
}
