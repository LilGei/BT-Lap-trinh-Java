import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryApi from "@/infrastructure/api/inventoryApi";
import { productApi, extractList } from "@/infrastructure/api/productApi";

const PAGE_SIZE = 20;

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Đã xảy ra lỗi. Vui lòng thử lại.";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("vi-VN");
};

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("vi-VN");

const getBranchName = (branch) =>
  branch?.name || branch?.code || branch?.id || "—";

const getSkuName = (sku) =>
  sku?.skuCode ||
  sku?.code ||
  sku?.sku ||
  sku?.name ||
  sku?.id ||
  "—";

const getStatusLabel = (status) => {
  const labels = {
    IN_PROGRESS: "Đang kiểm kê",
    COMPLETED: "Đã hoàn tất",
  };

  return labels[status] || status || "Không xác định";
};

const getStatusStyle = (status) => {
  if (status === "COMPLETED") {
    return { color: "#166534", background: "#dcfce7" };
  }

  return { color: "#92400e", background: "#fef3c7" };
};

const getPagePayload = (response) => response?.data ?? response;

function StocktakePage() {
  const [branches, setBranches] = useState([]);
  const [skus, setSkus] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [stocktakes, setStocktakes] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [counts, setCounts] = useState({});
  const [note, setNote] = useState("");

  const [selectedStocktake, setSelectedStocktake] = useState(null);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [branchError, setBranchError] = useState("");
  const [skuError, setSkuError] = useState("");
  const [stockError, setStockError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);

  // ==========================================
  // 1. LOAD BRANCHES AND SKUS
  // ==========================================

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setBranchError("");
    setSkuError("");

    const results = await Promise.allSettled([
      inventoryApi.getBranches(),
      productApi.getSkus(),
    ]);

    const [branchResult, skuResult] = results;

    if (branchResult.status === "fulfilled") {
      const list = extractList(branchResult.value).filter(
        (branch) => branch.active !== false
      );

      setBranches(list);

      setBranchId((current) => {
        if (list.some((branch) => String(branch.id) === String(current))) {
          return current;
        }

        return list[0]?.id || "";
      });
    } else {
      setBranches([]);
      setBranchError(
        "Không tải được danh sách kho: " +
          getErrorMessage(branchResult.reason)
      );
    }

    if (skuResult.status === "fulfilled") {
      setSkus(extractList(skuResult.value));
    } else {
      setSkus([]);
      setSkuError(
        "Không tải được danh sách SKU: " +
          getErrorMessage(skuResult.reason)
      );
    }

    setLoadingOptions(false);
  }, []);

  // ==========================================
  // 2. LOAD STOCK BY BRANCH
  // ==========================================

  const loadStock = useCallback(async () => {
    if (!branchId) {
      setStockRows([]);
      setStockError("");
      return;
    }

    setLoadingStock(true);
    setStockError("");

    try {
      const response = await inventoryApi.getInventoryStock({
        branchId,
        page: 0,
        size: 100,
      });

      const list = extractList(response);
      setStockRows(list);
    } catch (err) {
      setStockRows([]);
      setStockError(
        "Không tải được tồn kho: " + getErrorMessage(err)
      );
    } finally {
      setLoadingStock(false);
    }
  }, [branchId]);

  // ==========================================
  // 3. LOAD STOCKTAKE HISTORY
  // ==========================================

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError("");

    try {
      const response = await inventoryApi.getStocktakes({
        page: historyPage,
        size: PAGE_SIZE,
      });

      const payload = getPagePayload(response);

      setStocktakes(extractList(payload));
      setHistoryTotalPages(Number(payload?.totalPages ?? 0));
      setHistoryTotalElements(
        Number(payload?.totalElements ?? 0)
      );
    } catch (err) {
      setStocktakes([]);
      setHistoryTotalPages(0);
      setHistoryTotalElements(0);
      setHistoryError(
        "Không tải được lịch sử kiểm kê: " +
          getErrorMessage(err)
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPage]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ==========================================
  // 4. NORMALIZE STOCK DATA
  // ==========================================

  const normalizedRows = useMemo(() => {
    return stockRows.map((stock, index) => {
      const sku = skus.find(
        (item) => String(item.id) === String(stock.skuId)
      );

      const systemQuantity = Number(
        stock.onHand ??
          stock.systemQty ??
          stock.available ??
          stock.availableQuantity ??
          stock.quantity ??
          0
      );

      return {
        id: stock.id || `${stock.skuId}-${index}`,
        skuId: stock.skuId,
        skuCode: getSkuName(sku || { id: stock.skuId }),
        productName:
          sku?.productName ||
          sku?.product?.name ||
          sku?.name ||
          "",
        systemQuantity,
      };
    });
  }, [stockRows, skus]);

  // ==========================================
  // 5. COUNT AND DIFFERENCE
  // ==========================================

  const handleCountChange = (skuId, value) => {
    setError("");
    setSuccess("");

    setCounts((current) => ({
      ...current,
      [skuId]: value,
    }));
  };

  const getDifference = (row) => {
    const value = counts[row.skuId];

    if (value === undefined || value === "") {
      return null;
    }

    return Number(value) - row.systemQuantity;
  };

  const countedRows = useMemo(() => {
    return normalizedRows
      .filter((row) => {
        const value = counts[row.skuId];
        return value !== undefined && value !== "";
      })
      .map((row) => ({
        ...row,
        actualQuantity: Number(counts[row.skuId]),
        difference:
          Number(counts[row.skuId]) - row.systemQuantity,
      }));
  }, [normalizedRows, counts]);

  const totalCounted = countedRows.length;

  const totalDifferent = countedRows.filter(
    (row) => row.difference !== 0
  ).length;

  const totalIncrease = countedRows.filter(
    (row) => row.difference > 0
  ).length;

  const totalDecrease = countedRows.filter(
    (row) => row.difference < 0
  ).length;

  const remainingCount = Math.max(
    0,
    normalizedRows.length - totalCounted
  );

  const countProgress =
    normalizedRows.length > 0
      ? Math.round((totalCounted / normalizedRows.length) * 100)
      : 0;

  // ==========================================
  // 6. VALIDATE COUNT DATA
  // ==========================================

  const validateCounts = () => {
    if (!branchId) {
      return "Vui lòng chọn kho kiểm kê.";
    }

    if (normalizedRows.length === 0) {
      return "Kho hiện không có dữ liệu tồn kho để kiểm kê.";
    }

    if (countedRows.length === 0) {
      return "Bạn chưa nhập số đếm cho SKU nào.";
    }

    for (const row of countedRows) {
      if (
        !Number.isFinite(row.actualQuantity) ||
        row.actualQuantity < 0
      ) {
        return `Số đếm của SKU ${row.skuCode} phải lớn hơn hoặc bằng 0.`;
      }

      if (!Number.isFinite(row.systemQuantity)) {
        return `Tồn hệ thống của SKU ${row.skuCode} không hợp lệ.`;
      }
    }

    return "";
  };

  // ==========================================
  // 7. VALIDATE COUNT DRAFT
  // Chưa gửi request vì thiếu DTO Backend
  // ==========================================

  const handleValidateCounts = () => {
    setError("");
    setSuccess("");

    const validationError = validateCounts();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSuccess(
      `Dữ liệu hợp lệ: ${totalCounted} SKU đã kiểm đếm, ` +
        `${totalDifferent} SKU có chênh lệch. ` +
        "Đây mới là dữ liệu tạm trên giao diện, chưa được lưu vào Backend."
    );
  };

  const handleClearCounts = () => {
    if (totalCounted === 0) return;

    const accepted = window.confirm(
      "Bạn có chắc chắn muốn xóa toàn bộ số đếm đang nhập?"
    );

    if (!accepted) return;

    setCounts({});
    setError("");
    setSuccess("Đã xóa số đếm tạm trên giao diện.");
  };

  // ==========================================
  // 8. VIEW STOCKTAKE DETAIL
  // ==========================================

  const handleViewDetail = async (id) => {
    setError("");
    setDetailLoading(true);

    try {
      const response = await inventoryApi.getStocktakeById(id);
      setSelectedStocktake(getPagePayload(response));
    } catch (err) {
      setError(
        "Không tải được chi tiết kiểm kê: " +
          getErrorMessage(err)
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================
  // 9. COMPLETE STOCKTAKE
  // ==========================================

  const handleComplete = async (stocktake) => {
    if (!stocktake?.id) return;

    if (stocktake.status !== "IN_PROGRESS") {
      setError("Phiên kiểm kê này không còn ở trạng thái đang thực hiện.");
      return;
    }

    const accepted = window.confirm(
      `Bạn có chắc chắn muốn hoàn tất phiếu ${
        stocktake.code || ""
      }?`
    );

    if (!accepted) return;

    setError("");
    setSuccess("");
    setActionId(stocktake.id);

    try {
      await inventoryApi.completeStocktake(stocktake.id);

      setSuccess("Hoàn tất kiểm kê thành công.");
      setSelectedStocktake(null);

      await loadHistory();
    } catch (err) {
      setError(
        "Không thể hoàn tất kiểm kê: " + getErrorMessage(err)
      );
    } finally {
      setActionId(null);
    }
  };

  // ==========================================
  // 10. DELETE IN-PROGRESS STOCKTAKE
  // ==========================================

  const handleDelete = async (stocktake) => {
    if (!stocktake?.id) return;

    if (stocktake.status !== "IN_PROGRESS") {
      setError("Chỉ được xóa phiên kiểm kê đang thực hiện.");
      return;
    }

    const accepted = window.confirm(
      `Bạn có chắc chắn muốn xóa phiên ${
        stocktake.code || ""
      }?`
    );

    if (!accepted) return;

    setError("");
    setSuccess("");
    setActionId(stocktake.id);

    try {
      await inventoryApi.deleteStocktake(stocktake.id);

      setSuccess("Đã xóa phiên kiểm kê.");
      setSelectedStocktake(null);

      await loadHistory();
    } catch (err) {
      setError(
        "Không thể xóa phiên kiểm kê: " + getErrorMessage(err)
      );
    } finally {
      setActionId(null);
    }
  };

  // ==========================================
  // 11. HELPERS
  // ==========================================

  const getBranchLabel = (id) => {
    const branch = branches.find(
      (item) => String(item.id) === String(id)
    );

    return branch ? getBranchName(branch) : id || "—";
  };

  const getDetailItems = (stocktake) =>
    stocktake?.items || stocktake?.lines || [];

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await Promise.all([
      loadOptions(),
      loadStock(),
      loadHistory(),
    ]);
  };

  const detailItems = selectedStocktake
    ? getDetailItems(selectedStocktake)
    : [];

  // ==========================================
  // 12. RENDER
  // ==========================================

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Kiểm kê kho</h2>
          <p style={styles.subtitle}>
            Đối chiếu tồn kho hệ thống với số lượng kiểm đếm thực tế.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          disabled={loadingOptions || loadingStock || loadingHistory}
          onClick={async () => {
            await loadOptions();
            await loadHistory();
          }}
        >
          ↻ Làm mới
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {branchError && (
        <div style={styles.error}>{branchError}</div>
      )}

      {skuError && (
        <div style={styles.error}>{skuError}</div>
      )}

      {stockError && (
        <div style={styles.error}>{stockError}</div>
      )}

      {/* THÔNG TIN KIỂM KÊ */}
      <section style={styles.card}>
        <h3 style={styles.heading}>Thông tin kiểm kê</h3>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Kho kiểm kê *</label>

            <select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setCounts({});
                setError("");
                setSuccess("");
              }}
              style={styles.input}
              disabled={loadingOptions}
            >
              <option value="">-- Chọn kho --</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {getBranchName(branch)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Ghi chú</label>

            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú phiên kiểm kê..."
              style={styles.input}
              maxLength={500}
            />
            <span style={styles.helperText}>
              Ghi chú hiện chỉ được giữ trong trạng thái giao diện.
            </span>
          </div>
        </div>
      </section>

      {/* THỐNG KÊ */}
      <section style={styles.stats}>
        <div style={styles.statCard}>
          <span>SKU trong kho</span>
          <strong>{formatNumber(normalizedRows.length)}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Đã nhập số đếm</span>
          <strong>{formatNumber(totalCounted)}</strong>
        </div>

        <div style={styles.statCard}>
          <span>SKU chênh lệch</span>
          <strong style={{ color: "#dc2626" }}>
            {formatNumber(totalDifferent)}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span>Chưa kiểm đếm</span>
          <strong>{formatNumber(remainingCount)}</strong>
        </div>
      </section>

      {/* TIẾN ĐỘ KIỂM ĐẾM */}
      <section style={styles.card}>
        <div style={styles.progressHeader}>
          <strong>Tiến độ kiểm đếm</strong>
          <strong>{countProgress}%</strong>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${countProgress}%`,
            }}
          />
        </div>

        <div style={styles.progressFooter}>
          <span>{totalCounted} SKU đã nhập</span>
          <span>{remainingCount} SKU còn lại</span>
        </div>
      </section>

      {/* DANH SÁCH SKU */}
      <section style={styles.card}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.heading}>Danh sách SKU kiểm kê</h3>
            <p style={styles.subtitle}>
              Nhập số lượng thực tế để xem chênh lệch.
            </p>
          </div>

          <span style={styles.readOnly}>
            Đối chiếu tồn kho
          </span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>STT</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Tên sản phẩm</th>
                <th style={styles.th}>Tồn hệ thống</th>
                <th style={styles.th}>Số đếm thực tế</th>
                <th style={styles.th}>Chênh lệch</th>
              </tr>
            </thead>

            <tbody>
              {loadingStock ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    Đang tải tồn kho...
                  </td>
                </tr>
              ) : normalizedRows.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    {stockError
                      ? "Không thể tải dữ liệu tồn kho."
                      : branchId
                      ? "Không có dữ liệu tồn kho cho kho này."
                      : "Vui lòng chọn kho để xem tồn kho."}
                  </td>
                </tr>
              ) : (
                normalizedRows.map((row, index) => {
                  const difference = getDifference(row);

                  return (
                    <tr key={row.id}>
                      <td style={styles.td}>{index + 1}</td>

                      <td style={styles.td}>
                        <strong>{row.skuCode}</strong>
                      </td>

                      <td style={styles.td}>
                        {row.productName || "—"}
                      </td>

                      <td style={styles.td}>
                        {formatNumber(row.systemQuantity)}
                      </td>

                      <td style={styles.td}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={counts[row.skuId] ?? ""}
                          onChange={(event) =>
                            handleCountChange(
                              row.skuId,
                              event.target.value
                            )
                          }
                          style={styles.countInput}
                          placeholder="Nhập số đếm"
                          aria-label={`Số đếm SKU ${row.skuCode}`}
                        />
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          fontWeight: 700,
                          color:
                            difference === null
                              ? "#9ca3af"
                              : difference < 0
                              ? "#dc2626"
                              : difference > 0
                              ? "#15803d"
                              : "#374151",
                        }}
                      >
                        {difference === null
                          ? "—"
                          : `${difference > 0 ? "+" : ""}${formatNumber(
                              difference
                            )}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.summary}>
          <span>
            Tăng: <strong style={{ color: "#15803d" }}>
              {totalIncrease}
            </strong>
          </span>

          <span>
            Giảm: <strong style={{ color: "#dc2626" }}>
              {totalDecrease}
            </strong>
          </span>

          <span>
            Không chênh lệch:{" "}
            <strong>
              {totalCounted - totalDifferent}
            </strong>
          </span>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleClearCounts}
            disabled={totalCounted === 0}
          >
            Xóa số đếm
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={handleValidateCounts}
            disabled={
              loadingStock ||
              normalizedRows.length === 0 ||
              totalCounted === 0
            }
          >
            Kiểm tra dữ liệu
          </button>
        </div>

        <div style={styles.notice}>
          <strong>Trạng thái tích hợp:</strong> Số đếm hiện được xử lý
          trên giao diện. Chức năng gửi dữ liệu lên Backend đang chờ
          xác nhận cấu trúc DTO kiểm kê.
        </div>
      </section>

      {/* LỊCH SỬ KIỂM KÊ */}
      <section style={styles.card}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.heading}>Lịch sử kiểm kê</h3>
            <p style={styles.subtitle}>
              {formatNumber(historyTotalElements)} phiên kiểm kê
            </p>
          </div>
        </div>

        {historyError && (
          <div style={styles.error}>{historyError}</div>
        )}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mã phiếu</th>
                <th style={styles.th}>Ngày tạo</th>
                <th style={styles.th}>Kho</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    Đang tải lịch sử...
                  </td>
                </tr>
              ) : stocktakes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    Chưa có phiên kiểm kê nào.
                  </td>
                </tr>
              ) : (
                stocktakes.map((stocktake) => (
                  <tr key={stocktake.id}>
                    <td style={styles.td}>
                      <strong>{stocktake.code || "—"}</strong>
                    </td>

                    <td style={styles.td}>
                      {formatDate(stocktake.createdAt)}
                    </td>

                    <td style={styles.td}>
                      {getBranchLabel(stocktake.branchId)}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          ...getStatusStyle(stocktake.status),
                        }}
                      >
                        {getStatusLabel(stocktake.status)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.rowActions}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() =>
                            handleViewDetail(stocktake.id)
                          }
                          disabled={detailLoading}
                        >
                          Chi tiết
                        </button>

                        {stocktake.status === "IN_PROGRESS" && (
                          <>
                            <button
                              type="button"
                              style={styles.confirmButton}
                              disabled={actionId === stocktake.id}
                              onClick={() =>
                                handleComplete(stocktake)
                              }
                            >
                              Hoàn tất
                            </button>

                            <button
                              type="button"
                              style={styles.dangerButton}
                              disabled={actionId === stocktake.id}
                              onClick={() =>
                                handleDelete(stocktake)
                              }
                            >
                              Xóa phiên
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <span>
            Trang {historyPage + 1}
            {historyTotalPages > 0
              ? ` / ${historyTotalPages}`
              : ""}
          </span>

          <div style={styles.rowActions}>
            <button
              type="button"
              style={styles.secondaryButton}
              disabled={loadingHistory || historyPage <= 0}
              onClick={() =>
                setHistoryPage((current) => current - 1)
              }
            >
              ← Trước
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              disabled={
                loadingHistory ||
                historyTotalPages === 0 ||
                historyPage + 1 >= historyTotalPages
              }
              onClick={() =>
                setHistoryPage((current) => current + 1)
              }
            >
              Tiếp →
            </button>
          </div>
        </div>
      </section>

      {/* CHI TIẾT PHIẾU */}
      {selectedStocktake && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.heading}>
                Chi tiết {selectedStocktake.code || "phiếu kiểm kê"}
              </h3>

              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setSelectedStocktake(null)}
              >
                ✕
              </button>
            </div>

            <p>
              <strong>Kho:</strong>{" "}
              {getBranchLabel(selectedStocktake.branchId)}
            </p>

            <p>
              <strong>Ngày tạo:</strong>{" "}
              {formatDate(selectedStocktake.createdAt)}
            </p>

            <p>
              <strong>Ngày hoàn tất:</strong>{" "}
              {formatDate(selectedStocktake.completedAt)}
            </p>

            <p>
              <strong>Trạng thái:</strong>{" "}
              {getStatusLabel(selectedStocktake.status)}
            </p>

            <p>
              <strong>Ghi chú:</strong>{" "}
              {selectedStocktake.note || "Không có"}
            </p>

            <h4>Chi tiết số lượng</h4>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>SKU</th>
                    <th style={styles.th}>Tồn hệ thống</th>
                    <th style={styles.th}>Số thực tế</th>
                    <th style={styles.th}>Chênh lệch</th>
                  </tr>
                </thead>

                <tbody>
                  {detailItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={styles.empty}>
                        Phiếu chưa có chi tiết số lượng.
                      </td>
                    </tr>
                  ) : (
                    detailItems.map((item, index) => {
                      const sku = skus.find(
                        (entry) =>
                          String(entry.id) === String(item.skuId)
                      );

                      return (
                        <tr key={item.id || index}>
                          <td style={styles.td}>
                            {getSkuName(sku || { id: item.skuId })}
                          </td>

                          <td style={styles.td}>
                            {formatNumber(
                              item.systemQty ?? item.systemQuantity
                            )}
                          </td>

                          <td style={styles.td}>
                            {formatNumber(
                              item.actualQty ?? item.actualQuantity
                            )}
                          </td>

                          <td style={styles.td}>
                            {formatNumber(
                              item.differenceQty ?? item.difference
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    padding: "24px",
    boxSizing: "border-box",
    color: "#1f2937",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "22px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#172033",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },
  card: {
    minWidth: 0,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,.04)",
  },
  heading: {
    margin: "0 0 14px",
    fontSize: "17px",
    color: "#172033",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%,220px),1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    width: "100%",
    minHeight: "40px",
    padding: "9px 11px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
    background: "#fff",
    fontSize: "14px",
  },
  helperText: {
    color: "#9ca3af",
    fontSize: "11px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%,160px),1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
    color: "#6b7280",
    fontSize: "13px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "10px",
    fontSize: "13px",
  },
  progressTrack: {
    width: "100%",
    height: "9px",
    borderRadius: "20px",
    background: "#e5e7eb",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "20px",
    background: "#2563eb",
    transition: "width .2s ease",
  },
  progressFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "9px",
    color: "#6b7280",
    fontSize: "12px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  readOnly: {
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "750px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "left",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    verticalAlign: "middle",
  },
  countInput: {
    width: "120px",
    maxWidth: "100%",
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  summary: {
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    marginTop: "14px",
    fontSize: "13px",
    color: "#4b5563",
  },
  empty: {
    padding: "28px",
    textAlign: "center",
    color: "#9ca3af",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  primaryButton: {
    minHeight: "40px",
    padding: "10px 15px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: "40px",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  confirmButton: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#15803d",
    color: "#fff",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "8px 10px",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    background: "#fff",
    color: "#dc2626",
    cursor: "pointer",
  },
  status: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  rowActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "16px",
    fontSize: "13px",
  },
  notice: {
    marginTop: "16px",
    padding: "12px 14px",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    background: "#eff6ff",
    color: "#1e40af",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  error: {
    padding: "12px 14px",
    marginBottom: "16px",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  success: {
    padding: "12px 14px",
    marginBottom: "16px",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "rgba(0,0,0,.45)",
  },
  modal: {
    width: "100%",
    maxWidth: "800px",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "22px",
    background: "#fff",
    borderRadius: "10px",
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
  },
};

export default StocktakePage;
