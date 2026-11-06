package com.oism.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findAllByOrderByNameAsc();
    boolean existsByParentIdAndNameIgnoreCase(UUID parentId, String name);
    Optional<Category> findFirstByParentIdAndNameIgnoreCase(UUID parentId, String name);
    boolean existsByParentId(UUID parentId);
}
