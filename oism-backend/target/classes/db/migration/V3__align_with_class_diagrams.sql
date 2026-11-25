-- V3: đồng bộ database với 4 sơ đồ lớp (Auth, Catalog, Inventory & Costing, Order).
-- Giữ dữ liệu đã có. Không sửa V1/V2 (Flyway kiểm tra checksum).

-- ======================= 1. AUTH & MULTI-TENANT =======================
-- Tenant: code -> domain, active -> status (Active/Suspended)
ALTER TABLE tenants RENAME COLUMN code TO domain;
ALTER TABLE tenants ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE';
UPDATE tenants SET status = CASE WHEN active THEN 'ACTIVE' ELSE 'SUSPENDED' END;
ALTER TABLE tenants DROP COLUMN active;
ALTER TABLE tenants ADD CONSTRAINT ck_tenants_status CHECK (status IN ('ACTIVE','SUSPENDED'));

-- Role là bảng riêng (Owner/Staff/Cashier), User.roleId trỏ tới đây
CREATE TABLE roles (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL UNIQUE CHECK (name IN ('OWNER','STAFF','CASHIER'))
);
INSERT INTO roles (name) VALUES ('OWNER'), ('STAFF'), ('CASHIER');
ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
UPDATE users u SET role_id = r.id FROM roles r WHERE r.name = u.role;
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE users DROP COLUMN role;

-- User: status (Active/Locked/Inactive)
ALTER TABLE users ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE';
UPDATE users SET status = CASE WHEN active THEN 'ACTIVE' ELSE 'INACTIVE' END;
ALTER TABLE users DROP COLUMN active;
ALTER TABLE users ADD CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE','LOCKED','INACTIVE'));

-- User <-> Branch nhiều-nhiều ("works at")
CREATE TABLE user_branches (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    UNIQUE (user_id, branch_id)
);
INSERT INTO user_branches (user_id, branch_id) SELECT id, branch_id FROM users WHERE branch_id IS NOT NULL;
ALTER TABLE users DROP COLUMN branch_id;

-- Branch: type (Store/Warehouse), isActive
ALTER TABLE branches ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'STORE';
UPDATE branches SET type = CASE WHEN is_warehouse THEN 'WAREHOUSE' ELSE 'STORE' END;
ALTER TABLE branches DROP COLUMN is_warehouse;
ALTER TABLE branches ADD CONSTRAINT ck_branches_type CHECK (type IN ('STORE','WAREHOUSE'));
ALTER TABLE branches RENAME COLUMN active TO is_active;

-- RefreshToken: có tenantId, isRevoked
ALTER TABLE refresh_tokens ADD COLUMN tenant_id UUID REFERENCES tenants(id);
UPDATE refresh_tokens rt SET tenant_id = u.tenant_id FROM users u WHERE u.id = rt.user_id;
ALTER TABLE refresh_tokens ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE refresh_tokens ADD COLUMN is_revoked BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE refresh_tokens SET is_revoked = (revoked_at IS NOT NULL);
ALTER TABLE refresh_tokens DROP COLUMN revoked_at;

-- ======================= 2. PRODUCT CATALOG =======================
-- Product.categoryId bắt buộc: sản phẩm chưa có danh mục được gom vào "Chưa phân loại"
INSERT INTO categories (tenant_id, name)
SELECT DISTINCT tenant_id, 'Chưa phân loại' FROM products WHERE category_id IS NULL
ON CONFLICT DO NOTHING;
UPDATE products p SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL AND c.tenant_id = p.tenant_id AND c.parent_id IS NULL
  AND lower(c.name) = lower('Chưa phân loại');
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE products RENAME COLUMN active TO is_active;

-- ProductVariant: skuCode, color, size, currentAverageCost, reorderThreshold, isActive
ALTER TABLE product_variants RENAME COLUMN sku TO sku_code;
ALTER TABLE product_variants RENAME COLUMN avg_cost TO current_average_cost;
ALTER TABLE product_variants RENAME COLUMN active TO is_active;
ALTER TABLE product_variants ADD COLUMN color VARCHAR(50);
ALTER TABLE product_variants ADD COLUMN size  VARCHAR(50);
ALTER TABLE product_variants ADD COLUMN reorder_threshold NUMERIC(18,3) NOT NULL DEFAULT 0
    CONSTRAINT ck_variant_reorder_nonneg CHECK (reorder_threshold >= 0);
UPDATE product_variants SET color = attributes->>'color', size = attributes->>'size';
ALTER TABLE product_variants DROP COLUMN attributes;

-- Barcode là bảng riêng: 1 SKU có nhiều barcode (EAN13 / Code128)
CREATE TABLE barcodes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id),
    sku_id     UUID NOT NULL REFERENCES product_variants(id),
    code       VARCHAR(50) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('EAN13','CODE128')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);
CREATE INDEX ix_barcodes_sku ON barcodes (tenant_id, sku_id);
INSERT INTO barcodes (tenant_id, sku_id, code, type)
SELECT tenant_id, id, barcode, CASE WHEN barcode ~ '^[0-9]{13}$' THEN 'EAN13' ELSE 'CODE128' END
FROM product_variants WHERE barcode IS NOT NULL;
DROP INDEX IF EXISTS ux_variants_barcode;
ALTER TABLE product_variants DROP COLUMN barcode;

-- ======================= 3. INVENTORY & COSTING =======================
-- StockLevel -> StockBalance; số lượng kiểu decimal; version int (khoá lạc quan)
ALTER TABLE stock_levels RENAME TO stock_balances;
ALTER TABLE stock_balances ALTER COLUMN on_hand  TYPE NUMERIC(18,3);
ALTER TABLE stock_balances ALTER COLUMN reserved TYPE NUMERIC(18,3);
ALTER TABLE stock_balances ALTER COLUMN version  TYPE INTEGER;
-- ngưỡng cảnh báo chuyển lên SKU (ProductVariant.reorderThreshold)
UPDATE product_variants v SET reorder_threshold = m.mx
FROM (SELECT sku_id, max(reorder_point) AS mx FROM stock_balances GROUP BY sku_id) m
WHERE m.sku_id = v.id;
ALTER TABLE stock_balances DROP COLUMN reorder_point;

-- InventoryTransaction: referenceType thay cho reason; quantity decimal.
-- Dùng ALTER ... USING (không UPDATE) nên không đụng trigger append-only.
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_reason_check;
ALTER TABLE inventory_transactions DROP COLUMN reference_type;
ALTER TABLE inventory_transactions DROP COLUMN note;
ALTER TABLE inventory_transactions RENAME COLUMN reason TO reference_type;
ALTER TABLE inventory_transactions ALTER COLUMN reference_type TYPE VARCHAR(20) USING (
    CASE reference_type
        WHEN 'IMPORT'     THEN 'PURCHASE_RECEIPT'
        WHEN 'ADJUSTMENT' THEN 'STOCKTAKE_ADJUST'
        WHEN 'STOCKTAKE'  THEN 'STOCKTAKE_ADJUST'
        WHEN 'EXPORT'     THEN 'SALE'
        ELSE reference_type
    END);
ALTER TABLE inventory_transactions ADD CONSTRAINT ck_ledger_reference_type CHECK (reference_type IN
    ('PURCHASE_RECEIPT','TRANSFER_OUT','TRANSFER_IN','SALE','RETURN','STOCKTAKE_ADJUST'));
ALTER TABLE inventory_transactions ALTER COLUMN quantity      TYPE NUMERIC(18,3);
ALTER TABLE inventory_transactions ALTER COLUMN balance_after TYPE NUMERIC(18,3);

ALTER TABLE cost_history ALTER COLUMN old_stock  TYPE NUMERIC(18,3);
ALTER TABLE cost_history ALTER COLUMN import_qty TYPE NUMERIC(18,3);

-- PurchaseReceipt: receiptDate, supplier bắt buộc; item: unitPrice, quantity decimal
ALTER TABLE purchase_receipts ADD COLUMN receipt_date TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE purchase_receipts SET receipt_date = created_at;
INSERT INTO suppliers (tenant_id, name)
SELECT DISTINCT tenant_id, 'Không xác định' FROM purchase_receipts WHERE supplier_id IS NULL;
UPDATE purchase_receipts r SET supplier_id = s.id
FROM suppliers s
WHERE r.supplier_id IS NULL AND s.tenant_id = r.tenant_id AND s.name = 'Không xác định';
ALTER TABLE purchase_receipts ALTER COLUMN supplier_id SET NOT NULL;
ALTER TABLE purchase_receipt_items ALTER COLUMN quantity TYPE NUMERIC(18,3);
ALTER TABLE purchase_receipt_items RENAME COLUMN import_price TO unit_price;

ALTER TABLE stock_transfer_items ALTER COLUMN quantity TYPE NUMERIC(18,3);

-- Stocktake: chỉ InProgress/Completed; item: actualQty, differenceQty
DELETE FROM stocktake_items WHERE stocktake_id IN (SELECT id FROM stocktakes WHERE status = 'CANCELLED');
DELETE FROM stocktakes WHERE status = 'CANCELLED';
ALTER TABLE stocktakes DROP CONSTRAINT IF EXISTS stocktakes_status_check;
ALTER TABLE stocktakes ADD CONSTRAINT ck_stocktakes_status CHECK (status IN ('IN_PROGRESS','COMPLETED'));
ALTER TABLE stocktake_items ALTER COLUMN system_qty  TYPE NUMERIC(18,3);
ALTER TABLE stocktake_items ALTER COLUMN counted_qty TYPE NUMERIC(18,3);
ALTER TABLE stocktake_items RENAME COLUMN counted_qty TO actual_qty;
ALTER TABLE stocktake_items ADD COLUMN difference_qty NUMERIC(18,3) NOT NULL DEFAULT 0;
UPDATE stocktake_items SET difference_qty = actual_qty - system_qty;

-- ======================= 4. ORDER MANAGEMENT =======================
ALTER TABLE orders RENAME COLUMN code  TO order_code;
ALTER TABLE orders RENAME COLUMN total TO total_amount;
ALTER TABLE orders DROP COLUMN subtotal;
ALTER TABLE orders DROP COLUMN discount;
ALTER TABLE orders DROP COLUMN payment_method;       -- chuyển sang bảng payments
ALTER TABLE orders ADD COLUMN confirmed_at TIMESTAMPTZ;

ALTER TABLE order_items ALTER COLUMN quantity TYPE NUMERIC(18,3);
ALTER TABLE order_items ADD COLUMN subtotal NUMERIC(18,2)
    GENERATED ALWAYS AS (round(quantity * unit_price, 2)) STORED;

CREATE TABLE payments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id),
    order_id   UUID NOT NULL REFERENCES orders(id),
    method     VARCHAR(12) NOT NULL CHECK (method IN ('CASH','QR_TRANSFER')),
    amount     NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    status     VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED')),
    paid_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_payments_order ON payments (tenant_id, order_id);

ALTER TABLE webhook_events RENAME COLUMN external_event_id TO external_order_id;
ALTER TABLE webhook_events RENAME COLUMN error TO error_message;
ALTER TABLE webhook_events ADD COLUMN processed_at TIMESTAMPTZ;

ALTER TABLE notifications RENAME COLUMN read TO is_read;
ALTER TABLE notifications ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE notifications ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE notifications ADD COLUMN reference_id UUID;
ALTER TABLE notifications DROP COLUMN branch_id;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN ('NEW_ORDER','LOW_STOCK'));
