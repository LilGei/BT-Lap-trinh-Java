package com.oism.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StocktakeRepository extends JpaRepository<Stocktake, UUID> {
    Page<Stocktake> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
