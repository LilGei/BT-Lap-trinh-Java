package com.oism.purchasing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {
    Page<PurchaseReceipt> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
