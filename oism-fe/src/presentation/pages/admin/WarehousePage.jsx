
import { useCallback, useEffect, useMemo, useState } from "react";
import "@/presentation/styles/WarehousePage.css";
import inventoryApi from "@/infrastructure/api/inventoryApi";

const emptyForm = {
  code: "",
  name: "",
  address: "",
  type: "WAREHOUSE",
};

function WarehousePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // ==========================================
  // 1. LẤY DANH SÁCH CHI NHÁNH VÀ KHO
  // ==========================================

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setApiError("");

      const response = await inventoryApi.getBranches();

      const warehouseData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const formattedWarehouses = warehouseData.map((item) => ({
        id: item.id,
        code: item.code || "",
        name: item.name || "",
        address: item.address || "",
        type: item.type || "WAREHOUSE",
        active: Boolean(item.active),
        status: item.active
          ? "Đang hoạt động"
          : "Ngừng hoạt động",
      }));

      setWarehouses(formattedWarehouses);
    } catch (err) {
      console.error("Lỗi lấy danh sách chi nhánh và kho:", err);

      setApiError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Không thể tải danh sách chi nhánh và kho. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // ==========================================
  // 2. THỐNG KÊ KHO
  // ==========================================

  const stats = useMemo(
    () => ({
      total: warehouses.length,
      active: warehouses.filter((item) => item.active).length,
      inactive: warehouses.filter((item) => !item.active).length,
    }),
    [warehouses]
  );

  // ==========================================
  // 3. TÌM KIẾM VÀ LỌC
  // ==========================================

  const filteredWarehouses = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    return warehouses.filter((item) => {
      const matchesKeyword =
        item.code.toLowerCase().includes(searchText) ||
        item.name.toLowerCase().includes(searchText) ||
        item.address.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "Tất cả" ||
        item.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [warehouses, keyword, statusFilter]);

  // ==========================================
  // 4. QUẢN LÝ MODAL
  // ==========================================

  const openAddModal = () => {
    setForm({ ...emptyForm });
    setError("");
    setModal({ type: "add" });
  };

  const openDetailModal = (warehouse) => {
    setModal({
      type: "detail",
      warehouse,
    });
  };

  const closeModal = () => {
    setModal(null);
    setError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // 5. THÊM CHI NHÁNH / KHO
  // POST /api/branches
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const code = form.code.trim();
    const name = form.name.trim();
    const address = form.address.trim();

    if (!code || !name) {
      setError("Vui lòng nhập mã kho và tên kho.");
      return;
    }

    const duplicateCode = warehouses.some(
      (item) => item.code.toLowerCase() === code.toLowerCase()
    );

    if (duplicateCode) {
      setError("Mã kho đã tồn tại. Vui lòng nhập mã khác.");
      return;
    }

    const requestData = {
      code,
      name,
      address,
      type: form.type,
    };

    try {
      setSubmitting(true);

      await inventoryApi.createBranch(requestData);

      setModal(null);
      setForm({ ...emptyForm });

      await fetchWarehouses();
    } catch (err) {
      console.error("Lỗi thêm chi nhánh / kho:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Không thể thêm kho. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // 6. BẬT / TẮT TRẠNG THÁI KHO
  // PATCH /api/branches/{id}/active
  // ==========================================

  const handleToggleActive = async (warehouse) => {
    const nextActive = !warehouse.active;

    const confirmed = window.confirm(
      `Bạn có chắc muốn ${
        nextActive ? "kích hoạt" : "ngừng hoạt động"
      } "${warehouse.name}" không?`
    );

    if (!confirmed) return;

    try {
      setApiError("");

      await inventoryApi.toggleBranchActive(
        warehouse.id,
        nextActive
      );

      await fetchWarehouses();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái kho:", err);

      setApiError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Không thể cập nhật trạng thái kho."
      );
    }
  };

  // ==========================================
  // 7. GIAO DIỆN
  // ==========================================

  return (
    <div className="warehouse-page">
      <main className="warehouse-main">

        {/* HEADER */}
        <header className="warehouse-header">
          <div>
            <h1>Quản lý chi nhánh & kho</h1>
            <p>
              Quản lý thông tin và trạng thái các kho hàng trong hệ thống.
            </p>
          </div>

          <button
            className="warehouse-add-btn"
            onClick={openAddModal}
            disabled={loading}
          >
            + Thêm kho mới
          </button>
        </header>

        {/* THỐNG KÊ */}
        <section className="warehouse-stats">
          <div className="warehouse-stat-card">
            <span>Tổng số kho</span>
            <strong>{stats.total}</strong>
            <small>Tất cả kho trong hệ thống</small>
          </div>

          <div className="warehouse-stat-card">
            <span>Đang hoạt động</span>
            <strong className="warehouse-green">
              {stats.active}
            </strong>
            <small>Kho đang được sử dụng</small>
          </div>

          <div className="warehouse-stat-card">
            <span>Ngừng hoạt động</span>
            <strong className="warehouse-orange">
              {stats.inactive}
            </strong>
            <small>Kho đã tạm ngưng</small>
          </div>
        </section>

        {/* DANH SÁCH KHO */}
        <section className="warehouse-card">
          <div className="warehouse-toolbar">
            <div>
              <h2>Danh sách kho hàng</h2>
              <p>
                Thông tin các chi nhánh và kho đang quản lý.
              </p>
            </div>

            <div className="warehouse-filters">
              <input
                type="text"
                placeholder="Tìm mã kho, tên kho, địa chỉ..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Tất cả">Tất cả trạng thái</option>
                <option value="Đang hoạt động">
                  Đang hoạt động
                </option>
                <option value="Ngừng hoạt động">
                  Ngừng hoạt động
                </option>
              </select>
            </div>
          </div>

          {/* LỖI API */}
          {apiError && (
            <div className="warehouse-form-error">
              {apiError}

              <button
                type="button"
                onClick={fetchWarehouses}
                disabled={loading}
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="warehouse-table-wrapper">
            <table className="warehouse-table">
              <thead>
                <tr>
                  <th>Mã kho</th>
                  <th>Tên kho</th>
                  <th>Địa chỉ</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="warehouse-no-data"
                    >
                      Đang tải danh sách kho...
                    </td>
                  </tr>
                ) : apiError ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="warehouse-no-data"
                    >
                      Không thể tải dữ liệu từ máy chủ.
                    </td>
                  </tr>
                ) : filteredWarehouses.length > 0 ? (
                  filteredWarehouses.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td className="warehouse-code">
                        {warehouse.code}
                      </td>

                      <td>{warehouse.name}</td>

                      <td>{warehouse.address || "—"}</td>

                      <td>
                        {warehouse.type === "STORE"
                          ? "Chi nhánh"
                          : "Kho hàng"}
                      </td>

                      <td>
                        <span
                          className={`warehouse-status ${
                            warehouse.active
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {warehouse.status}
                        </span>
                      </td>

                      <td>
                        <div className="warehouse-row-actions">
                          <button
                            type="button"
                            title="Xem chi tiết"
                            onClick={() =>
                              openDetailModal(warehouse)
                            }
                          >
                            Xem
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(warehouse)
                            }
                          >
                            {warehouse.active
                              ? "Ngừng"
                              : "Kích hoạt"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="warehouse-no-data"
                    >
                      {keyword || statusFilter !== "Tất cả"
                        ? "Không tìm thấy kho hàng phù hợp."
                        : "Chưa có chi nhánh hoặc kho nào trong hệ thống."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="warehouse-table-footer">
            Hiển thị {filteredWarehouses.length} / {warehouses.length} kho
          </div>
        </section>
      </main>

      {/* MODAL */}
      {modal && (
        <div className="warehouse-modal-overlay">
          <div className="warehouse-modal">

            {/* MODAL CHI TIẾT */}
            {modal.type === "detail" ? (
              <>
                <div className="warehouse-modal-header">
                  <div>
                    <h2>Chi tiết kho hàng</h2>
                    <p>
                      Thông tin chi tiết của kho được chọn.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="warehouse-close"
                    onClick={closeModal}
                  >
                    ×
                  </button>
                </div>

                <div className="warehouse-detail-list">
                  <div>
                    <span>Mã kho</span>
                    <strong>{modal.warehouse.code}</strong>
                  </div>

                  <div>
                    <span>Tên kho</span>
                    <strong>{modal.warehouse.name}</strong>
                  </div>

                  <div>
                    <span>Địa chỉ</span>
                    <strong>
                      {modal.warehouse.address || "Chưa cập nhật"}
                    </strong>
                  </div>

                  <div>
                    <span>Loại</span>
                    <strong>
                      {modal.warehouse.type === "STORE"
                        ? "Chi nhánh"
                        : "Kho hàng"}
                    </strong>
                  </div>

                  <div>
                    <span>Trạng thái</span>
                    <strong>{modal.warehouse.status}</strong>
                  </div>
                </div>

                <div className="warehouse-modal-actions">
                  <button
                    type="button"
                    className="warehouse-secondary-btn"
                    onClick={closeModal}
                  >
                    Đóng
                  </button>
                </div>
              </>
            ) : (

              /* MODAL THÊM KHO */
              <form onSubmit={handleSubmit}>
                <div className="warehouse-modal-header">
                  <div>
                    <h2>Thêm kho mới</h2>
                    <p>
                      Nhập thông tin chi nhánh và kho hàng.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="warehouse-close"
                    onClick={closeModal}
                  >
                    ×
                  </button>
                </div>

                <div className="warehouse-form-grid">
                  <label>
                    Mã kho *
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="VD: WH-HCM-02"
                      required
                    />
                  </label>

                  <label>
                    Tên kho *
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Nhập tên kho"
                      required
                    />
                  </label>

                  <label className="full">
                    Địa chỉ
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      placeholder="Nhập địa chỉ kho"
                    />
                  </label>

                  <label className="full">
                    Loại chi nhánh / kho
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleFormChange}
                    >
                      <option value="WAREHOUSE">Kho hàng</option>
                      <option value="STORE">Chi nhánh</option>
                    </select>
                  </label>
                </div>

                {error && (
                  <div className="warehouse-form-error">
                    {error}
                  </div>
                )}

                <div className="warehouse-modal-actions">
                  <button
                    type="button"
                    className="warehouse-secondary-btn"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="warehouse-add-btn"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang xử lý..."
                      : "Thêm kho"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WarehousePage;
