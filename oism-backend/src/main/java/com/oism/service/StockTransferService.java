package com.oism.service;

import com.oism.config.TenantContext;
import com.oism.dto.InventoryDtos.*;
import com.oism.entity.*;
import com.oism.repository.StockTransferRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/** FR-INV-03: DRAFT -> IN_TRANSIT (xuất đi đường) -> RECEIVED (xác nhận nhập). Giá vốn không đổi khi điều chuyển. */
@Service
public class StockTransferService {
    private static final String REF = "STOCK_TRANSFER";
    private final StockTransferRepository repo;
    private final LedgerService ledger;
    private final CogsService cogs;

    public StockTransferService(StockTransferRepository repo, LedgerService ledger, CogsService cogs) {
        this.repo = repo; this.ledger = ledger; this.cogs = cogs;
    }

    @Transactional
    public StockTransfer create(TransferReq req) {
        Long tenantId = TenantContext.getTenantId();
        if (req.fromBranchId() == null || req.toBranchId() == null || req.fromBranchId().equals(req.toBranchId()))
            throw new IllegalArgumentException("Source and destination branch must differ");
        if (req.items() == null || req.items().isEmpty()) throw new IllegalArgumentException("Transfer has no items");
        StockTransfer t = new StockTransfer();
        t.setTenantId(tenantId); t.setFromBranchId(req.fromBranchId()); t.setToBranchId(req.toBranchId());
        t.setNote(req.note()); t.setCreatedBy(TenantContext.getUserId());
        for (TransferItemReq i : req.items()) {
            if (i.quantity() <= 0) throw new IllegalArgumentException("quantity must be > 0");
            cogs.requireSku(tenantId, i.skuId());
            StockTransferItem it = new StockTransferItem();
            it.setSkuId(i.skuId()); it.setQuantity(i.quantity());
            t.addItem(it);
        }
        return repo.save(t);
    }

    /** Bước 1: trừ kho nguồn (OUT), hàng đang đi đường. */
    @Transactional
    public StockTransfer dispatch(Long id) {
        StockTransfer t = load(id);
        require(t, DocStatus.DRAFT);
        for (StockTransferItem i : sorted(t))
            ledger.record(t.getTenantId(), t.getFromBranchId(), i.getSkuId(), LedgerType.OUT, LedgerReason.TRANSFER_OUT,
                    i.getQuantity(), REF, t.getId(), TenantContext.getUserId());
        t.setStatus(DocStatus.IN_TRANSIT); t.setDispatchedAt(Instant.now());
        return t;
    }

    /** Bước 2: chi nhánh đích xác nhận => cộng kho đích (IN). */
    @Transactional
    public StockTransfer receive(Long id) {
        StockTransfer t = load(id);
        require(t, DocStatus.IN_TRANSIT);
        for (StockTransferItem i : sorted(t))
            ledger.record(t.getTenantId(), t.getToBranchId(), i.getSkuId(), LedgerType.IN, LedgerReason.TRANSFER_IN,
                    i.getQuantity(), REF, t.getId(), TenantContext.getUserId());
        t.setStatus(DocStatus.RECEIVED); t.setReceivedAt(Instant.now());
        return t;
    }

    /** Huỷ: DRAFT thì đổi trạng thái; IN_TRANSIT thì ghi bút toán bù (IN) trả hàng về kho nguồn. */
    @Transactional
    public StockTransfer cancel(Long id) {
        StockTransfer t = load(id);
        if (t.getStatus() == DocStatus.IN_TRANSIT) {
            for (StockTransferItem i : sorted(t))
                ledger.record(t.getTenantId(), t.getFromBranchId(), i.getSkuId(), LedgerType.IN, LedgerReason.TRANSFER_RETURN,
                        i.getQuantity(), REF, t.getId(), TenantContext.getUserId());
        } else require(t, DocStatus.DRAFT);
        t.setStatus(DocStatus.CANCELLED);
        return t;
    }

    @Transactional(readOnly = true)
    public List<StockTransfer> list() { return repo.findByTenantIdOrderByCreatedAtDesc(TenantContext.getTenantId()); }

    @Transactional(readOnly = true)
    public StockTransfer get(Long id) {
        return repo.findByIdAndTenantId(id, TenantContext.getTenantId()).orElseThrow(() -> new EntityNotFoundException("Transfer " + id));
    }

    private StockTransfer load(Long id) {
        return repo.findForUpdate(id, TenantContext.getTenantId()).orElseThrow(() -> new EntityNotFoundException("Transfer " + id));
    }
    private void require(StockTransfer t, DocStatus s) {
        if (t.getStatus() != s) throw new IllegalStateException("Transfer is " + t.getStatus() + ", expected " + s);
    }
    private List<StockTransferItem> sorted(StockTransfer t) {
        return t.getItems().stream().sorted(Comparator.comparing(StockTransferItem::getSkuId)).toList();
    }
}
