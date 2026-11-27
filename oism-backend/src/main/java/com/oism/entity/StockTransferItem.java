package com.oism.entity;

import jakarta.persistence.*;

@Entity @Table(name = "stock_transfer_item")
public class StockTransferItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "transfer_id") private StockTransfer transfer;
    @Column(name = "sku_id", nullable = false) private Long skuId;
    @Column(nullable = false) private int quantity;

    public Long getId() { return id; }
    @com.fasterxml.jackson.annotation.JsonIgnore public StockTransfer getTransfer() { return transfer; } void setTransfer(StockTransfer t) { transfer = t; }
    public Long getSkuId() { return skuId; } public void setSkuId(Long v) { skuId = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { quantity = v; }
}
