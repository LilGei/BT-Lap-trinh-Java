import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryApi from "@/infrastructure/api/inventoryApi";
import { productApi, extractList } from "@/infrastructure/api/productApi";
import "@/presentation/styles/TransferPage.css";

const PAGE_SIZE = 20;

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
  "Đã xảy ra lỗi. Vui lòng thử lại.";

const getBranchName = (branch) =>
  branch?.name || branch?.code || branch?.id || "Chi nhánh";

const getSkuName = (sku) =>
  sku?.skuCode ||
  sku?.code ||
  sku?.sku ||
  sku?.name ||
  sku?.id ||
  "SKU";

const STATUS_LABELS = {
  DRAFT: "Chờ xuất hàng",
  IN_TRANSIT: "Đang vận chuyển",
  RECEIVED: "Đã nhận hàng",
  CANCELLED: "Đã hủy",
};

const STATUS_CLASS = {
  DRAFT: "transfer-status-draft",
  IN_TRANSIT: "transfer-status-transit",
  RECEIVED: "transfer-status-received",
  CANCELLED: "transfer-status-cancelled",
};

function TransferPage() {
  const [branches, setBranches] = useState([]);
  const [skus, setSkus] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const [draftItems, setDraftItems] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      inventoryApi.getBranches(),
      productApi.getSkus(),
      inventoryApi.getTransfers({ page: 0, size: PAGE_SIZE }),
    ]);

    const [branchResult, skuResult, transferResult] = results;

    if (branchResult.status === "fulfilled") {
      const list = extractList(branchResult.value).filter(
        (branch) => branch.active !== false
      );

      setBranches(list);

      setFromBranchId((current) =>
        list.some((item) => String(item.id) === String(current))
          ? current
          : list[0]?.id || ""
      );

      setToBranchId((current) =>
        list.some((item) => String(item.id) === String(current))
          ? current
          : list.find(
              (item) => String(item.id) !== String(list[0]?.id)
            )?.id || ""
      );
    } else {
      setBranches([]);
      setError(
        "Không tải được danh sách kho: " +
        getErrorMessage(branchResult.reason)
      );
    }

    if (skuResult.status === "fulfilled") {
      const list = extractList(skuResult.value);
      setSkus(list);

      setSkuId((current) =>
        list.some((item) => String(item.id) === String(current))
          ? current
          : list[0]?.id || ""
      );
    } else {
      setSkus([]);
      setError((current) =>
        current ||
        "Không tải được danh sách SKU: " +
        getErrorMessage(skuResult.reason)
      );
    }

    if (transferResult.status === "fulfilled") {
      setTransfers(extractList(transferResult.value));
    } else {
      setTransfers([]);
      setError((current) =>
        current ||
        "Không tải được lịch sử chuyển kho: " +
        getErrorMessage(transferResult.reason)
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // DRAFT ITEMS
  // ==========================================

  const totalQuantity = useMemo(
    () =>
      draftItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [draftItems]
  );

  const handleAddItem = () => {
    setError("");
    setSuccess("");

    const sku = skus.find(
      (item) => String(item.id) === String(skuId)
    );

    const qty = Number(quantity);

    if (!sku) {
      setError("Vui lòng chọn SKU.");
      return;
    }

    if (
      quantity.trim() === "" ||
      !Number.isFinite(qty) ||
      qty <= 0
    ) {
      setError("Số lượng phải là số lớn hơn 0.");
      return;
    }

    setDraftItems((current) => {
      const existing = current.find(
        (item) => String(item.skuId) === String(sku.id)
      );

      if (existing) {
        return current.map((item) =>
          String(item.skuId) === String(sku.id)
            ? {
                ...item,
                quantity: Number(item.quantity) + qty,
              }
            : item
        );
      }

      return [
        ...current,
        {
          localId: `${sku.id}-${Date.now()}`,
          skuId: sku.id,
          skuCode: getSkuName(sku),
          productName: sku.productName || sku.name || "",
          quantity: qty,
        },
      ];
    });

    setQuantity("");
  };

  const handleRemoveItem = (localId) => {
    setDraftItems((current) =>
      current.filter((item) => item.localId !== localId)
    );
  };

  const handleClearDraft = () => {
    setDraftItems([]);
    setNote("");
    setSuccess("Đã xóa danh sách sản phẩm đang soạn.");
    setError("");
  };

  // ==========================================
  // CREATE TRANSFER
  // ==========================================

  const handleCreateTransfer = async () => {
    setError("");
    setSuccess("");

    if (!fromBranchId || !toBranchId) {
      setError("Vui lòng chọn kho gửi và kho nhận.");
      return;
    }

    if (String(fromBranchId) === String(toBranchId)) {
      setError("Kho gửi và kho nhận phải khác nhau.");
      return;
    }

    if (draftItems.length === 0) {
      setError("Phiếu chuyển chưa có sản phẩm.");
      return;
    }

    if (
      draftItems.some(
        (item) =>
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0
      )
    ) {
      setError("Có sản phẩm có số lượng không hợp lệ.");
      return;
    }

    /*
     * PAYLOAD TẠM THỜI:
     * Cần xác nhận chính xác TransferRequest trong Backend.
     * Không xem request thành công nếu Backend chưa xác nhận DTO.
     */
    const payload = {
      fromBranchId,
      toBranchId,
      note: note.trim(),
      items: draftItems.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity,
      })),
    };

    setSaving(true);

    try {
      await inventoryApi.createTransfer(payload);

      setSuccess("Tạo phiếu chuyển kho thành công.");
      setDraftItems([]);
      setNote("");

      await loadData();
    } catch (err) {
      setError(
        "Không thể tạo phiếu chuyển: " + getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TRANSFER ACTIONS
  // ==========================================

  const handleTransferAction = async (transfer, action) => {
    if (!transfer?.id || actionId) return;

    const allowedActions = {
      ship: {
        status: "DRAFT",
        label: "xuất hàng",
        api: inventoryApi.shipTransfer,
        success: "Đã xác nhận xuất hàng.",
      },
      receive: {
        status: "IN_TRANSIT",
        label: "nhận hàng",
        api: inventoryApi.receiveTransfer,
        success: "Đã xác nhận nhận hàng.",
      },
      cancel: {
        status: "DRAFT",
        label: "hủy phiếu",
        api: inventoryApi.cancelTransfer,
        success: "Đã hủy phiếu chuyển.",
      },
    };

    const config = allowedActions[action];

    if (!config || transfer.status !== config.status) {
      setError("Trạng thái phiếu không cho phép thực hiện thao tác này.");
      return;
    }

    const accepted = window.confirm(
      `Bạn có chắc chắn muốn ${config.label} phiếu ${transfer.code || ""}?`
    );

    if (!accepted) return;

    setError("");
    setSuccess("");
    setActionId(transfer.id);

    try {
      await config.api(transfer.id);

      setSuccess(config.success);
      setSelectedTransfer(null);

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  // ==========================================
  // DETAIL
  // ==========================================

  const handleViewDetail = async (id) => {
    setError("");
    setDetailLoading(true);

    try {
      const result = await inventoryApi.getTransferById(id);
      setSelectedTransfer(result?.data ?? result);
    } catch (err) {
      setError(
        "Không tải được chi tiết phiếu: " + getErrorMessage(err)
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  const getBranchDisplay = (id) => {
    const branch = branches.find(
      (item) => String(item.id) === String(id)
    );

    return branch ? getBranchName(branch) : id || "—";
  };

  const getSkuDisplay = (id) => {
    const sku = skus.find(
      (item) => String(item.id) === String(id)
    );

    return sku ? getSkuName(sku) : id || "—";
  };

  const getFromBranch = (transfer) =>
    transfer.fromBranchId || transfer.fromBranch?.id;

  const getToBranch = (transfer) =>
    transfer.toBranchId || transfer.toBranch?.id;

  const getItems = (transfer) =>
    transfer?.items || transfer?.lines || [];

  const filteredTransfers = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const matchesSearch =
        !search ||
        String(transfer.code || "").toLowerCase().includes(search) ||
        getBranchDisplay(getFromBranch(transfer))
          .toLowerCase()
          .includes(search) ||
        getBranchDisplay(getToBranch(transfer))
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        transfer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transfers, keyword, statusFilter, branches]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Quản lý chuyển kho</h2>
          <p style={styles.subtitle}>
            Tạo phiếu, xuất hàng và xác nhận nhận hàng giữa các kho.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadData}
          disabled={loading}
        >
          ↻ Làm mới
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* CREATE FORM */}

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Thông tin chuyển kho</h3>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Kho gửi *</label>
            <select
              value={fromBranchId}
              onChange={(event) => setFromBranchId(event.target.value)}
              style={styles.input}
              disabled={loading || saving}
            >
              <option value="">-- Chọn kho gửi --</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {getBranchName(branch)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Kho nhận *</label>
            <select
              value={toBranchId}
              onChange={(event) => setToBranchId(event.target.value)}
              style={styles.input}
              disabled={loading || saving}
            >
              <option value="">-- Chọn kho nhận --</option>
              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  disabled={String(branch.id) === String(fromBranchId)}
                >
                  {getBranchName(branch)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Ghi chú</label>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú cho phiếu chuyển kho..."
              style={styles.textarea}
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {/* ADD SKU */}

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Thêm sản phẩm chuyển kho</h3>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>SKU *</label>
            <select
              value={skuId}
              onChange={(event) => setSkuId(event.target.value)}
              style={styles.input}
              disabled={loading || saving}
            >
              <option value="">-- Chọn SKU --</option>
              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {getSkuName(sku)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Số lượng *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Nhập số lượng"
              style={styles.input}
              disabled={saving}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>&nbsp;</label>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={handleAddItem}
              disabled={loading || saving || skus.length === 0}
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>
      </section>

      {/* DRAFT ITEMS */}

      <section style={styles.card}>
        <div style={styles.historyHeader}>
          <h3 style={styles.sectionTitle}>Danh sách sản phẩm chuyển</h3>
          <span style={styles.count}>
            {draftItems.length} SKU
          </span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>STT</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Tên sản phẩm</th>
                <th style={styles.th}>Số lượng</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {draftItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    Chưa có sản phẩm trong phiếu chuyển.
                  </td>
                </tr>
              ) : (
                draftItems.map((item, index) => (
                  <tr key={item.localId}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{item.skuCode}</strong>
                    </td>
                    <td style={styles.td}>
                      {item.productName || "—"}
                    </td>
                    <td style={styles.td}>
                      {formatNumber(item.quantity)}
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.dangerButton}
                        onClick={() => handleRemoveItem(item.localId)}
                        disabled={saving}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.totalRow}>
          <span>Tổng số lượng:</span>
          <strong>{formatNumber(totalQuantity)}</strong>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleClearDraft}
            disabled={saving || draftItems.length === 0}
          >
            Xóa bản nháp
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={handleCreateTransfer}
            disabled={
              saving ||
              loading ||
              draftItems.length === 0 ||
              !fromBranchId ||
              !toBranchId ||
              String(fromBranchId) === String(toBranchId)
            }
          >
            {saving ? "Đang tạo..." : "Tạo phiếu chuyển"}
          </button>
        </div>
      </section>

      {/* HISTORY */}

      <section style={styles.card}>
        <div style={styles.historyHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Lịch sử chuyển kho</h3>
            <span style={styles.count}>
              {filteredTransfers.length} phiếu trong kết quả hiện tại
            </span>
          </div>
        </div>

        <div style={styles.filterGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Tìm phiếu</label>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Mã phiếu hoặc tên kho..."
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={styles.input}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Chờ xuất hàng</option>
              <option value="IN_TRANSIT">Đang vận chuyển</option>
              <option value="RECEIVED">Đã nhận hàng</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mã phiếu</th>
                <th style={styles.th}>Kho gửi</th>
                <th style={styles.th}>Kho nhận</th>
                <th style={styles.th}>Ngày tạo</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    Không tìm thấy phiếu chuyển kho.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td style={styles.td}>
                      <strong>{transfer.code || "—"}</strong>
                    </td>
                    <td style={styles.td}>
                      {getBranchDisplay(getFromBranch(transfer))}
                    </td>
                    <td style={styles.td}>
                      {getBranchDisplay(getToBranch(transfer))}
                    </td>
                    <td style={styles.td}>
                      {formatDate(transfer.createdAt)}
                    </td>
                    <td style={styles.td}>
                      <span className={`transfer-status ${
                        STATUS_CLASS[transfer.status] || ""
                      }`}>
                        {STATUS_LABELS[transfer.status] ||
                          transfer.status ||
                          "Không xác định"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.rowActions}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => handleViewDetail(transfer.id)}
                          disabled={detailLoading}
                        >
                          Chi tiết
                        </button>

                        {transfer.status === "DRAFT" && (
                          <>
                            <button
                              type="button"
                              style={styles.confirmButton}
                              disabled={actionId === transfer.id}
                              onClick={() =>
                                handleTransferAction(transfer, "ship")
                              }
                            >
                              Xuất hàng
                            </button>

                            <button
                              type="button"
                              style={styles.dangerButton}
                              disabled={actionId === transfer.id}
                              onClick={() =>
                                handleTransferAction(transfer, "cancel")
                              }
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {transfer.status === "IN_TRANSIT" && (
                          <button
                            type="button"
                            style={styles.confirmButton}
                            disabled={actionId === transfer.id}
                            onClick={() =>
                              handleTransferAction(transfer, "receive")
                            }
                          >
                            Xác nhận nhận
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DETAIL MODAL */}

      {selectedTransfer && (
        <div
          style={styles.overlay}
          onClick={() => setSelectedTransfer(null)}
        >
          <div
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>
                Chi tiết phiếu {selectedTransfer.code || ""}
              </h3>

              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setSelectedTransfer(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.detailGrid}>
              <p>
                <strong>Kho gửi:</strong>{" "}
                {getBranchDisplay(getFromBranch(selectedTransfer))}
              </p>
              <p>
                <strong>Kho nhận:</strong>{" "}
                {getBranchDisplay(getToBranch(selectedTransfer))}
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                {STATUS_LABELS[selectedTransfer.status] ||
                  selectedTransfer.status}
              </p>
              <p>
                <strong>Ngày tạo:</strong>{" "}
                {formatDate(selectedTransfer.createdAt)}
              </p>
              <p>
                <strong>Ngày xuất:</strong>{" "}
                {formatDate(selectedTransfer.shippedAt)}
              </p>
              <p>
                <strong>Ngày nhận:</strong>{" "}
                {formatDate(selectedTransfer.receivedAt)}
              </p>
              <p style={{ gridColumn: "1 / -1" }}>
                <strong>Ghi chú:</strong>{" "}
                {selectedTransfer.note || "Không có"}
              </p>
            </div>

            <h4>Sản phẩm trong phiếu</h4>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>STT</th>
                    <th style={styles.th}>SKU</th>
                    <th style={styles.th}>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {getItems(selectedTransfer).length === 0 ? (
                    <tr>
                      <td colSpan="3" style={styles.empty}>
                        Phiếu chưa có chi tiết sản phẩm.
                      </td>
                    </tr>
                  ) : (
                    getItems(selectedTransfer).map((item, index) => (
                      <tr key={item.id || index}>
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.td}>
                          {getSkuDisplay(item.skuId)}
                        </td>
                        <td style={styles.td}>
                          {formatNumber(item.quantity)}
                        </td>
                      </tr>
                    ))
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
  title: { margin: 0, fontSize: "24px", fontWeight: 700 },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: "14px" },
  card: {
    padding: "20px",
    marginBottom: "20px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,.04)",
  },
  sectionTitle: { margin: "0 0 18px", fontSize: "17px", fontWeight: 650 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#374151" },
  input: {
    width: "100%",
    minHeight: "40px",
    padding: "9px 11px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  tableWrapper: { width: "100%", overflowX: "auto" },
  table: { width: "100%", minWidth: "680px", borderCollapse: "collapse" },
  th: {
    padding: "12px",
    textAlign: "left",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    verticalAlign: "middle",
  },
  empty: {
    padding: "28px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
  },
  primaryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    color: "#374151",
    fontSize: "13px",
    cursor: "pointer",
  },
  confirmButton: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#15803d",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "8px 10px",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    background: "#fff",
    color: "#dc2626",
    fontSize: "12px",
    cursor: "pointer",
  },
  totalRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "14px",
    marginTop: "14px",
    borderTop: "1px solid #e5e7eb",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  count: { color: "#6b7280", fontSize: "13px" },
  transferStatus: {},
  status: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  rowActions: { display: "flex", flexWrap: "wrap", gap: "6px" },
  error: {
    padding: "12px 14px",
    marginBottom: "16px",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
  },
  success: {
    padding: "12px 14px",
    marginBottom: "16px",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "14px",
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
    maxWidth: "760px",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "22px",
    boxSizing: "border-box",
    background: "#fff",
    borderRadius: "10px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "4px 16px",
  },
};

export default TransferPage;
