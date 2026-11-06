package com.oism.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BarcodeRepository extends JpaRepository<Barcode, UUID> {
    Optional<Barcode> findByCode(String code);
    boolean existsByCode(String code);
    List<Barcode> findBySkuId(UUID skuId);
    List<Barcode> findBySkuIdIn(Collection<UUID> skuIds);
}
