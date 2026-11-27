package com.oism.dto;

import java.math.BigDecimal;
import java.util.List;

public final class InventoryDtos {
    private InventoryDtos() {}

    public record ReceiptItemReq(Long skuId, int quantity, BigDecimal importPrice) {}
    public record ReceiptReq(Long branchId, String supplierName, String note, List<ReceiptItemReq> items) {}

    public record TransferItemReq(Long skuId, int quantity) {}
    public record TransferReq(Long fromBranchId, Long toBranchId, String note, List<TransferItemReq> items) {}

    public record StocktakeReq(Long branchId, String note) {}
    public record CountReq(Long skuId, int countedQty) {}
}
