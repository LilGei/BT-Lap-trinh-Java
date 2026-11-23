import { useState, useEffect } from "react";
import { productApi, extractList } from "@/infrastructure/api/productApi";

function BrandPage() {
  const [brands, setBrands] = useState([]);
  const [ten, setTen] = useState("");
  const [quocGia, setQuocGia] = useState("");
  const [idDangSua, setIdDangSua] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await productApi.getBrands();
      setBrands(extractList(res));
    } catch (err) {
      console.error("Lỗi tải danh sách thương hiệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const lamMoiForm = () => {
    setTen("");
    setQuocGia("");
    setIdDangSua(null);
  };

  const luuThuongHieu = async (e) => {
    e.preventDefault();
    if (ten.trim() === "") {
      alert("Vui lòng nhập tên thương hiệu");
      return;
    }

    const payload = {
      name: ten.trim(),
      country: quocGia.trim(),
    };

    setSubmitting(true);
    try {
      if (idDangSua === null) {
        await productApi.createBrand(payload);
      } else {
        await productApi.updateBrand(idDangSua, payload);
      }
      lamMoiForm();
      await loadBrands();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu thương hiệu!");
    } finally {
      setSubmitting(false);
    }
  };

  const batDauSua = (b) => {
    setIdDangSua(b.id);
    setTen(b.name || "");
    setQuocGia(b.country || "");
  };

  const xoaThuongHieu = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa thương hiệu này?")) return;
    try {
      await productApi.deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Không thể xóa thương hiệu (có thể đang được gắn với sản phẩm)!"
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Quản lý thương hiệu</h2>
        <p style={styles.subtitle}>Danh sách các hãng sản xuất / nhãn hàng kinh doanh</p>
      </div>

      <form onSubmit={luuThuongHieu} style={styles.formBar}>
        <input
          style={styles.input}
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Tên thương hiệu *"
        />
        <input
          style={styles.input}
          value={quocGia}
          onChange={(e) => setQuocGia(e.target.value)}
          placeholder="Quốc gia xuất xứ"
        />
        <button type="submit" style={styles.btnPrimary} disabled={submitting}>
          {submitting
            ? "Đang lưu..."
            : idDangSua === null
            ? "+ Thêm thương hiệu"
            : "Cập nhật"}
        </button>
        {idDangSua !== null && (
          <button type="button" onClick={lamMoiForm} style={styles.btnSecondary}>
            Hủy
          </button>
        )}
      </form>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Tên thương hiệu</th>
              <th style={styles.th}>Quốc gia</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={styles.emptyCell}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.emptyCell}>
                  Chưa có thương hiệu nào.
                </td>
              </tr>
            ) : (
              brands.map((b, index) => (
                <tr key={b.id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <strong>{b.name}</strong>
                  </td>
                  <td style={styles.td}>{b.country || "—"}</td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => batDauSua(b)}
                      style={styles.btnEdit}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => xoaThuongHieu(b.id)}
                      style={styles.btnDelete}
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
    </div>
  );
}

const styles = {
  page: { padding: 24 },
  header: { marginBottom: 20 },
  title: { margin: "0 0 4px", fontSize: 22, color: "#0f172a" },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b" },
  formBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    marginBottom: 20,
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    minWidth: 220,
  },
  btnPrimary: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    background: "#f8fafc",
    padding: "12px 16px",
    fontSize: 13,
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
  },
  emptyCell: {
    padding: 24,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
  btnEdit: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  },
  btnDelete: {
    marginLeft: 8,
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  },
};

export default BrandPage;