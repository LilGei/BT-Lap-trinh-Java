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
