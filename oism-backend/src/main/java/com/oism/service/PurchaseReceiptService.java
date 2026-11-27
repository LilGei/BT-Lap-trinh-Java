package com.oism.service;

import com.oism.dto.InventoryDtos.*;
import com.oism.entity.*;
import com.oism.config.TenantContext;
import com.oism.repository.PurchaseReceiptRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class PurchaseReceiptService {
    private final PurchaseReceiptRepository repo;
    private final LedgerService ledger;
    private final CogsService cogs;

    public PurchaseReceiptService(PurchaseReceiptRepository repo, LedgerService ledger, CogsService cogs) {
        this.repo = repo; this.ledger = ledger; this.cogs = cogs;
    }

    @Transactional
    public PurchaseReceipt create(ReceiptReq req) {
        Long tenantId = TenantContext.getTenantId();
        if (req.items() == null || req.items().isEmpty()) throw new IllegalArgumentException("Receipt has no items");
        PurchaseReceipt r = new PurchaseReceipt();
        r.setTenantId(tenantId); r.setBranchId(req.branchId());
        r.setSupplierName(req.supplierName()); r.setNote(req.note());
        r.setCreatedBy(TenantContext.getUserId());
        for (ReceiptItemReq i : req.items()) {
            if (i.quantity() <= 0) throw new IllegalArgumentException("quantity must be > 0");
            if (i.importPrice() == null || i.importPrice().signum() < 0) throw new IllegalArgumentException("invalid import price");
            cogs.requireSku(tenantId, i.skuId());
            PurchaseReceiptItem it = new PurchaseReceiptItem();
            it.setSkuId(i.skuId()); it.setQuantity(i.quantity()); it.setImportPrice(i.importPrice());
            r.addItem(it);
        }
        return repo.save(r);
    }

    /** FR-INV-02 + FR-COST-01: xác nhận nhập => tính lại giá vốn, ghi sổ cái IN, tăng on_hand. Atomic. */
    @Transactional
    public PurchaseReceipt confirm(Long id) {
        Long tenantId = TenantContext.getTenantId();
        PurchaseReceipt r = repo.findForUpdate(id, tenantId).orElseThrow(() -> new EntityNotFoundException("Receipt " + id));
        if (r.getStatus() != DocStatus.DRAFT) throw new IllegalStateException("Receipt is " + r.getStatus());

        List<PurchaseReceiptItem> items = r.getItems().stream()
                .sorted(Comparator.comparing(PurchaseReceiptItem::getSkuId)).toList();   // thứ tự khoá cố định => tránh deadlock
        for (PurchaseReceiptItem i : items) {
            cogs.recalculateOnReceipt(tenantId, i.getSkuId(), i.getQuantity(), i.getImportPrice()); // trước khi cộng tồn
            ledger.record(tenantId, r.getBranchId(), i.getSkuId(), LedgerType.IN, LedgerReason.PURCHASE,
                    i.getQuantity(), "PURCHASE_RECEIPT", r.getId(), TenantContext.getUserId());
        }
        r.setStatus(DocStatus.CONFIRMED);
        r.setConfirmedAt(Instant.now());
        return r;
    }

    @Transactional
    public PurchaseReceipt cancel(Long id) {
        PurchaseReceipt r = repo.findForUpdate(id, TenantContext.getTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Receipt " + id));
        if (r.getStatus() != DocStatus.DRAFT) throw new IllegalStateException("Only DRAFT receipts can be cancelled");
        r.setStatus(DocStatus.CANCELLED);
        return r;
    }

    @Transactional(readOnly = true)
    public List<PurchaseReceipt> list() { return repo.findByTenantIdOrderByCreatedAtDesc(TenantContext.getTenantId()); }

    @Transactional(readOnly = true)
    public PurchaseReceipt get(Long id) {
        return repo.findByIdAndTenantId(id, TenantContext.getTenantId()).orElseThrow(() -> new EntityNotFoundException("Receipt " + id));
    }
}
