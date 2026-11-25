package com.oism.purchasing;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "purchase_receipts")
@Getter @Setter @NoArgsConstructor
public class PurchaseReceipt extends TenantAwareEntity {
    public enum Status { DRAFT, CONFIRMED, CANCELLED }

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "branch_id", nullable = false) private UUID branchId;
    @Column(name = "supplier_id", nullable = false) private UUID supplierId;
    @Column(nullable = false) private String code;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.DRAFT;
    private String note;
    @Column(name = "receipt_date", nullable = false) private Instant receiptDate = Instant.now();
    @Column(name = "total_amount", nullable = false) private BigDecimal totalAmount = BigDecimal.ZERO;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "confirmed_at") private Instant confirmedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "receipt_id", nullable = false)
    private List<PurchaseReceiptItem> items = new ArrayList<>();
}
