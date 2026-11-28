import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryApi from "@/infrastructure/api/inventoryApi";
import { productApi, extractList } from "@/infrastructure/api/productApi";

const PAGE_SIZE = 20;

const REFERENCE_LABELS = {
  PURCHASE_RECEIPT: "Nhập hàng",
  TRANSFER_OUT: "Chuyển kho đi",
  TRANSFER_IN: "Chuyển kho đến",
  SALE: "Bán hàng",
  RETURN: "Trả hàng",
  STOCKTAKE_ADJUST: "Điều chỉnh kiểm kê",
};

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("vi-VN");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("vi-VN");
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Không thể tải dữ liệu.";

const getFirstValue = (object, keys, fallback = null) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }

  return fallback;
};

function LedgerPage() {
  const [branches, setBranches] = useState([]);
  const [skus, setSkus] = useState([]);
  const [rows, setRows] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [skuId, setSkuId] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  // ==========================================
  // LOAD BRANCHES AND SKUS
  // ==========================================

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);

    const [branchResult, skuResult] = await Promise.allSettled([
      inventoryApi.getBranches(),
      productApi.getSkus(),
    ]);

    if (branchResult.status === "fulfilled") {
      setBranches(extractList(branchResult.value));
    }

    if (skuResult.status === "fulfilled") {
      setSkus(extractList(skuResult.value));
    }

    setLoadingOptions(false);
  }, []);

  // ==========================================
  // LOAD INVENTORY LEDGER
  // ==========================================

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        size: PAGE_SIZE,
      };

      if (branchId) params.branchId = branchId;
      if (skuId) params.skuId = skuId;

      const response = await inventoryApi.getInventoryLedger(params);

      const payload = response?.data ?? response;
      const list = extractList(payload);

      setRows(list);
      setTotalPages(Number(payload?.totalPages ?? 0));
      setTotalElements(
        Number(payload?.totalElements ?? list.length)
      );

      setLastUpdated(new Date());
    } catch (err) {
      setRows([]);
      setTotalPages(0);
      setTotalElements(0);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, branchId, skuId]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // ==========================================
  // NORMALIZE DATA
  // ==========================================

  const normalizedRows = useMemo(() => {
    return rows.map((row, index) => {
      const currentBranchId = getFirstValue(row, [
        "branchId",
        "warehouseId",
      ]);

      const currentSkuId = getFirstValue(row, [
        "skuId",
        "variantId",
        "productVariantId",
      ]);

      const branch = branches.find(
        (item) => String(item.id) === String(currentBranchId)
      );

      const sku = skus.find(
        (item) => String(item.id) === String(currentSkuId)
      );

      const rawType = getFirstValue(row, [
        "referenceType",
        "transactionType",
        "movementType",
        "type",
      ], "");

      const quantity = Number(
        getFirstValue(row, [
          "quantityChange",
          "quantityDelta",
          "delta",
          "quantity",
        ], 0)
      );

      const direction = String(
        getFirstValue(row, ["direction", "movement", "type"], "")
      ).toUpperCase();

      let change = quantity;

      if (["OUT", "TRANSFER_OUT", "EXPORT"].includes(direction)) {
        change = -Math.abs(quantity);
      } else if (
        ["IN", "TRANSFER_IN", "IMPORT"].includes(direction)
      ) {
        change = Math.abs(quantity);
      }

      const skuCode =
        getFirstValue(row, ["skuCode", "code"]) ||
        sku?.skuCode ||
        sku?.code ||
        sku?.sku ||
        sku?.name ||
        currentSkuId ||
        "—";

      const productName =
        getFirstValue(row, ["productName", "skuName", "name"]) ||
        sku?.productName ||
        sku?.name ||
        "—";

      const referenceCode = getFirstValue(row, [
        "referenceCode",
        "documentCode",
        "receiptCode",
        "transferCode",
      ]);

      const referenceId = getFirstValue(row, [
        "referenceId",
        "documentId",
      ]);

      const balanceAfter = getFirstValue(row, [
        "balanceAfter",
        "quantityAfter",
        "stockAfter",
        "remainingQuantity",
      ]);

      return {
        id: row.id ?? `${currentBranchId}-${currentSkuId}-${index}`,
        createdAt: getFirstValue(row, [
          "createdAt",
          "transactionDate",
          "occurredAt",
          "createdDate",
        ]),
        branchId: currentBranchId,
        branchName:
          branch?.name ||
          branch?.code ||
          row.branchName ||
          currentBranchId ||
          "—",
        skuId: currentSkuId,
        skuCode,
        productName,
        referenceType: rawType,
        referenceLabel:
          REFERENCE_LABELS[rawType] || rawType || "—",
        referenceCode: referenceCode || referenceId || "—",
        quantityChange: change,
        balanceAfter,
      };
    });
  }, [rows, branches, skus]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const statistics = useMemo(() => {
    const totalIn = normalizedRows
      .filter((row) => row.quantityChange > 0)
      .reduce((sum, row) => sum + row.quantityChange, 0);

    const totalOut = normalizedRows
      .filter((row) => row.quantityChange < 0)
      .reduce((sum, row) => sum + Math.abs(row.quantityChange), 0);

    return {
      total: totalElements,
      totalIn,
      totalOut,
    };
  }, [normalizedRows, totalElements]);

  // ==========================================
  // FILTERS
  // ==========================================

  const handleRefresh = () => {
    loadOptions();
    loadLedger();
  };

  const handleResetFilters = () => {
    setBranchId("");
    setSkuId("");
    setPage(0);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Sổ kho</h2>
          <p style={styles.subtitle}>
            Theo dõi lịch sử nhập, xuất và biến động tồn kho.
          </p>
        </div>

        <button
          type="button"
          style={styles.primaryButton}
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ Làm mới
        </button>
      </div>

      {/* STATISTICS */}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span>Tổng giao dịch</span>
          <strong>{formatNumber(statistics.total)}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Tổng lượng nhập trong trang</span>
          <strong style={{ color: "#15803d" }}>
            +{formatNumber(statistics.totalIn)}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span>Tổng lượng xuất trong trang</span>
          <strong style={{ color: "#dc2626" }}>
            -{formatNumber(statistics.totalOut)}
          </strong>
        </div>
      </div>

      {/* FILTER */}

      <section style={styles.card}>
        <h3 style={styles.heading}>Bộ lọc giao dịch</h3>

        <div style={styles.filters}>
          <div style={styles.field}>
            <label style={styles.label}>Chi nhánh / Kho</label>

            <select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setPage(0);
              }}
              style={styles.input}
              disabled={loadingOptions}
            >
              <option value="">Tất cả kho</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name || branch.code}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>SKU</label>

            <select
              value={skuId}
              onChange={(event) => {
                setSkuId(event.target.value);
                setPage(0);
              }}
              style={styles.input}
              disabled={loadingOptions}
            >
              <option value="">Tất cả SKU</option>

              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.skuCode || sku.code || sku.sku || sku.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>&nbsp;</label>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handleResetFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </section>

      {/* LEDGER TABLE */}

      <section style={styles.card}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.heading}>Lịch sử biến động tồn kho</h3>
            <p style={styles.subtitle}>
              Tổng cộng {formatNumber(totalElements)} giao dịch
            </p>
          </div>

          <span style={styles.readOnly}>
            <span>●</span> Chỉ đọc
          </span>
        </div>

        {error && (
          <div style={styles.error}>
            <strong>Không thể tải sổ kho.</strong>
            <p>{error}</p>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={loadLedger}
            >
              Thử lại
            </button>
          </div>
        )}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>STT</th>
                <th style={styles.th}>Thời gian</th>
                <th style={styles.th}>Kho</th>
                <th style={styles.th}>Mã SKU</th>
                <th style={styles.th}>Tên sản phẩm</th>
                <th style={styles.th}>Loại giao dịch</th>
                <th style={styles.th}>Chứng từ</th>
                <th style={styles.th}>Thay đổi</th>
                <th style={styles.th}>Tồn sau giao dịch</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={styles.empty}>
                    Đang tải dữ liệu sổ kho...
                  </td>
                </tr>
              ) : normalizedRows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={styles.empty}>
                    {error
                      ? "Không thể hiển thị dữ liệu."
                      : "Chưa có giao dịch tồn kho."}
                  </td>
                </tr>
              ) : (
                normalizedRows.map((row, index) => (
                  <tr key={row.id}>
                    <td style={styles.td}>
                      {page * PAGE_SIZE + index + 1}
                    </td>

                    <td style={styles.td}>
                      {formatDate(row.createdAt)}
                    </td>

                    <td style={styles.td}>
                      {row.branchName}
                    </td>

                    <td style={styles.td}>
                      <strong>{row.skuCode}</strong>
                    </td>

                    <td style={styles.td}>
                      {row.productName}
                    </td>

                    <td style={styles.td}>
                      {row.referenceLabel}
                    </td>

                    <td style={styles.td}>
                      {row.referenceCode}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        color:
                          row.quantityChange < 0
                            ? "#dc2626"
                            : row.quantityChange > 0
                            ? "#15803d"
                            : "#374151",
                        fontWeight: 700,
                      }}
                    >
                      {row.quantityChange > 0 ? "+" : ""}
                      {formatNumber(row.quantityChange)}
                    </td>

                    <td style={styles.td}>
                      {row.balanceAfter !== null
                        ? formatNumber(row.balanceAfter)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div style={styles.pagination}>
          <span>
            Trang {page + 1}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
          </span>

          <div style={styles.paginationActions}>
            <button
              type="button"
              style={styles.secondaryButton}
              disabled={loading || page <= 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Trước
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              disabled={
                loading ||
                totalPages === 0 ||
                page + 1 >= totalPages
              }
              onClick={() => setPage((current) => current + 1)}
            >
              Tiếp
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          Cập nhật lần cuối:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleString("vi-VN")
            : "Chưa có dữ liệu"}
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    width: "100%",
    boxSizing: "border-box",
    color: "#1f2937",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 13,
    margin: "6px 0 0",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    color: "#6b7280",
    fontSize: 13,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  heading: {
    margin: "0 0 14px",
    fontSize: 17,
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    minHeight: 40,
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    boxSizing: "border-box",
  },
  primaryButton: {
    padding: "9px 14px",
    border: "none",
    borderRadius: 6,
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "9px 13px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  readOnly: {
    color: "#166534",
    background: "#dcfce7",
    borderRadius: 20,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    minWidth: 1050,
    borderCollapse: "collapse",
  },
  th: {
    padding: 12,
    textAlign: "left",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    verticalAlign: "middle",
  },
  empty: {
    textAlign: "center",
    padding: 30,
    color: "#9ca3af",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    fontSize: 13,
  },
  paginationActions: {
    display: "flex",
    gap: 8,
  },
  footer: {
    marginTop: 14,
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "right",
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: 12,
    borderRadius: 6,
    marginBottom: 14,
  },
};

export default LedgerPage;
