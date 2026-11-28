import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryApi from "@/infrastructure/api/inventoryApi";
import { productApi, extractList } from "@/infrastructure/api/productApi";
import "@/presentation/styles/InventoryAlertPage.css";

const PAGE_SIZE = 20;

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("vi-VN");

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Không thể tải dữ liệu.";

const firstValue = (object, keys, fallback = null) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }

  return fallback;
};

function InventoryAlertPage() {
  const [stocks, setStocks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [skus, setSkus] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ==========================================
  // 1. LOAD BRANCHES AND SKUS
  // ==========================================

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
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
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // ==========================================
  // 2. LOAD LOW STOCK ALERTS
  // ==========================================

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        size: PAGE_SIZE,
      };

      if (branchFilter) {
        params.branchId = branchFilter;
      }

      // Backend đã xác nhận:
      // GET /api/inventory/stock?lowStockOnly=true

      const response = await inventoryApi.getLowStockAlerts(params);

      const payload = response?.data ?? response;
      const list = extractList(payload);

      setStocks(list);
      setTotalPages(Number(payload?.totalPages ?? 0));
      setTotalElements(Number(payload?.totalElements ?? list.length));

      setLastUpdated(new Date());
    } catch (err) {
      setStocks([]);
      setTotalPages(0);
      setTotalElements(0);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, branchFilter]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // ==========================================
  // 3. NORMALIZE STOCK DATA
  // ==========================================

  const normalizedStocks = useMemo(() => {
    return stocks.map((stock, index) => {
      const skuId = firstValue(stock, [
        "skuId",
        "variantId",
        "productVariantId",
      ]);

      const sku = skus.find(
        (item) => String(item.id) === String(skuId)
      );

      const branchId = firstValue(stock, [
        "branchId",
        "warehouseId",
      ]);

      const branch = branches.find(
        (item) => String(item.id) === String(branchId)
      );

      // Ưu tiên available vì Backend xác định cảnh báo
      // dựa trên số lượng có thể bán / sử dụng.

      const quantity = Number(
        firstValue(stock, [
          "available",
          "availableQuantity",
          "availableQty",
          "quantity",
          "onHand",
          "onHandQuantity",
          "stockQuantity",
          "currentStock",
        ], 0)
      );

      // Ngưỡng cảnh báo được cấu hình trên SKU.

      const threshold = Number(
        firstValue(stock, [
          "reorderThreshold",
          "minStock",
          "minStockLevel",
          "minimumStock",
          "reorderLevel",
          "lowStockThreshold",
          "safetyStock",
        ], 0)
      );

      const skuCode =
        firstValue(stock, ["skuCode", "code", "sku"]) ||
        sku?.skuCode ||
        sku?.code ||
        sku?.sku ||
        "Chưa xác định";

      const productName =
        firstValue(stock, [
          "productName",
          "name",
          "variantName",
        ]) ||
        sku?.productName ||
        sku?.name ||
        sku?.product?.name ||
        "Chưa có tên sản phẩm";

      // Backend trả về danh sách đã được lọc lowStockOnly.
      // Phân loại tiếp thành hết hàng và tồn kho thấp.

      const status = quantity <= 0 ? "OUT" : "LOW";

      return {
        id: stock.id ?? `${branchId}-${skuId}-${index}`,
        skuId,
        skuCode,
        productName,
        branchId,
        branchName:
          branch?.name ||
          branch?.code ||
          stock.branchName ||
          "Chưa xác định",
        quantity,
        threshold,
        status,
      };
    });
  }, [stocks, skus, branches]);

  // ==========================================
  // 4. CLIENT-SIDE FILTER
  // ==========================================

  const filteredStocks = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return normalizedStocks.filter((item) => {
      const matchesKeyword =
        !search ||
        String(item.skuCode).toLowerCase().includes(search) ||
        String(item.productName).toLowerCase().includes(search) ||
        String(item.branchName).toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [normalizedStocks, keyword, statusFilter]);

  // ==========================================
  // 5. PAGE STATISTICS
  // ==========================================

  const statistics = useMemo(() => ({
    total: totalElements,

    out: normalizedStocks.filter(
      (item) => item.status === "OUT"
    ).length,

    low: normalizedStocks.filter(
      (item) => item.status === "LOW"
    ).length,
  }), [normalizedStocks, totalElements]);

  // ==========================================
  // 6. REFRESH
  // ==========================================

  const handleRefresh = async () => {
    await loadOptions();
    await loadAlerts();
  };

  const handleResetFilters = () => {
    setKeyword("");
    setBranchFilter("");
    setStatusFilter("ALL");
    setPage(0);
  };

  const getStatusLabel = (status) =>
    status === "OUT" ? "Hết hàng" : "Tồn kho thấp";

  const getStatusClass = (status) =>
    status === "OUT"
      ? "alert-status-out"
      : "alert-status-low";

  // ==========================================
  // 7. RENDER
  // ==========================================

  return (
    <div className="inventory-alert-page">
      <div className="inventory-alert-header">
        <div>
          <h2>Cảnh báo tồn kho</h2>
          <p>
            Theo dõi sản phẩm có số lượng tồn kho thấp
            hoặc đã hết hàng.
          </p>
        </div>

        <button
          type="button"
          className="alert-btn alert-btn-primary"
          onClick={handleRefresh}
          disabled={loading || loadingOptions}
        >
          ↻ Làm mới
        </button>
      </div>

      {/* STATISTICS */}

      <div className="alert-stat-grid">
        <div className="alert-stat-card">
          <span>Tổng sản phẩm được trả về</span>
          <strong>{formatNumber(statistics.total)}</strong>
        </div>

        <div className="alert-stat-card alert-stat-danger">
          <span>Hết hàng (trang hiện tại)</span>
          <strong>{formatNumber(statistics.out)}</strong>
        </div>

        <div className="alert-stat-card alert-stat-warning">
          <span>Tồn kho thấp (trang hiện tại)</span>
          <strong>{formatNumber(statistics.low)}</strong>
        </div>
      </div>

      {/* FILTER */}

      <section className="alert-card">
        <h3>Bộ lọc cảnh báo</h3>

        <div className="alert-filter-grid">
          <div className="alert-field">
            <label>Tìm kiếm</label>

            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Mã SKU, tên sản phẩm..."
            />
          </div>

          <div className="alert-field">
            <label>Chi nhánh / Kho</label>

            <select
              value={branchFilter}
              onChange={(event) => {
                setBranchFilter(event.target.value);
                setPage(0);
              }}
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

          <div className="alert-field">
            <label>Trạng thái</label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OUT">Hết hàng</option>
              <option value="LOW">Tồn kho thấp</option>
            </select>
          </div>

          <div className="alert-field">
            <label>&nbsp;</label>

            <button
              type="button"
              className="alert-btn"
              onClick={handleResetFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </section>

      {/* ALERT TABLE */}

      <section className="alert-card">
        <div className="alert-table-heading">
          <div>
            <h3>Danh sách cảnh báo</h3>
            <p>
              {formatNumber(filteredStocks.length)} sản phẩm
              trong trang hiện tại
            </p>
          </div>

          <span className="alert-readonly">
            Chỉ xem dữ liệu
          </span>
        </div>

        {error && (
          <div className="alert-error">
            <strong>Không thể tải cảnh báo.</strong>
            <p>{error}</p>

            <button
              type="button"
              className="alert-btn"
              onClick={loadAlerts}
              disabled={loading}
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="alert-table-wrapper">
          <table className="alert-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã SKU</th>
                <th>Tên sản phẩm</th>
                <th>Chi nhánh / Kho</th>
                <th>Tồn hiện tại</th>
                <th>Ngưỡng tối thiểu</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="alert-empty">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="alert-empty">
                    Không có dữ liệu để hiển thị.
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="alert-empty">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item, index) => (
                  <tr key={item.id}>
                    <td>{page * PAGE_SIZE + index + 1}</td>

                    <td>
                      <strong>{item.skuCode}</strong>
                    </td>

                    <td>{item.productName}</td>

                    <td>{item.branchName}</td>

                    <td className={
                      item.status === "OUT"
                        ? "alert-quantity-danger"
                        : "alert-quantity-warning"
                    }>
                      {formatNumber(item.quantity)}
                    </td>

                    <td>
                      {item.threshold > 0
                        ? formatNumber(item.threshold)
                        : "Chưa cấu hình"}
                    </td>

                    <td>
                      <span
                        className={`alert-status ${getStatusClass(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="alert-pagination">
          <span>
            Trang {page + 1}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
          </span>

          <div>
            <button
              type="button"
              className="alert-btn"
              disabled={loading || page <= 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Trước
            </button>

            <button
              type="button"
              className="alert-btn"
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

        <div className="alert-footer">
          Cập nhật lần cuối:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleString("vi-VN")
            : "Chưa có dữ liệu"}
        </div>
      </section>
    </div>
  );
}

export default InventoryAlertPage;
