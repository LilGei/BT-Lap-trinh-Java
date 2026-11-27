-- BE2: đối chiếu với schema.sql hiện có; bỏ bảng nào đã tồn tại. Tên cột khớp entity BE2.
CREATE TABLE IF NOT EXISTS branch_inventory (
  id BIGSERIAL PRIMARY KEY, tenant_id BIGINT NOT NULL, branch_id BIGINT NOT NULL, sku_id BIGINT NOT NULL,
  on_hand INT NOT NULL DEFAULT 0 CHECK (on_hand >= 0), reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  UNIQUE (tenant_id, branch_id, sku_id));

CREATE TABLE IF NOT EXISTS inventory_ledger (
  id BIGSERIAL PRIMARY KEY, tenant_id BIGINT NOT NULL, branch_id BIGINT NOT NULL, sku_id BIGINT NOT NULL,
  type VARCHAR(8) NOT NULL, reason VARCHAR(32) NOT NULL, quantity INT NOT NULL CHECK (quantity > 0),
  balance_after INT NOT NULL CHECK (balance_after >= 0), reference_type VARCHAR(32), reference_id BIGINT,
  created_by BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ix_ledger_tenant_created ON inventory_ledger (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS ix_ledger_tenant_sku ON inventory_ledger (tenant_id, sku_id);

-- Chặn UPDATE/DELETE ở mức DB (NFR-SEC-03)
CREATE OR REPLACE FUNCTION trg_ledger_append_only() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'inventory_ledger is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ledger_no_mutation ON inventory_ledger;
CREATE TRIGGER ledger_no_mutation BEFORE UPDATE OR DELETE ON inventory_ledger
  FOR EACH ROW EXECUTE FUNCTION trg_ledger_append_only();

CREATE TABLE IF NOT EXISTS purchase_receipt (
  id BIGSERIAL PRIMARY KEY, tenant_id BIGINT NOT NULL, branch_id BIGINT NOT NULL, supplier_name VARCHAR(255), note TEXT,
  status VARCHAR(16) NOT NULL, created_by BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), confirmed_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS purchase_receipt_item (
  id BIGSERIAL PRIMARY KEY, receipt_id BIGINT NOT NULL REFERENCES purchase_receipt(id), sku_id BIGINT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0), import_price NUMERIC(18,4) NOT NULL CHECK (import_price >= 0));

CREATE TABLE IF NOT EXISTS stock_transfer (
  id BIGSERIAL PRIMARY KEY, tenant_id BIGINT NOT NULL, from_branch_id BIGINT NOT NULL, to_branch_id BIGINT NOT NULL, note TEXT,
  status VARCHAR(16) NOT NULL, created_by BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at TIMESTAMPTZ, received_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS stock_transfer_item (
  id BIGSERIAL PRIMARY KEY, transfer_id BIGINT NOT NULL REFERENCES stock_transfer(id), sku_id BIGINT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0));

CREATE TABLE IF NOT EXISTS stocktake (
  id BIGSERIAL PRIMARY KEY, tenant_id BIGINT NOT NULL, branch_id BIGINT NOT NULL, note TEXT, status VARCHAR(16) NOT NULL,
  created_by BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS stocktake_item (
  id BIGSERIAL PRIMARY KEY, stocktake_id BIGINT NOT NULL REFERENCES stocktake(id), sku_id BIGINT NOT NULL,
  counted_qty INT NOT NULL CHECK (counted_qty >= 0), system_qty INT, diff INT);
