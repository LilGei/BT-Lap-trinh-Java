package com.oism.catalog;

import com.oism.catalog.CatalogDtos.*;
import com.oism.common.PageDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Đọc: mọi vai trò (Cashier cần tìm hàng ở POS).
 * Ghi sản phẩm/SKU/barcode/ngưỡng tồn: Owner + Staff. Giá niêm yết: chỉ Owner (theo sơ đồ use case).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {
    private static final String WRITE = "hasAnyRole('OWNER','STAFF')";
    private static final String OWNER = "hasRole('OWNER')";
    private final ProductService service;

    @GetMapping("/products")
    public PageDto<ProductDto> list(@RequestParam(required = false) String q,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return service.list(q, page, size);
    }

    @GetMapping("/products/{id}")
    public ProductDto get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping("/products")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDto create(@Valid @RequestBody ProductRequest r) { return service.create(r); }

    @PutMapping("/products/{id}")
    @PreAuthorize(WRITE)
    public ProductDto update(@PathVariable UUID id, @Valid @RequestBody ProductUpdateRequest r) {
        return service.update(id, r);
    }

    @PatchMapping("/products/{id}/active")
    @PreAuthorize(WRITE)
    public ProductDto setActive(@PathVariable UUID id, @RequestParam boolean value) {
        return service.setActive(id, value);
    }

    @PostMapping("/products/{id}/variants")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDto addVariant(@PathVariable UUID id, @Valid @RequestBody VariantRequest r) {
        return service.addVariant(id, r);
    }

    @GetMapping("/variants/search")
    public PageDto<VariantDto> search(@RequestParam(defaultValue = "") String q,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.search(q, page, size);
    }

    @GetMapping("/variants/by-barcode/{code}")
    public VariantDto byBarcode(@PathVariable String code) { return service.findByBarcode(code); }

    @PutMapping("/variants/{id}/prices")
    @PreAuthorize(OWNER)
    public VariantDto updatePrices(@PathVariable UUID id, @Valid @RequestBody PriceRequest r) {
        return service.updatePrices(id, r);
    }

    @PutMapping("/variants/{id}/reorder-threshold")
    @PreAuthorize(WRITE)
    public VariantDto updateThreshold(@PathVariable UUID id, @Valid @RequestBody ThresholdRequest r) {
        return service.updateReorderThreshold(id, r.reorderThreshold());
    }

    @PatchMapping("/variants/{id}/active")
    @PreAuthorize(WRITE)
    public VariantDto setVariantActive(@PathVariable UUID id, @RequestParam boolean value) {
        return service.setVariantActive(id, value);
    }

    @PostMapping("/variants/{id}/barcodes")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public VariantDto addBarcode(@PathVariable UUID id, @Valid @RequestBody BarcodeRequest r) {
        return service.addBarcode(id, r.code());
    }

    @PostMapping("/variants/{id}/barcodes/generate")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.CREATED)
    public VariantDto generateBarcode(@PathVariable UUID id) { return service.generateBarcode(id); }

    @DeleteMapping("/variants/{id}/barcodes/{barcodeId}")
    @PreAuthorize(WRITE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBarcode(@PathVariable UUID id, @PathVariable UUID barcodeId) {
        service.deleteBarcode(id, barcodeId);
    }
}
