package com.oism.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "purchase_receipt")
public class PurchaseReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "tenant_id", nullable = false) private Long tenantId;
    @Column(name = "branch_id", nullable = false) private Long branchId;
    @Column(name = "supplier_name") private String supplierName;
    private String note;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private DocStatus status = DocStatus.DRAFT;
    @Column(name = "created_by") private Long createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "confirmed_at") private Instant confirmedAt;
    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseReceiptItem> items = new ArrayList<>();

    public void addItem(PurchaseReceiptItem i) { i.setReceipt(this); items.add(i); }
    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; } public void setTenantId(Long v) { tenantId = v; }
    public Long getBranchId() { return branchId; } public void setBranchId(Long v) { branchId = v; }
    public String getSupplierName() { return supplierName; } public void setSupplierName(String v) { supplierName = v; }
    public String getNote() { return note; } public void setNote(String v) { note = v; }
    public DocStatus getStatus() { return status; } public void setStatus(DocStatus v) { status = v; }
    public Long getCreatedBy() { return createdBy; } public void setCreatedBy(Long v) { createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getConfirmedAt() { return confirmedAt; } public void setConfirmedAt(Instant v) { confirmedAt = v; }
    public List<PurchaseReceiptItem> getItems() { return items; }
}
