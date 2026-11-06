package com.oism.catalog;

import com.oism.catalog.CatalogDtos.*;
import com.oism.common.BusinessException;
import com.oism.common.EntityLookup;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** FR-PROD-01: danh mục phân cấp (trả danh sách phẳng có parentId; client tự dựng cây). */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private static final String WRITE = "hasRole('OWNER')";
    private final CategoryRepository categories;
    private final ProductRepository products;

    @GetMapping
    @Transactional(readOnly = true)
    public List<CategoryDto> list() {
        return categories.findAllByOrderByNameAsc().stream().map(CategoryController::dto).toList();
    }

    @PostMapping
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CategoryDto create(@Valid @RequestBody CategoryRequest r) {
        if (r.parentId() != null) EntityLookup.require(categories, r.parentId(), "Parent category");
        String name = r.name().trim();
        if (categories.existsByParentIdAndNameIgnoreCase(r.parentId(), name))
            throw BusinessException.conflict("Category name already exists at this level");
        Category c = new Category();
        c.setName(name);
        c.setParentId(r.parentId());
        return dto(categories.save(c));
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE)
    @Transactional
    public CategoryDto update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest r) {
        Category c = EntityLookup.require(categories, id, "Category");
        if (r.parentId() != null) {
            EntityLookup.require(categories, r.parentId(), "Parent category");
            UUID cur = r.parentId();
            for (int guard = 0; cur != null && guard < 100; guard++) {   // chống vòng lặp cha-con
                if (cur.equals(id)) throw BusinessException.badRequest("A category cannot be its own ancestor");
                cur = categories.findById(cur).map(Category::getParentId).orElse(null);
            }
        }
        c.setName(r.name().trim());
        c.setParentId(r.parentId());
        return dto(c);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        Category c = EntityLookup.require(categories, id, "Category");
        if (categories.existsByParentId(id)) throw BusinessException.conflict("Category has sub-categories");
        if (products.existsByCategoryId(id)) throw BusinessException.conflict("Category still has products");
        categories.delete(c);
    }

    private static CategoryDto dto(Category c) { return new CategoryDto(c.getId(), c.getParentId(), c.getName()); }
}
