package com.oism.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "stock_transfer")
public class StockTransfer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "tenant_id", nullable = false) private Long tenantId;
    @Column(name = "from_branch_id", nullable = false) private Long fromBranchId;
    @Column(name = "to_branch_id", nullable = false) private Long toBranchId;
    private String note;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private DocStatus status = DocStatus.DRAFT;
    @Column(name = "created_by") private Long createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "dispatched_at") private Instant dispatchedAt;
    @Column(name = "received_at") private Instant receivedAt;
    @OneToMany(mappedBy = "transfer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockTransferItem> items = new ArrayList<>();

    public void addItem(StockTransferItem i) { i.setTransfer(this); items.add(i); }
    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; } public void setTenantId(Long v) { tenantId = v; }
    public Long getFromBranchId() { return fromBranchId; } public void setFromBranchId(Long v) { fromBranchId = v; }
    public Long getToBranchId() { return toBranchId; } public void setToBranchId(Long v) { toBranchId = v; }
    public String getNote() { return note; } public void setNote(String v) { note = v; }
    public DocStatus getStatus() { return status; } public void setStatus(DocStatus v) { status = v; }
    public Long getCreatedBy() { return createdBy; } public void setCreatedBy(Long v) { createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDispatchedAt() { return dispatchedAt; } public void setDispatchedAt(Instant v) { dispatchedAt = v; }
    public Instant getReceivedAt() { return receivedAt; } public void setReceivedAt(Instant v) { receivedAt = v; }
    public List<StockTransferItem> getItems() { return items; }
}
