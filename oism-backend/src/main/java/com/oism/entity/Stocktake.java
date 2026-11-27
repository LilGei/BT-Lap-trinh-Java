package com.oism.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "stocktake")
public class Stocktake {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "tenant_id", nullable = false) private Long tenantId;
    @Column(name = "branch_id", nullable = false) private Long branchId;
    private String note;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private DocStatus status = DocStatus.OPEN;
    @Column(name = "created_by") private Long createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "completed_at") private Instant completedAt;
    @OneToMany(mappedBy = "stocktake", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StocktakeItem> items = new ArrayList<>();

    public void addItem(StocktakeItem i) { i.setStocktake(this); items.add(i); }
    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; } public void setTenantId(Long v) { tenantId = v; }
    public Long getBranchId() { return branchId; } public void setBranchId(Long v) { branchId = v; }
    public String getNote() { return note; } public void setNote(String v) { note = v; }
    public DocStatus getStatus() { return status; } public void setStatus(DocStatus v) { status = v; }
    public Long getCreatedBy() { return createdBy; } public void setCreatedBy(Long v) { createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; } public void setCompletedAt(Instant v) { completedAt = v; }
    public List<StocktakeItem> getItems() { return items; }
}
