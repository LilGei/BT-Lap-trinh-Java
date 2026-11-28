# BE1 – Core, Auth & Sản phẩm (Spring Boot)

Gói này đã **khớp với code mới nhất của BE3** (pom/security/common) và dùng đúng entity UUID + `@TenantId` trong `oism-database`.

## 1. Đã làm gì

| Yêu cầu | Việc đã làm |
|---|---|
| Khung Spring Boot, entity có tenantId | Đã đối chiếu entity ↔ migration V1–V3: **khớp** cho mọi bảng BE1. Thêm `TenantContextFilter` để `@TenantId` hoạt động thật |
| FR-AUTH-01 Đăng ký Tenant | `POST /api/auth/register-tenant` → tạo tenant + Owner, trả JWT |
| FR-AUTH-02 Đăng nhập/Đăng xuất | `POST /api/auth/login`, `/refresh` (xoay vòng + phát hiện dùng lại token), `/logout`, `GET /api/auth/me` |
| FR-AUTH-03 Phân quyền | JWT chứa `tenantId, userId, role` (OWNER/STAFF/CASHIER); `@PreAuthorize` trên controller |
| FR-PROD Chi nhánh | `GET/POST/PUT /api/branches`, `PATCH /api/branches/{id}/active` |
| FR-PROD Danh mục, Thương hiệu | `/api/categories`, `/api/brands` (CRUD) |
| FR-PROD Sản phẩm, SKU, mã vạch, giá | `/api/products`, `/api/variants/...` (xem bảng dưới) |
| docker-compose | `docker-compose.yml` ở gốc repo: PostgreSQL + Backend + Frontend |

### API sản phẩm
| Method | URL | Quyền |
|---|---|---|
| GET | `/api/products?q=&page=&size=` | mọi vai trò |
| POST | `/api/products` (kèm danh sách `variants`) | Owner, Staff |
| PUT | `/api/products/{id}` | Owner, Staff |
| PATCH | `/api/products/{id}/active?value=` (kéo theo mọi SKU) | Owner, Staff |
| POST | `/api/products/{id}/variants` | Owner, Staff |
| GET | `/api/variants/search?q=` (tên/SKU/barcode) | mọi vai trò |
| GET | `/api/variants/by-barcode/{code}` | mọi vai trò |
| PUT | `/api/variants/{id}/prices` (giá lẻ/buôn) | **Owner** |
| PUT | `/api/variants/{id}/reorder-threshold` | Owner, Staff |
| PATCH | `/api/variants/{id}/active?value=` | Owner, Staff |
| POST | `/api/variants/{id}/barcodes` · `/barcodes/generate` | Owner, Staff |
| DELETE | `/api/variants/{id}/barcodes/{barcodeId}` | Owner, Staff |

Quy tắc: SKU code để trống thì tự sinh (`SKU-XXXXXXXX`); mã 13 số phải đúng chữ số kiểm tra EAN-13; barcode và SKU code không được trùng trong cùng tenant; giá vốn **không** sửa ở đây (chỉ phiếu nhập của BE2).

## 2. File của BE3/chung mà mình PHẢI sửa (đều nhỏ)

1. `OismApplication.java` – **bỏ `exclude` của Hibernate/JPA**. Toàn bộ entity và repository của nhóm là JPA, để exclude thì cả app BE1/BE2 không chạy.
2. `security/SecurityConfig.java` – cho phép 4 POST `/api/auth/*` không cần token (trước đó `anyRequest().authenticated()` chặn luôn cả login), trả **401** (không phải 403) khi thiếu token, gắn `TenantContextFilter`.
3. `security/JwtAuthenticationFilter.java` – bỏ qua 4 endpoint public. Nếu không, FE gửi access token hết hạn kèm lúc gọi `/refresh` sẽ bị 401 và không bao giờ refresh được.
4. `security/CurrentUser.java` – `implements AuthUser` để controller BE1/BE2 dùng `@AuthenticationPrincipal AuthUser`, BE3 vẫn dùng `CurrentUser`, **không đổi constructor**.
5. `pom.xml` – thêm profile `be1-only` (xem mục 5), `Dockerfile` – thêm `ARG MVN_ARGS`.

File mới dùng chung: `common/PageDto.java` (`items, page, size, totalElements, totalPages`; có `PageDto.of(Page)` và `PageDto.of(Page, mapper)`), `auth/AuthUser.java`.

## 3. Cách ghép vào repo

```bash
# 1. giải nén gói này đè lên thư mục gốc repo
# 2. xoá 5 file cũ đã được chuyển sang đúng package:
git rm oism-backend/src/main/java/com/oism/auth/BranchController.java \
       oism-backend/src/main/java/com/oism/auth/BrandController.java \
       oism-backend/src/main/java/com/oism/auth/CategoryController.java \
       oism-backend/src/main/java/com/oism/auth/ProductController.java \
       oism-backend/src/main/java/com/oism/auth/UserController.java
# 3. dọn file thừa bị commit nhầm (pom.xml, docker-compose.yml, schema.sql... nằm trong src/main/java)
```

## 4. Chạy thử

```bash
cp .env.example .env
docker compose up --build        # web: http://localhost:3000 · api: http://localhost:8080
```
```bash
# đăng ký cửa hàng
curl -s -X POST localhost:8080/api/auth/register-tenant -H 'Content-Type: application/json' \
  -d '{"tenantCode":"shop-a","storeName":"Shop A","ownerName":"An","email":"an@a.vn","password":"Passw0rd!"}'
# dùng accessToken vừa nhận
curl -s localhost:8080/api/branches -H "Authorization: Bearer <accessToken>"
```
Chạy test: `cd oism-backend && mvn -Pbe1-only test` (test BE1: `Ean13Test`, `JwtIssuerCompatibilityTest`).

## 5. Cần chốt với team (đã đọc code BE2 + BE3)

**Code BE2 (`BT-Lap-trinh-Java-be2`) hiện chưa ghép được với repo**, nên mình thêm profile `be1-only` (loại 4 controller kho/nhập hàng) để build được ngay:
- BE2 dùng `Long`/`BIGSERIAL`, trong khi toàn dự án dùng **UUID**.
- BE2 import `com.oism.config.TenantContext` (kiểu `Long`), `ProductSku`, `OutOfStockException` – **các class này không tồn tại**. Thực tế: `com.oism.tenant.TenantContext` (UUID), `ProductVariant`, `BusinessException`.
- Entity BE2 `com.oism.entity.{PurchaseReceipt, StockTransfer, Stocktake, …Item}` **trùng tên** với entity trong `oism-database` (`purchasing/`, `inventory/`) → Hibernate lỗi `DuplicateMappingException` lúc khởi động.
- Hai `InventoryController` cùng map `/api/inventory` → trùng bean và trùng route.
- `be2_tables.sql` tạo `branch_inventory`, `inventory_ledger` trong khi migration đã có `StockBalance`, `InventoryTransaction`.
→ Đề nghị BE2 viết lại trên entity chung; `CogsCalculator`, `LedgerService` và test của BE2 tái dùng được. `ProductVariantRepository.findForUpdate` đã có sẵn để khoá dòng SKU khi tính giá vốn.

**FE**: `axiosClient.js` đang trỏ `localhost:5000/api`. Đổi `baseURL` thành `"/api"` (nginx trong compose và Vite proxy đều chuyển sang backend). Các trang hiện vẫn dùng dữ liệu mẫu, chưa gọi API. Mình thêm `index.html`, `vite.config.js`, `SRC/main.jsx` tối thiểu để Docker build được – FE owner có thể thay.

**Lưu ý khác**: access token sống 30 phút (`oism.jwt.access-minutes`), refresh 7 ngày (`oism.jwt.refresh-days`); `JWT_SECRET` phải là Base64 của ≥ 32 byte.

## 6. Mức độ đã kiểm chứng
Môi trường soạn thảo không tải được thư viện Maven nên **chưa chạy `mvn` thật**. Đã kiểm tra: toàn bộ file Java mới/sửa qua parser của `javac` (0 lỗi cú pháp), đối chiếu entity ↔ migration, đối chiếu mọi chữ ký service mà controller gọi. Bạn chạy `mvn -Pbe1-only test` và `docker compose up --build` để xác nhận lần cuối; nếu có lỗi biên dịch, gửi log mình sửa ngay.
