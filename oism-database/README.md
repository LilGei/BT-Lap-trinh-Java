# OISM – BỘ DATABASE

Bộ này chứa **mọi thứ thuộc về database**: file SQL tạo/đổi bảng, các entity (ánh xạ bảng sang Java),
các repository (đọc/ghi bảng) và cơ chế cách ly dữ liệu theo cửa hàng (tenant).
Bộ này **không có API** (controller, service, DTO, bảo mật nằm ở bộ `oism-api`).

## Cách dùng
1. Giải nén **vào đúng thư mục project** (thư mục có `pom.xml`), giữ nguyên cấu trúc thư mục. Hai bộ `oism-database` và `oism-api` không trùng file nào.
2. Nếu Windows hỏi trùng file, chọn **Replace**.
3. Nếu trước đó đã có file `StockLevel.java` và `StockLevelRepository.java` trong `inventory/` thì **xoá hai file đó** (đã đổi tên thành `StockBalance`).
4. Chạy app: Flyway tự áp V1 → V2 → V3 theo thứ tự, giữ nguyên dữ liệu cũ.

## Các file SQL (thứ tự Flyway áp dụng)
| File | Nội dung | Trạng thái |
|---|---|---|
| `V1__init_schema.sql` | 26 bảng gốc (gói 1) | giữ nguyên |
| `V2__catalog_purchasing_support.sql` | `doc_counters`, `cost_history`, index bổ sung (gói 2) | giữ nguyên |
| `V3__align_with_class_diagrams.sql` | Đồng bộ với 4 sơ đồ lớp: 4 bảng mới (`roles`, `user_branches`, `barcodes`, `payments`), đổi tên `stock_levels` → `stock_balances`, đổi/thêm/bỏ cột, số lượng sang `NUMERIC(18,3)`, chuyển dữ liệu cũ sang cấu trúc mới | **MỚI** |

Không sửa V1/V2 (Flyway kiểm tra checksum). Mọi thay đổi mới chỉ thêm vào V3.

## Danh sách file
| File | Vai trò | Trạng thái |
|---|---|---|
| `schema.sql` | Bản gộp V1+V2+V3 để đọc / vẽ ERD (app không dùng) | MỚI |
| `…/oism/tenant/TenantAwareEntity.java` | Cách ly dữ liệu theo tenant | giữ nguyên |
| `…/oism/tenant/TenantContext.java` | Cách ly dữ liệu theo tenant | giữ nguyên |
| `…/oism/tenant/TenantIdentifierResolver.java` | Cách ly dữ liệu theo tenant | giữ nguyên |
| `…/oism/tenant/TenantStatus.java` | Cách ly dữ liệu theo tenant | MỚI |
| `…/oism/tenant/Tenant.java` | Entity (bảng) | SỬA |
| `…/oism/auth/RefreshToken.java` | Entity (ánh xạ bảng) | MỚI |
| `…/oism/auth/Role.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/auth/User.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/auth/UserBranch.java` | Entity (ánh xạ bảng) | MỚI |
| `…/oism/branch/Branch.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/catalog/Barcode.java` | Entity (ánh xạ bảng) | MỚI |
| `…/oism/catalog/Brand.java` | Entity (ánh xạ bảng) | giữ nguyên |
| `…/oism/catalog/Category.java` | Entity (ánh xạ bảng) | giữ nguyên |
| `…/oism/catalog/Product.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/catalog/ProductVariant.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/cost/CostHistory.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/inventory/InventoryTransaction.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/inventory/StockBalance.java` | Entity (ánh xạ bảng) | MỚI |
| `…/oism/inventory/StockTransfer.java` | Entity (ánh xạ bảng) | giữ nguyên |
| `…/oism/inventory/StockTransferItem.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/inventory/Stocktake.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/inventory/StocktakeItem.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/purchasing/PurchaseReceipt.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/purchasing/PurchaseReceiptItem.java` | Entity (ánh xạ bảng) | SỬA |
| `…/oism/purchasing/Supplier.java` | Entity (ánh xạ bảng) | giữ nguyên |
| `…/oism/auth/RoleName.java` | Enum của entity | MỚI |
| `…/oism/auth/UserStatus.java` | Enum của entity | MỚI |
| `…/oism/branch/BranchType.java` | Enum của entity | MỚI |
| `…/oism/catalog/BarcodeType.java` | Enum của entity | MỚI |
| `…/oism/auth/RefreshTokenRepository.java` | Repository (đọc/ghi DB) | MỚI |
| `…/oism/auth/RoleRepository.java` | Repository (đọc/ghi DB) | MỚI |
| `…/oism/auth/UserBranchRepository.java` | Repository (đọc/ghi DB) | MỚI |
| `…/oism/auth/UserRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/branch/BranchRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/catalog/BarcodeRepository.java` | Repository (đọc/ghi DB) | MỚI |
| `…/oism/catalog/BrandRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/catalog/CategoryRepository.java` | Repository (đọc/ghi DB) | SỬA |
| `…/oism/catalog/ProductRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/catalog/ProductVariantRepository.java` | Repository (đọc/ghi DB) | SỬA |
| `…/oism/cost/CostHistoryRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/inventory/InventoryTransactionRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/inventory/StockBalanceRepository.java` | Repository (đọc/ghi DB) | MỚI |
| `…/oism/inventory/StockTransferRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/inventory/StocktakeItemRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/inventory/StocktakeRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/purchasing/PurchaseReceiptRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/purchasing/SupplierRepository.java` | Repository (đọc/ghi DB) | giữ nguyên |
| `…/oism/tenant/TenantRepository.java` | Repository (đọc/ghi DB) | SỬA |
| `src/main/resources/db/migration/V1__init_schema.sql` | SQL tạo/đổi bảng | giữ nguyên |
| `src/main/resources/db/migration/V2__catalog_purchasing_support.sql` | SQL tạo/đổi bảng | giữ nguyên |
| `src/main/resources/db/migration/V3__align_with_class_diagrams.sql` | SQL tạo/đổi bảng | MỚI |

Ghi chú trạng thái: **MỚI** = file mới; **SỬA** = đã đổi nội dung so với bản trước; giữ nguyên = không đổi.
Đã **XOÁ**: `inventory/StockLevel.java`, `inventory/StockLevelRepository.java` (thay bằng `StockBalance`).
