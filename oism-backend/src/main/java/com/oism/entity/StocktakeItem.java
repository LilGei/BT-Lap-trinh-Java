package com.oism.entity;

import jakarta.persistence.*;

@Entity @Table(name = "stocktake_item")
public class StocktakeItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "stocktake_id") private Stocktake stocktake;
    @Column(name = "sku_id", nullable = false) private Long skuId;
    @Column(name = "counted_qty", nullable = false) private int countedQty;
    @Column(name = "system_qty") private Integer systemQty;   // chốt lúc complete
    private Integer diff;                                      // counted - system

    public Long getId() { return id; }
    @com.fasterxml.jackson.annotation.JsonIgnore public Stocktake getStocktake() { return stocktake; } void setStocktake(Stocktake s) { stocktake = s; }
    public Long getSkuId() { return skuId; } public void setSkuId(Long v) { skuId = v; }
    public int getCountedQty() { return countedQty; } public void setCountedQty(int v) { countedQty = v; }
    public Integer getSystemQty() { return systemQty; } public void setSystemQty(Integer v) { systemQty = v; }
    public Integer getDiff() { return diff; } public void setDiff(Integer v) { diff = v; }
}
