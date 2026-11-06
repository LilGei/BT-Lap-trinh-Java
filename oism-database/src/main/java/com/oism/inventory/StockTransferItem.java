package com.oism.inventory;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "stock_transfer_items")
@Getter @Setter @NoArgsConstructor
public class StockTransferItem extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "sku_id", nullable = false) private UUID skuId;
    @Column(nullable = false) private BigDecimal quantity;
}
