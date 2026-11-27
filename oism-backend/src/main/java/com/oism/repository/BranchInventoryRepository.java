package com.oism.repository;

import com.oism.entity.BranchInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BranchInventoryRepository extends JpaRepository<BranchInventory, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)   // SELECT ... FOR UPDATE
    @Query("select b from BranchInventory b where b.tenantId = :t and b.branchId = :br and b.skuId = :s")
    Optional<BranchInventory> findForUpdate(@Param("t") Long t, @Param("br") Long br, @Param("s") Long s);

    @Modifying
    @Query(value = "INSERT INTO branch_inventory (tenant_id, branch_id, sku_id, on_hand, reserved) " +
                   "VALUES (:t, :br, :s, 0, 0) ON CONFLICT (tenant_id, branch_id, sku_id) DO NOTHING", nativeQuery = true)
    void insertIfAbsent(@Param("t") Long t, @Param("br") Long br, @Param("s") Long s);

    @Query("select coalesce(sum(b.onHand), 0) from BranchInventory b where b.tenantId = :t and b.skuId = :s")
    int sumOnHand(@Param("t") Long t, @Param("s") Long s);

    List<BranchInventory> findByTenantIdAndBranchId(Long tenantId, Long branchId);
}
