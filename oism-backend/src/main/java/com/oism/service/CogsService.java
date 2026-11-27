package com.oism.service;

import com.oism.entity.ProductSku;
import com.oism.repository.BranchInventoryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class CogsService {
    private final EntityManager em;
    private final BranchInventoryRepository inventoryRepo;

    public CogsService(EntityManager em, BranchInventoryRepository inventoryRepo) {
        this.em = em; this.inventoryRepo = inventoryRepo;
    }

    /** Kiểm tra SKU thuộc tenant. */
    @Transactional(readOnly = true)
    public ProductSku requireSku(Long tenantId, Long skuId) {
        ProductSku sku = em.find(ProductSku.class, skuId);
        if (sku == null || !tenantId.equals(sku.getTenantId()))
            throw new EntityNotFoundException("SKU not found: " + skuId);
        return sku;
    }

    /**
     * Tính lại giá vốn bình quân gia quyền. PHẢI gọi TRƯỚC khi ghi sổ cái IN
     * (vì OldStock là tồn trước nhập, tính trên toàn bộ chi nhánh của tenant).
     * Khoá dòng SKU (FOR UPDATE) để 2 phiếu nhập đồng thời không ghi đè giá vốn của nhau.
     */
    @Transactional
    public BigDecimal recalculateOnReceipt(Long tenantId, Long skuId, int importQty, BigDecimal importPrice) {
        ProductSku sku = em.find(ProductSku.class, skuId, LockModeType.PESSIMISTIC_WRITE);
        if (sku == null || !tenantId.equals(sku.getTenantId()))
            throw new EntityNotFoundException("SKU not found: " + skuId);
        int oldStock = inventoryRepo.sumOnHand(tenantId, skuId);
        BigDecimal newCost = CogsCalculator.weightedAverage(oldStock, sku.getCostPrice(), importQty, importPrice);
        sku.setCostPrice(newCost);
        return newCost;
    }
}
