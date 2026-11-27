package com.oism.service;

import com.oism.entity.*;
import com.oism.exception.OutOfStockException;
import com.oism.repository.BranchInventoryRepository;
import com.oism.repository.InventoryLedgerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cổng DUY NHẤT thay đổi on_hand. Mọi thay đổi = 1 dòng INSERT vào inventory_ledger
 * (kèm balance_after) và cập nhật cache on_hand trong cùng transaction, dưới khoá FOR UPDATE.
 * BE3 (POS/Order) có thể gọi record(...) khi Confirmed để ghi bút toán SALE.
 */
@Service
public class LedgerService {
    private final BranchInventoryRepository inventoryRepo;
    private final InventoryLedgerRepository ledgerRepo;

    public LedgerService(BranchInventoryRepository inventoryRepo, InventoryLedgerRepository ledgerRepo) {
        this.inventoryRepo = inventoryRepo; this.ledgerRepo = ledgerRepo;
    }

    /** Khoá dòng tồn kho (tạo nếu chưa có) và trả về. */
    @Transactional
    public BranchInventory lockInventory(Long tenantId, Long branchId, Long skuId) {
        inventoryRepo.insertIfAbsent(tenantId, branchId, skuId);   // idempotent, không lỗi khi đua nhau
        return inventoryRepo.findForUpdate(tenantId, branchId, skuId)
                .orElseThrow(() -> new IllegalStateException("Inventory row missing"));
    }

    @Transactional
    public InventoryLedger record(Long tenantId, Long branchId, Long skuId, LedgerType type, LedgerReason reason,
                                  int quantity, String refType, Long refId, Long userId) {
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be > 0");
        BranchInventory inv = lockInventory(tenantId, branchId, skuId);

        int newOnHand = type == LedgerType.IN ? inv.getOnHand() + quantity : inv.getOnHand() - quantity;
        if (type == LedgerType.OUT) {
            // Kiểm kê được phép hạ về số đếm thực tế; còn lại không được xuống dưới phần đã reserved.
            int floor = reason == LedgerReason.STOCKTAKE_ADJUST ? 0 : inv.getReserved();
            if (newOnHand < floor)
                throw new OutOfStockException("Insufficient stock for SKU " + skuId + " at branch " + branchId
                        + ": available=" + inv.getAvailable() + ", requested=" + quantity);
        }
        inv.setOnHand(newOnHand);
        return ledgerRepo.save(InventoryLedger.of(tenantId, branchId, skuId, type, reason,
                quantity, newOnHand, refType, refId, userId));
    }

    @Transactional(readOnly = true)
    public Page<InventoryLedger> search(Long tenantId, Long branchId, Long skuId, Pageable pageable) {
        return ledgerRepo.search(tenantId, branchId, skuId, pageable);
    }
}
