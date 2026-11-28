package com.oism.catalog;

import com.oism.catalog.CatalogDtos.*;
import com.oism.common.BusinessException;
import com.oism.common.EntityLookup;
import com.oism.common.PageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * FR-PROD: sản phẩm, biến thể SKU, mã vạch, giá bán lẻ/bán buôn, ngưỡng tồn.
 * Tenant isolation do Hibernate @TenantId đảm bảo (TenantContextFilter set từ JWT) - không lọc tenant thủ công.
 * Giá vốn (currentAverageCost) KHÔNG sửa ở đây: chỉ phiếu nhập hàng (BE2) được cập nhật.
 */
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final BarcodeRepository barcodes;
    private final CategoryRepository categories;
    private final BrandRepository brands;

    // ------------------------------------------------------------------ đọc

    @Transactional(readOnly = true)
    public PageDto<ProductDto> list(String q, int page, int size) {
        Pageable pg = PageRequest.of(Math.max(page, 0), PageDto.clampSize(size), Sort.by("name"));
        Page<Product> p = (q == null || q.isBlank())
                ? products.findAll(pg)
                : products.findByNameContainingIgnoreCase(q.trim(), pg);
        return new PageDto<>(toProductDtos(p.getContent()), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ProductDto get(UUID id) {
        return toProductDtos(List.of(EntityLookup.require(products, id, "Product"))).get(0);
    }

    /** FR-POS-01: tìm theo tên / SKU / barcode, chỉ trả SKU đang bán. */
    @Transactional(readOnly = true)
    public PageDto<VariantDto> search(String q, int page, int size) {
        String needle = q == null ? "" : q.trim();
        Pageable pg = PageRequest.of(Math.max(page, 0), PageDto.clampSize(size));
        Page<ProductVariant> p = variants.search("%" + needle.toLowerCase(Locale.ROOT) + "%", needle, pg);
        return new PageDto<>(toVariantDtos(p.getContent()), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    /** Quét mã vạch ở POS. SKU ngừng bán -> 409 để thu ngân biết lý do. */
    @Transactional(readOnly = true)
    public VariantDto findByBarcode(String code) {
        Barcode b = barcodes.findByCode(code.trim()).orElseThrow(() -> BusinessException.notFound("Barcode not found"));
        ProductVariant v = EntityLookup.require(variants, b.getSkuId(), "Variant");
        if (!v.isActive()) throw BusinessException.conflict("SKU is inactive");
        return toVariantDtos(List.of(v)).get(0);
    }

    // ------------------------------------------------------------------ sản phẩm

    @Transactional
    public ProductDto create(ProductRequest r) {
        EntityLookup.require(categories, r.categoryId(), "Category");
        if (r.brandId() != null) EntityLookup.require(brands, r.brandId(), "Brand");
        ensureNoDuplicatesInRequest(r.variants());

        Product p = new Product();
        p.setName(r.name().trim());
        p.setDescription(blankToNull(r.description()));
        p.setCategoryId(r.categoryId());
        p.setBrandId(r.brandId());
        p.setHasVariants(r.variants().size() > 1 || r.variants().stream().anyMatch(ProductService::hasAttribute));
        p = products.save(p);

        for (VariantRequest vr : r.variants()) createVariant(p.getId(), vr);
        return get(p.getId());
    }

    @Transactional
    public ProductDto update(UUID id, ProductUpdateRequest r) {
        Product p = EntityLookup.require(products, id, "Product");
        EntityLookup.require(categories, r.categoryId(), "Category");
        if (r.brandId() != null) EntityLookup.require(brands, r.brandId(), "Brand");
        p.setName(r.name().trim());
        p.setDescription(blankToNull(r.description()));
        p.setCategoryId(r.categoryId());
        p.setBrandId(r.brandId());
        return get(id);
    }

    /** Ngừng/mở bán sản phẩm kéo theo toàn bộ SKU của nó để POS không bán nhầm. */
    @Transactional
    public ProductDto setActive(UUID id, boolean active) {
        Product p = EntityLookup.require(products, id, "Product");
        p.setActive(active);
        variants.findByProductId(id).forEach(v -> v.setActive(active));
        return get(id);
    }

    @Transactional
    public ProductDto addVariant(UUID productId, VariantRequest r) {
        Product p = EntityLookup.require(products, productId, "Product");
        createVariant(productId, r);
        if (!p.isHasVariants() && variants.findByProductId(productId).size() > 1) p.setHasVariants(true);
        return get(productId);
    }

    // ------------------------------------------------------------------ SKU: giá, ngưỡng, trạng thái

    @Transactional
    public VariantDto updatePrices(UUID variantId, PriceRequest r) {
        ProductVariant v = EntityLookup.require(variants, variantId, "Variant");
        v.setRetailPrice(r.retailPrice());
        v.setWholesalePrice(r.wholesalePrice());
        return toVariantDtos(List.of(v)).get(0);
    }

    @Transactional
    public VariantDto updateReorderThreshold(UUID variantId, BigDecimal threshold) {
        ProductVariant v = EntityLookup.require(variants, variantId, "Variant");
        v.setReorderThreshold(threshold);
        return toVariantDtos(List.of(v)).get(0);
    }

    @Transactional
    public VariantDto setVariantActive(UUID variantId, boolean active) {
        ProductVariant v = EntityLookup.require(variants, variantId, "Variant");
        v.setActive(active);
        return toVariantDtos(List.of(v)).get(0);
    }

    // ------------------------------------------------------------------ mã vạch

    @Transactional
    public VariantDto addBarcode(UUID variantId, String code) {
        ProductVariant v = EntityLookup.require(variants, variantId, "Variant");
        attachBarcode(v.getId(), code);
        return toVariantDtos(List.of(v)).get(0);
    }

    /** Sinh mã EAN-13 nội bộ (tiền tố 29) chưa ai dùng. */
    @Transactional
    public VariantDto generateBarcode(UUID variantId) {
        ProductVariant v = EntityLookup.require(variants, variantId, "Variant");
        for (int i = 0; i < 20; i++) {
            String code = Ean13.generateInternal();
            if (!barcodes.existsByCode(code)) {
                attachBarcode(v.getId(), code);
                return toVariantDtos(List.of(v)).get(0);
            }
        }
        throw BusinessException.conflict("Could not generate a unique barcode, please retry");
    }

    @Transactional
    public void deleteBarcode(UUID variantId, UUID barcodeId) {
        Barcode b = EntityLookup.require(barcodes, barcodeId, "Barcode");
        if (!b.getSkuId().equals(variantId)) throw BusinessException.notFound("Barcode not found for this variant");
        barcodes.delete(b);
    }

    // ------------------------------------------------------------------ nội bộ

    private ProductVariant createVariant(UUID productId, VariantRequest r) {
        String sku = (r.skuCode() == null || r.skuCode().isBlank()) ? generateSkuCode() : r.skuCode().trim();
        if (variants.existsBySkuCodeIgnoreCase(sku)) throw BusinessException.conflict("SKU code already exists: " + sku);

        ProductVariant v = new ProductVariant();
        v.setProductId(productId);
        v.setSkuCode(sku);
        v.setColor(blankToNull(r.color()));
        v.setSize(blankToNull(r.size()));
        v.setRetailPrice(r.retailPrice());
        v.setWholesalePrice(r.wholesalePrice());
        if (r.reorderThreshold() != null) v.setReorderThreshold(r.reorderThreshold());
        v = variants.save(v);

        String code = blankToNull(r.barcode());
        if (code != null) attachBarcode(v.getId(), code);
        return v;
    }

    /** EAN-13 (13 số) phải đúng chữ số kiểm tra; mã khác (nhà sản xuất/nội bộ) lưu dạng CODE128. */
    private void attachBarcode(UUID variantId, String raw) {
        String code = raw.trim();
        if (!code.matches("[\\x21-\\x7E]{1,50}"))
            throw BusinessException.badRequest("Barcode chỉ gồm ký tự in được, không có khoảng trắng, tối đa 50 ký tự");
        BarcodeType type;
        if (code.matches("\\d{13}")) {
            if (!Ean13.isValid(code)) throw BusinessException.badRequest("EAN-13 sai chữ số kiểm tra");
            type = BarcodeType.EAN13;
        } else {
            type = BarcodeType.CODE128;
        }
        if (barcodes.existsByCode(code)) throw BusinessException.conflict("Barcode already assigned: " + code);
        Barcode b = new Barcode();
        b.setSkuId(variantId);
        b.setCode(code);
        b.setType(type);
        barcodes.save(b);
    }

    private String generateSkuCode() {
        for (int i = 0; i < 20; i++) {
            String sku = "SKU-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
            if (!variants.existsBySkuCodeIgnoreCase(sku)) return sku;
        }
        throw BusinessException.conflict("Could not generate a unique SKU code, please retry");
    }

    private static void ensureNoDuplicatesInRequest(List<VariantRequest> list) {
        Set<String> skus = new HashSet<>();
        Set<String> codes = new HashSet<>();
        for (VariantRequest v : list) {
            String sku = blankToNull(v.skuCode());
            if (sku != null && !skus.add(sku.toLowerCase(Locale.ROOT)))
                throw BusinessException.badRequest("Duplicate SKU code in request: " + sku);
            String bc = blankToNull(v.barcode());
            if (bc != null && !codes.add(bc))
                throw BusinessException.badRequest("Duplicate barcode in request: " + bc);
        }
    }

    private static boolean hasAttribute(VariantRequest v) {
        return blankToNull(v.color()) != null || blankToNull(v.size()) != null;
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    // ------------------------------------------------------------------ map sang DTO (gom truy vấn, tránh N+1)

    private List<ProductDto> toProductDtos(List<Product> ps) {
        if (ps.isEmpty()) return List.of();
        List<UUID> ids = ps.stream().map(Product::getId).toList();
        List<ProductVariant> vs = variants.findByProductIdIn(ids);
        Map<UUID, String> names = ps.stream().collect(Collectors.toMap(Product::getId, Product::getName));
        Map<UUID, List<VariantDto>> byProduct = toVariantDtos(vs, names).stream()
                .collect(Collectors.groupingBy(VariantDto::productId));
        return ps.stream().map(p -> new ProductDto(p.getId(), p.getCategoryId(), p.getBrandId(), p.getName(),
                p.getDescription(), p.isHasVariants(), p.isActive(),
                byProduct.getOrDefault(p.getId(), List.of()))).toList();
    }

    private List<VariantDto> toVariantDtos(List<ProductVariant> vs) {
        if (vs.isEmpty()) return List.of();
        Set<UUID> productIds = vs.stream().map(ProductVariant::getProductId).collect(Collectors.toSet());
        Map<UUID, String> names = products.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName));
        return toVariantDtos(vs, names);
    }

    private List<VariantDto> toVariantDtos(List<ProductVariant> vs, Map<UUID, String> productNames) {
        if (vs.isEmpty()) return List.of();
        Map<UUID, List<BarcodeDto>> bcs = barcodes.findBySkuIdIn(vs.stream().map(ProductVariant::getId).toList()).stream()
                .collect(Collectors.groupingBy(Barcode::getSkuId,
                        Collectors.mapping(b -> new BarcodeDto(b.getId(), b.getCode(), b.getType()), Collectors.toList())));
        return vs.stream()
                .sorted(Comparator.comparing(ProductVariant::getSkuCode))
                .map(v -> new VariantDto(v.getId(), v.getProductId(), productNames.get(v.getProductId()), v.getSkuCode(),
                        v.getColor(), v.getSize(), v.getRetailPrice(), v.getWholesalePrice(), v.getCurrentAverageCost(),
                        v.getReorderThreshold(), v.isActive(), bcs.getOrDefault(v.getId(), List.of())))
                .toList();
    }
}
