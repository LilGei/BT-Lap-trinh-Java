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
