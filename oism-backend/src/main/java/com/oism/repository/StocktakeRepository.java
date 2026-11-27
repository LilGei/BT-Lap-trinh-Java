package com.oism.repository;

import com.oism.entity.Stocktake;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StocktakeRepository extends JpaRepository<Stocktake, Long> {
    Optional<Stocktake> findByIdAndTenantId(Long id, Long tenantId);
    List<Stocktake> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Stocktake e where e.id = :id and e.tenantId = :t")
    Optional<Stocktake> findForUpdate(@Param("id") Long id, @Param("t") Long tenantId);
}
