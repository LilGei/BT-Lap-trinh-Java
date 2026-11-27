package com.oism.repository;

import com.oism.entity.PurchaseReceipt;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, Long> {
    Optional<PurchaseReceipt> findByIdAndTenantId(Long id, Long tenantId);
    List<PurchaseReceipt> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from PurchaseReceipt e where e.id = :id and e.tenantId = :t")
    Optional<PurchaseReceipt> findForUpdate(@Param("id") Long id, @Param("t") Long tenantId);
}
