package com.oism.purchasing;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "purchase_receipt_items")
@Getter @Setter @NoArgsConstructor
public class PurchaseReceiptItem extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Column(nullable = false) private BigDecimal quantity;
    @Column(name = "unit_price", nullable = false) private BigDecimal unitPrice;
}
