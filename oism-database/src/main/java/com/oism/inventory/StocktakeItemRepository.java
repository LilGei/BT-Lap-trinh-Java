package com.oism.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StocktakeItemRepository extends JpaRepository<StocktakeItem, UUID> {
    List<StocktakeItem> findByStocktakeId(UUID stocktakeId);
    Optional<StocktakeItem> findByStocktakeIdAndSkuId(UUID stocktakeId, UUID skuId);
}
