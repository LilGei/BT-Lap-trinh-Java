import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryApi from "@/infrastructure/api/inventoryApi";
import { productApi, extractList } from "@/infrastructure/api/productApi";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Đã xảy ra lỗi. Vui lòng thử lại.";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " đ";

const getSkuLabel = (sku) =>
  sku?.skuCode || sku?.code || sku?.sku || sku?.name || sku?.id || "SKU";

const getBranchLabel = (branch) =>
  branch?.name || branch?.code || branch?.id || "Chi nhánh";

const getSupplierLabel = (supplier) =>
  supplier?.name || supplier?.code || supplier?.id || "Nhà cung cấp";

const getReceiptDate = (receipt) => {
  const value = receipt?.receiptDate || receipt?.createdAt;
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("vi-VN");
};

const getReceiptTotal = (receipt) =>
  receipt?.totalAmount ?? receipt?.total ?? 0;

const getStatusLabel = (status) => {
  const labels = {
    DRAFT: "Đang soạn",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy",
  };

  return labels[status] || status || "Không xác định";
};

const getStatusStyle = (status) => {
  const styles = {
    CONFIRMED: { color: "#15803d", background: "#dcfce7" },
    CANCELLED: { color: "#b91c1c", background: "#fee2e2" },
    DRAFT: { color: "#a16207", background: "#fef9c3" },
  };

  return styles[status] || styles.DRAFT;
};

function ImportPage() {
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [skus, setSkus] = useState([]);
  const [receipts, setReceipts] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      inventoryApi.getBranches(),
      inventoryApi.getSuppliers(),
      productApi.getSkus(),
      inventoryApi.getPurchaseReceipts({
        page: 0,
        size: 20,
      }),
    ]);

    const [branchResult, supplierResult, skuResult, receiptResult] =
      results;

    const errors = [];

    if (branchResult.status === "fulfilled") {
      const list = extractList(branchResult.value).filter(
        (branch) => branch.active !== false
      );

      setBranches(list);
      setBranchId((current) =>
        list.some((branch) => String(branch.id) === String(current))
          ? current
          : list[0]?.id || ""
      );
    } else {
      setBranches([]);
      setBranchId("");
      errors.push(
        "Chi nhánh/kho: " + getErrorMessage(branchResult.reason)
      );
    }

    if (supplierResult.status === "fulfilled") {
      const list = extractList(supplierResult.value).filter(
        (supplier) => supplier.active !== false
      );

      setSuppliers(list);
      setSupplierId((current) =>
        list.some((supplier) => String(supplier.id) === String(current))
          ? current
          : list[0]?.id || ""
      );
    } else {
      setSuppliers([]);
      setSupplierId("");
      errors.push(
        "Nhà cung cấp: " + getErrorMessage(supplierResult.reason)
      );
    }

    if (skuResult.status === "fulfilled") {
      const list = extractList(skuResult.value);

      setSkus(list);
      setSkuId((current) =>
        list.some((sku) => String(sku.id) === String(current))
          ? current
          : list[0]?.id || ""
      );
    } else {
      setSkus([]);
      setSkuId("");
      errors.push("SKU: " + getErrorMessage(skuResult.reason));
    }

    if (receiptResult.status === "fulfilled") {
      setReceipts(extractList(receiptResult.value));
    } else {
      setReceipts([]);
      errors.push(
        "Lịch sử phiếu nhập: " + getErrorMessage(receiptResult.reason)
      );
    }

    setError(errors.join(" | "));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0
      ),
    [items]
  );

  const handleAddItem = () => {
    setError("");
    setSuccess("");

    const selectedSku = skus.find(
      (sku) => String(sku.id) === String(skuId)
    );

    const qty = Number(quantity);
    const price = Number(unitPrice);

    if (!selectedSku) {
      setError("Vui lòng chọn SKU.");
      return;
    }

    if (!quantity || !Number.isFinite(qty) || qty <= 0) {
      setError("Số lượng phải lớn hơn 0.");
      return;
    }

    if (!unitPrice || !Number.isFinite(price) || price <= 0) {
      setError("Đơn giá phải lớn hơn 0.");
      return;
    }

    const newItem = {
      localId: `${Date.now()}-${Math.random()}`,
      skuId: selectedSku.id,
      skuCode: getSkuLabel(selectedSku),
      quantity: qty,
      unitPrice: price,
    };

    setItems((current) => [...current, newItem]);
    setQuantity("");
    setUnitPrice("");
  };

  const handleRemoveItem = (localId) => {
    setItems((current) =>
      current.filter((item) => item.localId !== localId)
    );
  };

  const handleCreateReceipt = async () => {
    setError("");
    setSuccess("");

    if (!branchId) {
      setError("Vui lòng chọn kho nhập.");
      return;
    }

    if (!supplierId) {
      setError("Vui lòng chọn nhà cung cấp.");
      return;
    }

    if (items.length === 0) {
      setError("Phiếu nhập chưa có sản phẩm.");
      return;
    }

    /*
     * Payload tạm thời.
     * Cần đối chiếu ReceiptRequest trong DTO Backend
     * trước khi tích hợp chính thức.
     */
    const payload = {
      branchId,
      supplierId,
      code: `PN${Date.now()}`,
      note: note.trim(),
      items: items.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    setSaving(true);

    try {
      await inventoryApi.createPurchaseReceipt(payload);

      setSuccess("Tạo phiếu nhập thành công.");
      setItems([]);
      setNote("");

      await loadData();
    } catch (err) {
      setError(
        "Không thể tạo phiếu nhập: " + getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewReceipt = async (id) => {
    setError("");

    try {
      const receipt = await inventoryApi.getPurchaseReceiptById(id);
      setSelectedReceipt(receipt);
    } catch (err) {
      setError(
        "Không tải được chi tiết phiếu: " + getErrorMessage(err)
      );
    }
  };

  const handleReceiptAction = async (receipt, action) => {
    if (!receipt?.id) return;

    const actionLabel = action === "confirm" ? "xác nhận" : "hủy";

    const accepted = window.confirm(
      `Bạn có chắc chắn muốn ${actionLabel} phiếu ${
        receipt.code || ""
      }?`
    );

    if (!accepted) return;

    setError("");
    setSuccess("");
    setActionId(receipt.id);

    try {
      if (action === "confirm") {
        await inventoryApi.confirmPurchaseReceipt(receipt.id);
        setSuccess("Đã xác nhận phiếu nhập.");
      } else {
        await inventoryApi.cancelPurchaseReceipt(receipt.id);
        setSuccess("Đã hủy phiếu nhập.");
      }

      setSelectedReceipt(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const receiptItems =
    selectedReceipt?.items || selectedReceipt?.lines || [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Quản lý nhập hàng</h2>
          <p style={styles.subtitle}>
            Tạo và quản lý phiếu nhập hàng vào kho.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={styles.secondaryButton}
        >
          {loading ? "Đang tải..." : "↻ Làm mới"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Thông tin phiếu nhập</h3>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Kho nhập *</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              style={styles.input}
              disabled={loading}
            >
              <option value="">-- Chọn kho --</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {getBranchLabel(branch)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nhà cung cấp *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              style={styles.input}
              disabled={loading}
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {getSupplierLabel(supplier)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho phiếu nhập..."
              rows={3}
              style={styles.textarea}
            />
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Thêm sản phẩm nhập kho</h3>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>SKU *</label>
            <select
              value={skuId}
              onChange={(e) => setSkuId(e.target.value)}
              style={styles.input}
              disabled={loading}
            >
              <option value="">-- Chọn SKU --</option>
              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {getSkuLabel(sku)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Số lượng *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Nhập số lượng"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Đơn giá nhập (VNĐ) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="Nhập đơn giá"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>&nbsp;</label>
            <button
              type="button"
              onClick={handleAddItem}
              style={styles.primaryButton}
              disabled={loading}
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>
          Danh sách sản phẩm trong phiếu
        </h3>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>STT</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Số lượng</th>
                <th style={styles.th}>Đơn giá</th>
                <th style={styles.th}>Thành tiền</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    Chưa có sản phẩm trong phiếu nhập.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.localId}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{item.skuCode}</strong>
                    </td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.td}>
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td style={styles.td}>
                      {formatMoney(item.quantity * item.unitPrice)}
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.localId)}
                        style={styles.dangerButton}
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
          <span>Tổng tiền dự kiến:</span>
          <strong style={styles.totalValue}>
            {formatMoney(totalAmount)}
          </strong>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleCreateReceipt}
            disabled={
              saving ||
              loading ||
              items.length === 0 ||
              !branchId ||
              !supplierId
            }
            style={styles.primaryButton}
          >
            {saving ? "Đang lưu..." : "Lưu phiếu nhập"}
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.historyHeader}>
          <h3 style={styles.sectionTitle}>Lịch sử phiếu nhập</h3>
          <span style={styles.count}>{receipts.length} phiếu</span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mã phiếu</th>
                <th style={styles.th}>Ngày nhập</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Tổng tiền</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    Chưa có phiếu nhập nào.
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td style={styles.td}>
                      <strong>{receipt.code || "—"}</strong>
                    </td>
                    <td style={styles.td}>
                      {getReceiptDate(receipt)}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          ...getStatusStyle(receipt.status),
                        }}
                      >
                        {getStatusLabel(receipt.status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {formatMoney(getReceiptTotal(receipt))}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.rowActions}>
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(receipt.id)}
                          style={styles.secondaryButton}
                        >
                          Chi tiết
                        </button>

                        {receipt.status === "DRAFT" && (
                          <>
                            <button
                              type="button"
                              disabled={actionId === receipt.id}
                              onClick={() =>
                                handleReceiptAction(receipt, "confirm")
                              }
                              style={styles.confirmButton}
                            >
                              Xác nhận
                            </button>

                            <button
                              type="button"
                              disabled={actionId === receipt.id}
                              onClick={() =>
                                handleReceiptAction(receipt, "cancel")
                              }
                              style={styles.dangerButton}
                            >
                              Hủy
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
      </section>

      {selectedReceipt && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>
                Chi tiết phiếu {selectedReceipt.code || ""}
              </h3>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <p>
              <strong>Trạng thái:</strong>{" "}
              {getStatusLabel(selectedReceipt.status)}
            </p>

            <p>
              <strong>Ngày nhập:</strong>{" "}
              {getReceiptDate(selectedReceipt)}
            </p>

            <p>
              <strong>Ghi chú:</strong>{" "}
              {selectedReceipt.note || "Không có"}
            </p>

            <h4>Sản phẩm</h4>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>SKU</th>
                    <th style={styles.th}>Số lượng</th>
                    <th style={styles.th}>Đơn giá</th>
                  </tr>
                </thead>

                <tbody>
                  {receiptItems.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={styles.empty}>
                        Không có dữ liệu sản phẩm.
                      </td>
                    </tr>
                  ) : (
                    receiptItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td style={styles.td}>
                          {item.skuCode || item.skuId || "—"}
                        </td>
                        <td style={styles.td}>{item.quantity ?? "—"}</td>
                        <td style={styles.td}>
                          {formatMoney(item.unitPrice)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.totalRow}>
              <strong>Tổng tiền:</strong>
              <strong style={styles.totalValue}>
                {formatMoney(getReceiptTotal(selectedReceipt))}
              </strong>
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
    fontSize: "14px",
  },
  card: {
    minWidth: 0,
    padding: "20px",
    marginBottom: "20px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,.04)",
  },
  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "17px",
    fontWeight: 650,
    color: "#172033",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
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
    minHeight: "42px",
    padding: "9px 11px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "650px",
    borderCollapse: "collapse",
  },
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
    width: "100%",
    minHeight: "40px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    color: "#374151",
    padding: "9px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },
  confirmButton: {
    border: "none",
    borderRadius: "6px",
    background: "#15803d",
    color: "#fff",
    padding: "8px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "6px",
    background: "#fff",
    color: "#dc2626",
    padding: "8px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  totalRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid #e5e7eb",
    fontSize: "15px",
  },
  totalValue: {
    color: "#2563eb",
    fontSize: "18px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  count: {
    fontSize: "13px",
    color: "#6b7280",
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
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "750px",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "10px",
    padding: "22px",
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

export default ImportPage;
