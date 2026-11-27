package com.oism.repository;

import com.oism.entity.StockTransfer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    Optional<StockTransfer> findByIdAndTenantId(Long id, Long tenantId);
    List<StockTransfer> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from StockTransfer e where e.id = :id and e.tenantId = :t")
    Optional<StockTransfer> findForUpdate(@Param("id") Long id, @Param("t") Long tenantId);
}
