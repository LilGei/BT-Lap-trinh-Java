package com.oism.catalog;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** FR-PROD-03: một SKU có thể có nhiều barcode (mã nhà sản xuất, mã nội bộ...). */
@Entity @Table(name = "barcodes")
@Getter @Setter @NoArgsConstructor
public class Barcode extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Column(nullable = false) private String code;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private BarcodeType type;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
