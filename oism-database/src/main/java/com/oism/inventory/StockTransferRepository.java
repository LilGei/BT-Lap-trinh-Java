package com.oism.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {
    Page<StockTransfer> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
