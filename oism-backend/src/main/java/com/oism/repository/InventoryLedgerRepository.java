package com.oism.repository;

import com.oism.entity.InventoryLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** Cố tình extends Repository (không phải JpaRepository) => KHÔNG có delete/update. Chỉ save (insert) và đọc. */
public interface InventoryLedgerRepository extends Repository<InventoryLedger, Long> {
    InventoryLedger save(InventoryLedger entry);

    @Query("select l from InventoryLedger l where l.tenantId = :t and (:b is null or l.branchId = :b) " +
           "and (:s is null or l.skuId = :s) order by l.createdAt desc, l.id desc")
    Page<InventoryLedger> search(@Param("t") Long tenantId, @Param("b") Long branchId,
                                 @Param("s") Long skuId, Pageable pageable);
}
