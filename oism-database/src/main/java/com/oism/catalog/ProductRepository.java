package com.oism.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Page<Product> findByNameContainingIgnoreCase(String q, Pageable pageable);
    boolean existsByCategoryId(UUID categoryId);
    boolean existsByBrandId(UUID brandId);
}
