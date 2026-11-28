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

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {
    private static final String WRITE = "hasRole('OWNER')";
    private final BrandRepository brands;
    private final ProductRepository products;

    @GetMapping
    @Transactional(readOnly = true)
    public List<BrandDto> list() {
        return brands.findAllByOrderByNameAsc().stream().map(BrandController::dto).toList();
    }

    @PostMapping
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public BrandDto create(@Valid @RequestBody BrandRequest r) {
        String name = r.name().trim();
        if (brands.existsByNameIgnoreCase(name)) throw BusinessException.conflict("Brand already exists");
        Brand b = new Brand();
        b.setName(name);
        return dto(brands.save(b));
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE)
    @Transactional
    public BrandDto update(@PathVariable UUID id, @Valid @RequestBody BrandRequest r) {
        Brand b = EntityLookup.require(brands, id, "Brand");
        String name = r.name().trim();
        if (!b.getName().equalsIgnoreCase(name) && brands.existsByNameIgnoreCase(name))
            throw BusinessException.conflict("Brand already exists");
        b.setName(name);
        return dto(b);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        Brand b = EntityLookup.require(brands, id, "Brand");
        if (products.existsByBrandId(id)) throw BusinessException.conflict("Brand still has products");
        brands.delete(b);
    }

    private static BrandDto dto(Brand b) { return new BrandDto(b.getId(), b.getName()); }
}
