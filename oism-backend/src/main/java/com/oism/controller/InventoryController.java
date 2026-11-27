package com.oism.controller;

import com.oism.config.TenantContext;
import com.oism.dto.InventoryDtos.*;
import com.oism.entity.*;
import com.oism.repository.BranchInventoryRepository;
import com.oism.service.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** Owner + Staff được thao tác kho (Cashier chỉ dùng POS). Cần @EnableMethodSecurity trong SecurityConfig. */
@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
public class InventoryController {
    private final PurchaseReceiptService receipts;
    private final StockTransferService transfers;
    private final StocktakeService stocktakes;
    private final LedgerService ledger;
    private final BranchInventoryRepository stockRepo;

    public InventoryController(PurchaseReceiptService receipts, StockTransferService transfers,
                               StocktakeService stocktakes, LedgerService ledger, BranchInventoryRepository stockRepo) {
        this.receipts = receipts; this.transfers = transfers; this.stocktakes = stocktakes;
        this.ledger = ledger; this.stockRepo = stockRepo;
    }

    // ---- Phiếu nhập ----
    @PostMapping("/receipts") @ResponseStatus(HttpStatus.CREATED)
    public PurchaseReceipt createReceipt(@RequestBody ReceiptReq req) { return receipts.create(req); }
    @GetMapping("/receipts") public List<PurchaseReceipt> listReceipts() { return receipts.list(); }
    @GetMapping("/receipts/{id}") public PurchaseReceipt getReceipt(@PathVariable Long id) { return receipts.get(id); }
    @PostMapping("/receipts/{id}/confirm") public PurchaseReceipt confirmReceipt(@PathVariable Long id) { return receipts.confirm(id); }
    @PostMapping("/receipts/{id}/cancel") public PurchaseReceipt cancelReceipt(@PathVariable Long id) { return receipts.cancel(id); }

    // ---- Điều chuyển kho 2 bước ----
    @PostMapping("/transfers") @ResponseStatus(HttpStatus.CREATED)
    public StockTransfer createTransfer(@RequestBody TransferReq req) { return transfers.create(req); }
    @GetMapping("/transfers") public List<StockTransfer> listTransfers() { return transfers.list(); }
    @GetMapping("/transfers/{id}") public StockTransfer getTransfer(@PathVariable Long id) { return transfers.get(id); }
    @PostMapping("/transfers/{id}/dispatch") public StockTransfer dispatch(@PathVariable Long id) { return transfers.dispatch(id); }
    @PostMapping("/transfers/{id}/receive") public StockTransfer receive(@PathVariable Long id) { return transfers.receive(id); }
    @PostMapping("/transfers/{id}/cancel") public StockTransfer cancelTransfer(@PathVariable Long id) { return transfers.cancel(id); }

    // ---- Kiểm kê ----
    @PostMapping("/stocktakes") @ResponseStatus(HttpStatus.CREATED)
    public Stocktake createStocktake(@RequestBody StocktakeReq req) { return stocktakes.create(req); }
    @GetMapping("/stocktakes") public List<Stocktake> listStocktakes() { return stocktakes.list(); }
    @GetMapping("/stocktakes/{id}") public Stocktake getStocktake(@PathVariable Long id) { return stocktakes.get(id); }
    @PutMapping("/stocktakes/{id}/counts") public Stocktake saveCounts(@PathVariable Long id, @RequestBody List<CountReq> counts) { return stocktakes.saveCounts(id, counts); }
    @PostMapping("/stocktakes/{id}/complete") public Stocktake completeStocktake(@PathVariable Long id) { return stocktakes.complete(id); }

    // ---- Tra cứu sổ cái & tồn kho (chỉ đọc) ----
    @GetMapping("/ledger")
    public Page<InventoryLedger> ledger(@RequestParam(required = false) Long branchId,
                                        @RequestParam(required = false) Long skuId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "50") int size) {
        return ledger.search(TenantContext.getTenantId(), branchId, skuId, PageRequest.of(page, Math.min(size, 200)));
    }

    @GetMapping("/stock")
    public List<BranchInventory> stock(@RequestParam Long branchId) {
        return stockRepo.findByTenantIdAndBranchId(TenantContext.getTenantId(), branchId);
    }
}
