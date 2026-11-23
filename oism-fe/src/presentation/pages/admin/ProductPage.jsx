import { useState, useEffect } from "react";
import { productApi, extractList } from "@/infrastructure/api/productApi";

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [ten, setTen] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [idDangSua, setIdDangSua] = useState(null);
  const [tuKhoa, setTuKhoa] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        productApi.getProducts(),
        productApi.getCategories(),
        productApi.getBrands(),
      ]);

      const prodList = extractList(prodRes);
      const catList = extractList(catRes);
      const brandList = extractList(brandRes);

      setProducts(prodList);
      setCategories(catList);
      setBrands(brandList);

      if (catList.length > 0 && !categoryId) {
        setCategoryId(String(catList[0].id));
      }
      if (brandList.length > 0 && !brandId) {
        setBrandId(String(brandList[0].id));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const lamMoiForm = () => {
    setTen("");
    setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
    setBrandId(brands[0]?.id ? String(brands[0].id) : "");
    setIdDangSua(null);
  };

  const luuSanPham = async (e) => {
    e.preventDefault();
    if (ten.trim() === "") {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!categoryId || !brandId) {
      alert("Vui lòng tạo ít nhất 1 Danh mục và 1 Thương hiệu trước khi thêm sản phẩm!");
      return;
    }

    const payload = {
      name: ten.trim(),
      categoryId: Number(categoryId),
      brandId: Number(brandId),
    };

    setSubmitting(true);
    try {
      if (idDangSua === null) {
        await productApi.createProduct(payload);
      } else {
        await productApi.updateProduct(idDangSua, payload);
      }
      lamMoiForm();
      await loadAllData();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu sản phẩm!");
    } finally {
      setSubmitting(false);
    }
  };

  const batDauSua = (p) => {
    setIdDangSua(p.id);
    setTen(p.name || "");
    const cId = p.categoryId ?? p.category?.id ?? categories[0]?.id ?? "";
    const bId = p.brandId ?? p.brand?.id ?? brands[0]?.id ?? "";
    setCategoryId(String(cId));
    setBrandId(String(bId));
  };

  const xoaSanPham = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await productApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Không thể xóa sản phẩm (có thể đang có SKU hoặc tồn kho liên kết)!"
      );
    }
  };

  const getCategoryLabel = (p) => {
    if (p.categoryName) return p.categoryName;
    if (p.category && typeof p.category === "object") return p.category.name;
    if (typeof p.category === "string") return p.category;
    const found = categories.find((c) => c.id === p.categoryId);
    return found?.name || "—";
  };

  const getBrandLabel = (p) => {
    if (p.brandName) return p.brandName;
    if (p.brand && typeof p.brand === "object") return p.brand.name;
    if (typeof p.brand === "string") return p.brand;
    const found = brands.find((b) => b.id === p.brandId);
    return found?.name || "—";
  };

  const dsHienThi = products.filter((p) =>
    (p.name || "").toLowerCase().includes(tuKhoa.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Quản lý sản phẩm</h2>
        <p style={styles.subtitle}>Quản lý danh mục hàng hóa gốc trước khi tạo mã biến thể SKU</p>
      </div>

      <form onSubmit={luuSanPham} style={styles.formBar}>
        <input
          style={styles.input}
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Tên sản phẩm *"
        />

        <select
          style={styles.select}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.length === 0 && <option value="">-- Chưa có danh mục --</option>}
          {categories.map((dm) => (
            <option key={dm.id} value={dm.id}>
              {dm.name}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
        >
          {brands.length === 0 && <option value="">-- Chưa có thương hiệu --</option>}
          {brands.map((th) => (
            <option key={th.id} value={th.id}>
              {th.name}
            </option>
          ))}
        </select>

        <button type="submit" style={styles.btnPrimary} disabled={submitting}>
          {submitting
            ? "Đang lưu..."
            : idDangSua === null
            ? "+ Thêm sản phẩm"
            : "Cập nhật"}
        </button>
        {idDangSua !== null && (
          <button type="button" onClick={lamMoiForm} style={styles.btnSecondary}>
            Hủy
          </button>
        )}
      </form>

      <div style={styles.searchBar}>
        <input
          style={styles.searchInput}
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          placeholder="Tìm theo tên sản phẩm..."
        />
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Tên sản phẩm</th>
              <th style={styles.th}>Danh mục</th>
              <th style={styles.th}>Thương hiệu</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : dsHienThi.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  Không tìm thấy sản phẩm nào.
                </td>
              </tr>
            ) : (
              dsHienThi.map((p, index) => (
                <tr key={p.id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <strong>{p.name}</strong>
                  </td>
                  <td style={styles.td}>{getCategoryLabel(p)}</td>
                  <td style={styles.td}>{getBrandLabel(p)}</td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => batDauSua(p)}
                      style={styles.btnEdit}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => xoaSanPham(p.id)}
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
    marginBottom: 16,
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    minWidth: 220,
  },
  select: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    background: "#fff",
    minWidth: 160,
  },
  searchBar: { marginBottom: 16 },
  searchInput: {
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    width: "100%",
    maxWidth: 340,
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

export default ProductPage;