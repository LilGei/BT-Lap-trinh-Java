-- OISM - Omnichannel Inventory & Sales Management | PostgreSQL 14+
-- Mô hình: Shared Database + cột tenant_id trên MỌI bảng nghiệp vụ.

-- ============ 1. TENANT / AUTH ============
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE branches (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id),
    code         VARCHAR(50)  NOT NULL,
    name         VARCHAR(200) NOT NULL,
    address      VARCHAR(500),
    is_warehouse BOOLEAN NOT NULL DEFAULT FALSE,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id),
    branch_id     UUID REFERENCES branches(id),
    email         VARCHAR(255),
    phone         VARCHAR(30),
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(200) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('OWNER','STAFF','CASHIER')),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE UNIQUE INDEX ux_users_email ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX ux_users_phone ON users (phone) WHERE phone IS NOT NULL;
CREATE INDEX ix_users_tenant ON users (tenant_id);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 2. PRODUCT CATALOG ============
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_categories_tenant ON categories (tenant_id, parent_id);

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(200) NOT NULL,
    UNIQUE (tenant_id, name)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    has_variants BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_products_tenant ON products (tenant_id, name);

-- SKU = product_variants. avg_cost = giá vốn bình quân gia quyền (COGS), tách biệt với giá bán.
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    sku VARCHAR(80) NOT NULL,
    barcode VARCHAR(50),
    attributes JSONB NOT NULL DEFAULT '{}',          -- {"color":"Red","size":"M"}
    retail_price    NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (retail_price >= 0),
    wholesale_price NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (wholesale_price >= 0),
    avg_cost        NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (avg_cost >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, sku)
);
CREATE UNIQUE INDEX ux_variants_barcode ON product_variants (tenant_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX ix_variants_product ON product_variants (tenant_id, product_id);

-- ============ 3. INVENTORY ============
-- Số dư tồn kho theo (branch, sku). Chỉ được thay đổi cùng giao dịch ghi ledger (InventoryService).
-- CHECK constraints = lưới an toàn cuối cùng chống tồn kho âm / oversell.
CREATE TABLE stock_levels (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     UUID NOT NULL REFERENCES tenants(id),
    branch_id     UUID NOT NULL REFERENCES branches(id),
    sku_id        UUID NOT NULL REFERENCES product_variants(id),
    on_hand       INT NOT NULL DEFAULT 0,
    reserved      INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    version       BIGINT NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_on_hand_nonneg  CHECK (on_hand  >= 0),
    CONSTRAINT ck_reserved_nonneg CHECK (reserved >= 0),
    CONSTRAINT ck_available_nonneg CHECK (reserved <= on_hand),   -- available = on_hand - reserved >= 0
    UNIQUE (tenant_id, branch_id, sku_id)
);
CREATE INDEX ix_stock_tenant_sku ON stock_levels (tenant_id, sku_id);

-- Inventory Ledger: APPEND-ONLY
CREATE TABLE inventory_transactions (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      UUID NOT NULL REFERENCES tenants(id),
    branch_id      UUID NOT NULL REFERENCES branches(id),
    sku_id         UUID NOT NULL REFERENCES product_variants(id),
    type           VARCHAR(3)  NOT NULL CHECK (type IN ('IN','OUT')),
    reason         VARCHAR(20) NOT NULL CHECK (reason IN
                   ('IMPORT','EXPORT','SALE','RETURN','STOCKTAKE','TRANSFER_OUT','TRANSFER_IN','ADJUSTMENT')),
    quantity       INT NOT NULL CHECK (quantity > 0),
    balance_after  INT NOT NULL,
    unit_cost      NUMERIC(18,4),
    reference_type VARCHAR(30),
    reference_id   UUID,
    note           VARCHAR(500),
    created_by     UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ledger_tenant_created ON inventory_transactions (tenant_id, created_at);
CREATE INDEX ix_ledger_tenant_sku     ON inventory_transactions (tenant_id, sku_id);
CREATE INDEX ix_ledger_reference      ON inventory_transactions (tenant_id, reference_id);

CREATE OR REPLACE FUNCTION fn_ledger_append_only() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'inventory_transactions is append-only (% not allowed)', TG_OP;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_no_update_delete
    BEFORE UPDATE OR DELETE ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION fn_ledger_append_only();
CREATE TRIGGER trg_ledger_no_truncate
    BEFORE TRUNCATE ON inventory_transactions
    FOR EACH STATEMENT EXECUTE FUNCTION fn_ledger_append_only();

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(30), address VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    supplier_id UUID REFERENCES suppliers(id),
    code VARCHAR(50) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','CONFIRMED','CANCELLED')),
    note VARCHAR(500),
    created_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);
CREATE TABLE purchase_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    receipt_id UUID NOT NULL REFERENCES purchase_receipts(id),
    sku_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    import_price NUMERIC(18,4) NOT NULL CHECK (import_price >= 0)
);

CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    from_branch_id UUID NOT NULL REFERENCES branches(id),
    to_branch_id   UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(15) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_TRANSIT','RECEIVED','CANCELLED')),
    created_by UUID REFERENCES users(id),
    shipped_at TIMESTAMPTZ, received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code),
    CHECK (from_branch_id <> to_branch_id)
);
CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id),
    sku_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE stocktakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    code VARCHAR(50) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','COMPLETED','CANCELLED')),
    created_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);
CREATE TABLE stocktake_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    stocktake_id UUID NOT NULL REFERENCES stocktakes(id),
    sku_id UUID NOT NULL REFERENCES product_variants(id),
    system_qty INT NOT NULL,
    counted_qty INT NOT NULL CHECK (counted_qty >= 0),
    UNIQUE (stocktake_id, sku_id)
);

-- ============ 4. ORDER HUB ============
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    code VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('POS','ADMIN','SHOPEE','TIKTOK','LAZADA')),
    external_order_id VARCHAR(100),
    status VARCHAR(12) NOT NULL DEFAULT 'DRAFT'
           CHECK (status IN ('DRAFT','RESERVED','CONFIRMED','COMPLETED','CANCELLED')),
    customer_name VARCHAR(200), customer_phone VARCHAR(30), shipping_address VARCHAR(500),
    payment_method VARCHAR(10) CHECK (payment_method IN ('CASH','QR','COD','ONLINE')),
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total    NUMERIC(18,2) NOT NULL DEFAULT 0,
    reserved_expires_at TIMESTAMPTZ,            -- Hangfire-equivalent job tự huỷ đơn hết hạn giữ hàng
    created_by UUID REFERENCES users(id),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);
-- idempotency cho webhook: cùng kênh + mã đơn sàn chỉ được nhập 1 lần
CREATE UNIQUE INDEX ux_orders_external ON orders (tenant_id, channel, external_order_id)
    WHERE external_order_id IS NOT NULL;
CREATE INDEX ix_orders_tenant_created ON orders (tenant_id, created_at);
CREATE INDEX ix_orders_status ON orders (tenant_id, status, reserved_expires_at);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    sku_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(18,2) NOT NULL,
    cost_price NUMERIC(18,4)                     -- snapshot COGS khi Confirmed (FR-COST-02)
);
CREATE INDEX ix_order_items_order ON order_items (tenant_id, order_id);
CREATE INDEX ix_order_items_sku   ON order_items (tenant_id, sku_id);

CREATE TABLE order_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    from_status VARCHAR(12), to_status VARCHAR(12) NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 5. SIMULATOR / NOTIFICATION ============
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel VARCHAR(10) NOT NULL,
    external_event_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','PROCESSED','FAILED')),
    error VARCHAR(500),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, channel, external_event_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID REFERENCES branches(id),
    type VARCHAR(20) NOT NULL,                   -- NEW_ORDER, LOW_STOCK
    message VARCHAR(500) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_tenant ON notifications (tenant_id, read, created_at);
-- V2: bổ sung cho gói 2 (Catalog, Purchasing, Cost, Transfer, Stocktake)
-- Không sửa V1 (Flyway kiểm tra checksum).

-- 1. Bộ đếm sinh mã chứng từ theo tenant: PN-000001, CK-000001, KK-000001, barcode nội bộ...
CREATE TABLE doc_counters (
    tenant_id  UUID        NOT NULL REFERENCES tenants(id),
    doc_type   VARCHAR(20) NOT NULL,
    last_value BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, doc_type)
);

-- 2. Cột bổ sung
ALTER TABLE purchase_receipts ADD COLUMN total_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE stock_transfers   ADD COLUMN note VARCHAR(500);
ALTER TABLE stocktakes        ADD COLUMN note VARCHAR(500);

-- 3. Lịch sử giá vốn bình quân (audit FR-COST-01): mỗi lần xác nhận phiếu nhập ghi 1 dòng
CREATE TABLE cost_history (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     UUID NOT NULL REFERENCES tenants(id),
    sku_id        UUID NOT NULL REFERENCES product_variants(id),
    receipt_id    UUID REFERENCES purchase_receipts(id),
    old_stock     INT           NOT NULL,
    old_cost      NUMERIC(18,4) NOT NULL,
    import_qty    INT           NOT NULL CHECK (import_qty > 0),
    import_price  NUMERIC(18,4) NOT NULL,
    new_cost      NUMERIC(18,4) NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_cost_history_sku ON cost_history (tenant_id, sku_id, created_at);

CREATE OR REPLACE FUNCTION fn_append_only() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION '% is append-only (% not allowed)', TG_TABLE_NAME, TG_OP;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cost_history_append_only
    BEFORE UPDATE OR DELETE ON cost_history
    FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- 4. Ràng buộc & index
-- tên danh mục không trùng trong cùng cấp (parent NULL = cấp gốc)
CREATE UNIQUE INDEX ux_categories_name
    ON categories (tenant_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
CREATE INDEX ix_variants_sku_lower     ON product_variants (tenant_id, lower(sku));
CREATE INDEX ix_stock_tenant_branch    ON stock_levels (tenant_id, branch_id);
CREATE INDEX ix_receipts_tenant_created ON purchase_receipts (tenant_id, created_at DESC);
CREATE INDEX ix_receipt_items_receipt  ON purchase_receipt_items (tenant_id, receipt_id);
CREATE INDEX ix_transfers_tenant_created ON stock_transfers (tenant_id, created_at DESC);
CREATE INDEX ix_transfer_items_transfer ON stock_transfer_items (tenant_id, transfer_id);
CREATE INDEX ix_stocktake_items_st     ON stocktake_items (tenant_id, stocktake_id);
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
