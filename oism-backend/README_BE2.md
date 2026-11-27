# BE2 – Sổ cái kho & Giá vốn (copy vào oism-backend/, giữ nguyên cấu trúc package)

## BE2 cần từ BE1 / BE3 (giả định – sửa nếu tên khác)
- `com.oism.config.TenantContext`: `static Long getTenantId()`, `static Long getUserId()` (set bởi MultiTenantFilter/JwtFilter)
- `com.oism.entity.ProductSku`: `getTenantId()`, `getCostPrice()` (BigDecimal), `setCostPrice(BigDecimal)`
- `com.oism.exception.OutOfStockException(String message)`
- SecurityConfig bật `@EnableMethodSecurity`, role dạng `ROLE_OWNER / ROLE_STAFF`
- BE3 trừ kho khi Confirmed bằng `LedgerService.record(..., OUT, SALE, ...)` (đừng tự update on_hand)

## Điểm cần chốt với team
- `branch_inventory` do BE2 định nghĩa entity; BE3 dùng thêm `reserved` + lock. Nếu schema.sql đã có, xoá khối tương ứng trong be2_tables.sql và chỉnh tên cột cho khớp.
- Cần UNIQUE (tenant_id, branch_id, sku_id) trên branch_inventory (dùng cho `INSERT ... ON CONFLICT`).
- Giá vốn tính trên tổng on_hand mọi chi nhánh của SKU (giá vốn là theo SKU/tenant).
