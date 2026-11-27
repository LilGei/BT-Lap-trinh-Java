package com.oism.service;

import com.oism.config.TenantContext;
import com.oism.dto.InventoryDtos.*;
import com.oism.entity.*;
import com.oism.repository.StocktakeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/** FR-INV-04: tạo phiên kiểm kê -> nhập số đếm -> complete: so sánh với tồn hệ thống, sinh bút toán điều chỉnh. */
@Service
public class StocktakeService {
    private final StocktakeRepository repo;
    private final LedgerService ledger;
    private final CogsService cogs;

    public StocktakeService(StocktakeRepository repo, LedgerService ledger, CogsService cogs) {
        this.repo = repo; this.ledger = ledger; this.cogs = cogs;
    }

    @Transactional
    public Stocktake create(StocktakeReq req) {
        Stocktake s = new Stocktake();
        s.setTenantId(TenantContext.getTenantId()); s.setBranchId(req.branchId());
        s.setNote(req.note()); s.setCreatedBy(TenantContext.getUserId());
        return repo.save(s);
    }

    /** Ghi/ghi đè số đếm thực tế của từng SKU (chỉ khi phiên còn OPEN). */
    @Transactional
    public Stocktake saveCounts(Long id, List<CountReq> counts) {
        Stocktake s = load(id);
        if (s.getStatus() != DocStatus.OPEN) throw new IllegalStateException("Stocktake is " + s.getStatus());
        for (CountReq c : counts) {
            if (c.countedQty() < 0) throw new IllegalArgumentException("countedQty must be >= 0");
            cogs.requireSku(s.getTenantId(), c.skuId());
            StocktakeItem item = s.getItems().stream().filter(i -> i.getSkuId().equals(c.skuId())).findFirst()
                    .orElseGet(() -> { StocktakeItem n = new StocktakeItem(); n.setSkuId(c.skuId()); s.addItem(n); return n; });
            item.setCountedQty(c.countedQty());
        }
        return s;
    }

    @Transactional
    public Stocktake complete(Long id) {
        Stocktake s = load(id);
        if (s.getStatus() != DocStatus.OPEN) throw new IllegalStateException("Stocktake is " + s.getStatus());
        List<StocktakeItem> items = s.getItems().stream().sorted(Comparator.comparing(StocktakeItem::getSkuId)).toList();
        for (StocktakeItem i : items) {
            int system = ledger.lockInventory(s.getTenantId(), s.getBranchId(), i.getSkuId()).getOnHand();
            int diff = i.getCountedQty() - system;
            i.setSystemQty(system); i.setDiff(diff);
            if (diff != 0)
                ledger.record(s.getTenantId(), s.getBranchId(), i.getSkuId(),
                        diff > 0 ? LedgerType.IN : LedgerType.OUT, LedgerReason.STOCKTAKE_ADJUST,
                        Math.abs(diff), "STOCKTAKE", s.getId(), TenantContext.getUserId());
        }
        s.setStatus(DocStatus.COMPLETED); s.setCompletedAt(Instant.now());
        return s;
    }

    @Transactional(readOnly = true)
    public List<Stocktake> list() { return repo.findByTenantIdOrderByCreatedAtDesc(TenantContext.getTenantId()); }

    @Transactional(readOnly = true)
    public Stocktake get(Long id) {
        return repo.findByIdAndTenantId(id, TenantContext.getTenantId()).orElseThrow(() -> new EntityNotFoundException("Stocktake " + id));
    }

    private Stocktake load(Long id) {
        return repo.findForUpdate(id, TenantContext.getTenantId()).orElseThrow(() -> new EntityNotFoundException("Stocktake " + id));
    }
}
