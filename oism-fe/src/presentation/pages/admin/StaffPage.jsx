import { useState, useEffect } from "react";
import { authApi } from "@/infrastructure/api/authApi";

const ROLE_LABELS = {
  OWNER: { label: "Chủ cửa hàng (Owner)", color: "#7c3aed", bg: "#f3e8ff" },
  ADMIN: { label: "Quản trị viên (Admin)", color: "#7c3aed", bg: "#f3e8ff" },
  STAFF: { label: "Nhân viên Kho / Vận hành", color: "#0284c7", bg: "#e0f2fe" },
  CASHIER: { label: "Thu ngân (POS)", color: "#059669", bg: "#d1fae5" },
};

const extractUsers = (res) => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const isUserActive = (staff) => {
  if (typeof staff.active === "boolean") return staff.active;
  if (typeof staff.enabled === "boolean") return staff.enabled;
  return (staff.status || "ACTIVE").toUpperCase() === "ACTIVE";
};

function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // State Modal tạo / sửa nhân viên
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "CASHIER",
    branch: "Chi nhánh Trung tâm (Q1)",
  });

  const loadStaffList = async () => {
    setLoading(true);
    try {
      const res = await authApi.getStaffList();
      setStaffList(extractUsers(res));
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffList();
  }, []);

  const filteredStaff = staffList.filter((item) => {
    const name = (item.fullName || "").toLowerCase();
    const uname = (item.username || "").toLowerCase();
    const mail = (item.email || "").toLowerCase();
    const kw = searchTerm.toLowerCase();

    const matchSearch =
      name.includes(kw) || uname.includes(kw) || mail.includes(kw);
    const itemRole = (item.role || "STAFF").toUpperCase();
    const matchRole = roleFilter === "ALL" || itemRole === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "CASHIER",
      branch: "Chi nhánh Trung tâm (Q1)",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || "",
      username: staff.username || "",
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      role: (staff.role || "CASHIER").toUpperCase(),
      branch: staff.branch || staff.branchName || "Chi nhánh Trung tâm (Q1)",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.username.trim()) {
      alert("Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập!");
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaff) {
        await authApi.updateStaff(editingStaff.id, {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          branch: formData.branch,
        });
      } else {
        await authApi.createStaff({
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: formData.role,
          branch: formData.branch,
        });
      }

      setIsModalOpen(false);
      setEditingStaff(null);
      await loadStaffList();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể lưu thông tin nhân viên!";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (staff) => {
    const active = isUserActive(staff);
    const actionLabel = active ? "khóa" : "mở khóa";
    if (
      !window.confirm(
        `Bạn chắc chắn muốn ${actionLabel} tài khoản "${staff.username}"?`
      )
    ) {
      return;
    }

    try {
      await authApi.toggleStaffStatus(staff.id);
      await loadStaffList();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật trạng thái tài khoản!";
      alert(msg);
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-header">
        <div>
          <h1>Quản lý Nhân viên & Phân quyền</h1>
          <p>
            Tạo tài khoản, phân vai trò (Owner / Staff / Cashier) và kiểm soát
            truy cập hệ thống
          </p>
        </div>
        <button
          type="button"
          className="btn-add-staff"
          onClick={openCreateModal}
        >
          + Tạo tài khoản nhân viên
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="staff-stats">
        <div className="stat-card">
          <span>Tổng nhân sự</span>
          <strong>{staffList.length}</strong>
        </div>
        <div className="stat-card">
          <span>Đang hoạt động</span>
          <strong className="text-green">
            {staffList.filter((s) => isUserActive(s)).length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Nhân viên Kho (Staff)</span>
          <strong>
            {
              staffList.filter(
                (s) => (s.role || "").toUpperCase() === "STAFF"
              ).length
            }
          </strong>
        </div>
        <div className="stat-card">
          <span>Thu ngân (Cashier)</span>
          <strong>
            {
              staffList.filter(
                (s) => (s.role || "").toUpperCase() === "CASHIER"
              ).length
            }
          </strong>
        </div>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="staff-toolbar">
        <input
          type="text"
          placeholder="Tìm theo họ tên, username hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="OWNER">Chủ cửa hàng (Owner)</option>
          <option value="STAFF">Nhân viên Kho (Staff)</option>
          <option value="CASHIER">Thu ngân (Cashier)</option>
        </select>
      </div>

      {/* Bảng danh sách */}
      <div className="staff-table-card">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Tài khoản</th>
              <th>Liên hệ</th>
              <th>Vai trò (RBAC)</th>
              <th>Chi nhánh làm việc</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  Đang tải danh sách nhân viên...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  Không tìm thấy nhân viên nào.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => {
                const roleKey = (staff.role || "STAFF").toUpperCase();
                const roleMeta = ROLE_LABELS[roleKey] || ROLE_LABELS.STAFF;
                const active = isUserActive(staff);

                return (
                  <tr key={staff.id}>
                    <td>
                      <strong>{staff.fullName || staff.username}</strong>
                    </td>
                    <td>
                      <code>@{staff.username}</code>
                    </td>
                    <td>
                      <div>{staff.email || "—"}</div>
                      <small className="text-muted">{staff.phone || ""}</small>
                    </td>
                    <td>
                      <span
                        className="role-pill"
                        style={{
                          color: roleMeta.color,
                          background: roleMeta.bg,
                        }}
                      >
                        {roleMeta.label}
                      </span>
                    </td>
                    <td>{staff.branch || staff.branchName || "Toàn hệ thống"}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          active ? "active" : "locked"
                        }`}
                      >
                        {active ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="btn-sm edit"
                          onClick={() => openEditModal(staff)}
                        >
                          Phân quyền
                        </button>
                        {roleKey !== "OWNER" && roleKey !== "ADMIN" && (
                          <button
                            type="button"
                            className="btn-sm toggle"
                            onClick={() => toggleStatus(staff)}
                          >
                            {active ? "Khóa" : "Mở khóa"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tạo / Sửa phân quyền nhân viên */}
      {isModalOpen && (
        <div className="oism-modal-backdrop" onClick={closeModal}>
          <div className="oism-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="oism-modal-header">
              <h2>
                {editingStaff
                  ? `Cập nhật phân quyền: ${editingStaff.fullName || editingStaff.username}`
                  : "Tạo tài khoản nhân viên mới"}
              </h2>
              <button type="button" onClick={closeModal} disabled={submitting}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="oism-modal-form">
              <div className="form-grid">
                <label>
                  Họ và tên *
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="VD: Nguyễn Văn A"
                  />
                </label>

                <label>
                  Tên đăng nhập (Username) *
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingStaff) || submitting}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="VD: cashier_02"
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    disabled={submitting}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="nhanvien@oism.vn"
                  />
                </label>

                <label>
                  Số điện thoại
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="090xxxxxxx"
                  />
                </label>

                <label>
                  Vai trò phân quyền (Role) *
                  <select
                    disabled={submitting}
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="CASHIER">Thu ngân (Chỉ truy cập POS)</option>
                    <option value="STAFF">Nhân viên Kho & Đơn hàng</option>
                    <option value="OWNER">Chủ cửa hàng (Toàn quyền)</option>
                  </select>
                </label>

                <label>
                  Chi nhánh làm việc
                  <select
                    disabled={submitting}
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                  >
                    <option value="Chi nhánh Trung tâm (Q1)">
                      Chi nhánh Trung tâm (Q1)
                    </option>
                    <option value="Chi nhánh Quận 7">Chi nhánh Quận 7</option>
                    <option value="Kho Tổng Thủ Đức">Kho Tổng Thủ Đức</option>
                  </select>
                </label>
              </div>

              {!editingStaff && (
                <label className="full-width">
                  Mật khẩu khởi tạo *
                  <input
                    type="password"
                    required
                    minLength={6}
                    disabled={submitting}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </label>
              )}

              <div className="oism-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={submitting}
                >
                  {submitting
                    ? "Đang lưu..."
                    : editingStaff
                    ? "Lưu thay đổi"
                    : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .staff-page { padding: 24px; }
        .staff-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .staff-header h1 { margin: 0 0 4px; font-size: 22px; color: #0f172a; }
        .staff-header p { margin: 0; color: #64748b; font-size: 14px; }
        .btn-add-staff {
          background: #2563eb; color: #fff; border: none; padding: 10px 18px;
          border-radius: 8px; font-weight: 600; cursor: pointer;
        }
        .btn-add-staff:hover { background: #1d4ed8; }
        .staff-stats {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px; margin-bottom: 20px;
        }
        .stat-card {
          background: #fff; padding: 16px 20px; border-radius: 12px;
          border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 6px;
        }
        .stat-card span { font-size: 13px; color: #64748b; }
        .stat-card strong { font-size: 24px; color: #0f172a; }
        .stat-card .text-green { color: #16a34a; }
        .staff-toolbar {
          display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .staff-toolbar input {
          flex: 1; min-width: 240px; padding: 10px 14px; border-radius: 8px;
          border: 1px solid #cbd5e1; font-size: 14px;
        }
        .staff-toolbar select {
          padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1;
          background: #fff; font-size: 14px;
        }
        .staff-table-card {
          background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;
          overflow-x: auto;
        }
        .staff-table { width: 100%; border-collapse: collapse; text-align: left; }
        .staff-table th {
          background: #f8fafc; padding: 12px 16px; font-size: 13px;
          color: #475569; border-bottom: 1px solid #e2e8f0;
        }
        .staff-table td {
          padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px;
        }
        .empty-cell {
          text-align: center; padding: 28px 16px !important; color: #64748b;
        }
        .text-muted { color: #64748b; font-size: 12px; }
        .role-pill {
          padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
        }
        .status-pill {
          padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
        }
        .status-pill.active { background: #dcfce7; color: #15803d; }
        .status-pill.locked { background: #fee2e2; color: #b91c1c; }
        .action-group { display: flex; gap: 8px; }
        .btn-sm {
          padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid #cbd5e1; background: #fff;
        }
        .btn-sm.edit:hover { border-color: #2563eb; color: #2563eb; }
        .btn-sm.toggle:hover { border-color: #dc2626; color: #dc2626; }
        .oism-modal-backdrop {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          padding: 16px;
        }
        .oism-modal-box {
          background: #fff; width: 100%; max-width: 560px; border-radius: 14px;
          overflow: hidden; box-shadow: 0 20px 35px rgba(0, 0, 0, 0.2);
        }
        .oism-modal-header {
          padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
        }
        .oism-modal-header h2 { margin: 0; font-size: 17px; color: #0f172a; }
        .oism-modal-header button {
          background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b;
        }
        .oism-modal-form { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .oism-modal-form label {
          display: flex; flex-direction: column; gap: 6px; font-size: 13px;
          font-weight: 600; color: #334155;
        }
        .oism-modal-form input, .oism-modal-form select {
          padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
        }
        .oism-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;
        }
        .btn-cancel {
          padding: 9px 16px; border-radius: 8px; border: 1px solid #cbd5e1;
          background: #fff; cursor: pointer; font-weight: 600;
        }
        .btn-save {
          padding: 9px 18px; border-radius: 8px; border: none;
          background: #2563eb; color: #fff; cursor: pointer; font-weight: 600;
        }
        .btn-save:disabled, .btn-cancel:disabled {
          opacity: 0.6; cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default StaffPage;