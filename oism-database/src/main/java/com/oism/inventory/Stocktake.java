package com.oism.inventory;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "stocktakes")
@Getter @Setter @NoArgsConstructor
public class Stocktake extends TenantAwareEntity {
    /** Theo sơ đồ chỉ có InProgress và Completed (phiên bỏ dở thì xoá). */
    public enum Status { IN_PROGRESS, COMPLETED }

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "branch_id", nullable = false) private UUID branchId;
    @Column(nullable = false) private String code;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.IN_PROGRESS;
    private String note;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
