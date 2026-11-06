package com.oism.catalog;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    boolean existsBySkuCodeIgnoreCase(String skuCode);
    List<ProductVariant> findByProductId(UUID productId);
    List<ProductVariant> findByProductIdIn(Collection<UUID> productIds);

    /** Khoá dòng SKU khi cập nhật giá vốn để 2 phiếu nhập đồng thời không ghi đè nhau. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from ProductVariant v where v.id = :id")
    Optional<ProductVariant> findForUpdate(@Param("id") UUID id);

    /** FR-POS-01: tìm nhanh theo tên / SKU (chứa) / barcode (khớp chính xác). */
    @Query("""
           select v from ProductVariant v
           where v.active = true
             and (lower(v.skuCode) like :pattern
                  or v.id in (select b.skuId from Barcode b where b.code = :exact)
                  or v.productId in (select p.id from Product p where lower(p.name) like :pattern))
           order by v.skuCode
           """)
    Page<ProductVariant> search(@Param("pattern") String pattern, @Param("exact") String exact, Pageable pageable);
}
