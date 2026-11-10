
import { useMemo, useState } from "react";
import "./WarehousePage.css";

const initialWarehouses = [
  {
    id: 1,
    code: "WH-HCM-01",
    name: "Kho trung tâm TP.HCM",
    address: "Quận 7, TP. Hồ Chí Minh",
    manager: "Nguyễn Văn An",
    phone: "0901234567",
    status: "Đang hoạt động",
  },
  {
    id: 2,
    code: "WH-HN-01",
    name: "Kho Hà Nội",
    address: "Cầu Giấy, Hà Nội",
    manager: "Trần Minh Tuấn",
    phone: "0912345678",
    status: "Đang hoạt động",
  },
  {
    id: 3,
    code: "WH-DN-01",
    name: "Kho Đà Nẵng",
    address: "Hải Châu, Đà Nẵng",
    manager: "Lê Hoàng Nam",
    phone: "0923456789",
    status: "Đang hoạt động",
  },
  {
    id: 4,
    code: "WH-CT-01",
    name: "Kho Cần Thơ",
    address: "Ninh Kiều, Cần Thơ",
    manager: "Phạm Quốc Bảo",
    phone: "0934567890",
    status: "Ngừng hoạt động",
  },
];

const emptyForm = {
  code: "",
  name: "",
  address: "",
  manager: "",
  phone: "",
  status: "Đang hoạt động",
};

function WarehousePage() {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const stats = useMemo(
    () => ({
      total: warehouses.length,
      active: warehouses.filter(
        (item) => item.status === "Đang hoạt động"
      ).length,
      inactive: warehouses.filter(
        (item) => item.status === "Ngừng hoạt động"
      ).length,
    }),
    [warehouses]
  );

  const filteredWarehouses = warehouses.filter((item) => {
    const searchText = keyword.trim().toLowerCase();

    const matchesKeyword =
      item.code.toLowerCase().includes(searchText) ||
      item.name.toLowerCase().includes(searchText) ||
      item.address.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "Tất cả" || item.status === statusFilter;

    return matchesKeyword && matchesStatus;
  });

  const openAddModal = () => {
    setForm({ ...emptyForm });
    setError("");
    setModal({ type: "add" });
  };

  const openEditModal = (warehouse) => {
    setForm({ ...warehouse });
    setError("");
    setModal({ type: "edit", warehouse });
  };

  const openDetailModal = (warehouse) => {
    setModal({ type: "detail", warehouse });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.address.trim() ||
      !form.manager.trim() ||
      !form.phone.trim()
    ) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const duplicateCode = warehouses.some(
      (item) =>
        item.code.toLowerCase() === form.code.trim().toLowerCase() &&
        item.id !== modal?.warehouse?.id
    );

    if (duplicateCode) {
      setError("Mã kho đã tồn tại. Vui lòng nhập mã khác.");
      return;
    }

    if (modal.type === "add") {
      setWarehouses((prev) => [
        ...prev,
        {
          ...form,
          id: Date.now(),
          code: form.code.trim(),
          name: form.name.trim(),
          address: form.address.trim(),
          manager: form.manager.trim(),
          phone: form.phone.trim(),
        },
      ]);
    } else {
      setWarehouses((prev) =>
        prev.map((item) =>
          item.id === modal.warehouse.id
            ? {
                ...form,
                id: item.id,
                code: form.code.trim(),
                name: form.name.trim(),
                address: form.address.trim(),
                manager: form.manager.trim(),
                phone: form.phone.trim(),
              }
            : item
        )
      );
    }

    setModal(null);
  };

  const handleDelete = (warehouse) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${warehouse.name}" không?`
    );

    if (confirmed) {
      setWarehouses((prev) =>
        prev.filter((item) => item.id !== warehouse.id)
      );
      setModal(null);
    }
  };

  return (
    <div className="warehouse-page">
      <main className="warehouse-main">
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
          >
            + Thêm kho mới
          </button>
        </header>

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

          <div className="warehouse-table-wrapper">
            <table className="warehouse-table">
              <thead>
                <tr>
                  <th>Mã kho</th>
                  <th>Tên kho</th>
                  <th>Địa chỉ</th>
                  <th>Người phụ trách</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredWarehouses.length > 0 ? (
                  filteredWarehouses.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td className="warehouse-code">
                        {warehouse.code}
                      </td>
                      <td>{warehouse.name}</td>
                      <td>{warehouse.address}</td>
                      <td>{warehouse.manager}</td>
                      <td>{warehouse.phone}</td>
                      <td>
                        <span
                          className={`warehouse-status ${
                            warehouse.status === "Đang hoạt động"
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
                            title="Xem chi tiết"
                            onClick={() =>
                              openDetailModal(warehouse)
                            }
                          >
                            Xem
                          </button>

                          <button
                            title="Chỉnh sửa"
                            onClick={() =>
                              openEditModal(warehouse)
                            }
                          >
                            Sửa
                          </button>

                          <button
                            className="delete"
                            title="Xóa kho"
                            onClick={() =>
                              handleDelete(warehouse)
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="warehouse-no-data">
                      Không tìm thấy kho hàng phù hợp.
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

      {modal && (
        <div className="warehouse-modal-overlay">
          <div className="warehouse-modal">
            {modal.type === "detail" ? (
              <>
                <div className="warehouse-modal-header">
                  <div>
                    <h2>Chi tiết kho hàng</h2>
                    <p>Thông tin chi tiết của kho được chọn.</p>
                  </div>

                  <button
                    className="warehouse-close"
                    onClick={() => setModal(null)}
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
                    <strong>{modal.warehouse.address}</strong>
                  </div>
                  <div>
                    <span>Người phụ trách</span>
                    <strong>{modal.warehouse.manager}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>{modal.warehouse.phone}</strong>
                  </div>
                  <div>
                    <span>Trạng thái</span>
                    <strong>{modal.warehouse.status}</strong>
                  </div>
                </div>

                <div className="warehouse-modal-actions">
                  <button
                    className="warehouse-secondary-btn"
                    onClick={() => setModal(null)}
                  >
                    Đóng
                  </button>

                  <button
                    className="warehouse-add-btn"
                    onClick={() =>
                      openEditModal(modal.warehouse)
                    }
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="warehouse-modal-header">
                  <div>
                    <h2>
                      {modal.type === "add"
                        ? "Thêm kho mới"
                        : "Chỉnh sửa kho"}
                    </h2>
                    <p>Nhập thông tin chi nhánh và kho hàng.</p>
                  </div>

                  <button
                    type="button"
                    className="warehouse-close"
                    onClick={() => setModal(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="warehouse-form-grid">
                  <label>
                    Mã kho
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="VD: WH-HCM-02"
                    />
                  </label>

                  <label>
                    Tên kho
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Nhập tên kho"
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

                  <label>
                    Người phụ trách
                    <input
                      name="manager"
                      value={form.manager}
                      onChange={handleFormChange}
                      placeholder="Họ và tên"
                    />
                  </label>

                  <label>
                    Số điện thoại
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="Nhập số điện thoại"
                    />
                  </label>

                  <label className="full">
                    Trạng thái
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                    >
                      <option value="Đang hoạt động">
                        Đang hoạt động
                      </option>
                      <option value="Ngừng hoạt động">
                        Ngừng hoạt động
                      </option>
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
                    onClick={() => setModal(null)}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="warehouse-add-btn"
                  >
                    {modal.type === "add"
                      ? "Thêm kho"
                      : "Lưu thay đổi"}
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
