package com.oism.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "purchase_receipt_item")
public class PurchaseReceiptItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "receipt_id") private PurchaseReceipt receipt;
    @Column(name = "sku_id", nullable = false) private Long skuId;
    @Column(nullable = false) private int quantity;
    @Column(name = "import_price", nullable = false, precision = 18, scale = 4) private BigDecimal importPrice;

    public Long getId() { return id; }
    @com.fasterxml.jackson.annotation.JsonIgnore public PurchaseReceipt getReceipt() { return receipt; } void setReceipt(PurchaseReceipt r) { receipt = r; }
    public Long getSkuId() { return skuId; } public void setSkuId(Long v) { skuId = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { quantity = v; }
    public BigDecimal getImportPrice() { return importPrice; } public void setImportPrice(BigDecimal v) { importPrice = v; }
}
