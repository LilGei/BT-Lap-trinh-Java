package com.oism.inventory;

import com.oism.common.PageDto;
import com.oism.inventory.InventoryDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Ngưỡng cảnh báo nằm trên SKU: PUT /api/variants/{id}/reorder-threshold (ProductController). */
@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryQueryService service;

    /** Tồn kho theo chi nhánh/SKU. lowStockOnly=true: chỉ SKU có available <= reorderThreshold. */
    @GetMapping("/stock")
    public PageDto<StockDto> stock(@RequestParam(required = false) UUID branchId,
                                   @RequestParam(required = false) UUID skuId,
                                   @RequestParam(defaultValue = "false") boolean lowStockOnly,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return service.stock(branchId, skuId, lowStockOnly, page, size);
    }

    /** Sổ cái tồn kho (mới nhất trước). */
    @GetMapping("/ledger")
    @PreAuthorize("hasAnyRole('OWNER','STAFF')")
    public PageDto<LedgerDto> ledger(@RequestParam(required = false) UUID branchId,
                                     @RequestParam(required = false) UUID skuId,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return service.ledger(branchId, skuId, page, size);
    }
}
