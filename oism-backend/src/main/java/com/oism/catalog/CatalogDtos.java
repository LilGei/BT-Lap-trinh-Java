package com.oism.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** DTO cho FR-PROD: thương hiệu, danh mục, sản phẩm, biến thể SKU, mã vạch, giá. */
public final class CatalogDtos {
    private CatalogDtos() {}

    public record BrandRequest(@NotBlank @Size(max = 200) String name) {}
    public record BrandDto(UUID id, String name) {}

    public record CategoryRequest(@NotBlank @Size(max = 200) String name, UUID parentId) {}
    public record CategoryDto(UUID id, UUID parentId, String name) {}

    /** skuCode để trống -> hệ thống tự sinh. barcode để trống -> chưa gán (có thể sinh sau). */
    public record VariantRequest(
            @Size(max = 64) String skuCode,
            @Size(max = 50) String color,
            @Size(max = 50) String size,
            @NotNull @PositiveOrZero BigDecimal retailPrice,
            @NotNull @PositiveOrZero BigDecimal wholesalePrice,
            @PositiveOrZero BigDecimal reorderThreshold,
            @Size(max = 50) String barcode) {}

    public record ProductRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @NotNull UUID categoryId,
            UUID brandId,
            @NotEmpty @Valid List<VariantRequest> variants) {}

    public record ProductUpdateRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @NotNull UUID categoryId,
            UUID brandId) {}

    public record PriceRequest(@NotNull @PositiveOrZero BigDecimal retailPrice,
                               @NotNull @PositiveOrZero BigDecimal wholesalePrice) {}

    public record ThresholdRequest(@NotNull @PositiveOrZero BigDecimal reorderThreshold) {}

    public record BarcodeRequest(@NotBlank @Size(max = 50) String code) {}

    public record BarcodeDto(UUID id, String code, BarcodeType type) {}

    /** averageCost = giá vốn bình quân hiện tại (FR-COST-01), khác với giá bán. */
    public record VariantDto(UUID id, UUID productId, String productName, String skuCode, String color, String size,
                             BigDecimal retailPrice, BigDecimal wholesalePrice, BigDecimal averageCost,
                             BigDecimal reorderThreshold, boolean active, List<BarcodeDto> barcodes) {}

    public record ProductDto(UUID id, UUID categoryId, UUID brandId, String name, String description,
                             boolean hasVariants, boolean active, List<VariantDto> variants) {}
}
