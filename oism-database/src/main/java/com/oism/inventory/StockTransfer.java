package com.oism.inventory;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "stock_transfers")
@Getter @Setter @NoArgsConstructor
public class StockTransfer extends TenantAwareEntity {
    public enum Status { DRAFT, IN_TRANSIT, RECEIVED, CANCELLED }

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private String code;
    @Column(name = "from_branch_id", nullable = false) private UUID fromBranchId;
    @Column(name = "to_branch_id", nullable = false) private UUID toBranchId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.DRAFT;
    private String note;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "shipped_at") private Instant shippedAt;
    @Column(name = "received_at") private Instant receivedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "transfer_id", nullable = false)
    private List<StockTransferItem> items = new ArrayList<>();
}
