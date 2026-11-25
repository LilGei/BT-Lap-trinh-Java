package com.oism.inventory;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface StockBalanceRepository extends JpaRepository<StockBalance, Long>, JpaSpecificationExecutor<StockBalance> {
    /** SELECT ... FOR UPDATE: các request đồng thời trên cùng SKU được xếp hàng tuần tự (NFR-PERF-02). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from StockBalance s where s.branchId = :branchId and s.skuId = :skuId")
    Optional<StockBalance> findForUpdate(@Param("branchId") UUID branchId, @Param("skuId") UUID skuId);

    Optional<StockBalance> findByBranchIdAndSkuId(UUID branchId, UUID skuId);

    @Query("select sum(s.onHand) from StockBalance s where s.skuId = :skuId")
    BigDecimal sumOnHandRaw(@Param("skuId") UUID skuId);

    /** Tổng tồn vật lý của 1 SKU trên mọi chi nhánh (dùng làm "Old Stock" khi tính giá vốn). */
    default BigDecimal totalOnHand(UUID skuId) {
        BigDecimal v = sumOnHandRaw(skuId);
        return v == null ? BigDecimal.ZERO : v;
    }
}
