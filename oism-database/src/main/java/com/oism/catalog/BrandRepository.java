package com.oism.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BrandRepository extends JpaRepository<Brand, UUID> {
    List<Brand> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}
