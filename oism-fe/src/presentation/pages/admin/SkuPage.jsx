import { useState, useEffect } from "react";
import { productApi, extractList } from "@/infrastructure/api/productApi";

function SkuPage() {
  const [skus, setSkus] = useState([]);
  const [products, setProducts] = useState([]);

  const [productId, setProductId] = useState("");
  const [maSku, setMaSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [gia, setGia] = useState("");
  const [idDangSua, setIdDangSua] = useState(null);
  const [tuKhoa, setTuKhoa] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [skuRes, prodRes] = await Promise.all([
        productApi.getSkus(),
        productApi.getProducts(),
      ]);

      const skuList = extractList(skuRes);
      const prodList = extractList(prodRes);

      setSkus(skuList);
      setProducts(prodList);

      if (prodList.length > 0 && !productId) {
        setProductId(String(prodList[0].id));
      }
    } catch (err) {
      console.error("Lỗi tải danh sách SKU:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const lamMoiForm = () => {
    setProductId(products[0]?.id ? String(products[0].id) : "");
    setMaSku("");
    setBarcode("");
    setGia("");
    setIdDangSua(null);
  };

  const getSkuCode = (s) => s.sku || s.skuCode || "";
  const getSkuPrice = (s) => Number(s.price ?? s.sellingPrice ?? 0);
  const getProductLabel = (s) => {
    if (s.productName) return s.productName;
    if (s.product && typeof s.product === "object") return s.product.name;
    if (typeof s.product === "string") return s.product;
    const found = products.find((p) => p.id === s.productId);
    return found?.name || "—";
  };

  const luuSku = async (e) => {
    e.preventDefault();
    const sku = maSku.trim();
    const bc = barcode.trim();
    const giaSo = Number(gia);

    if (!productId) {
      alert("Vui lòng tạo Sản phẩm trước khi thêm mã SKU!");
      return;
    }
    if (sku === "") {
      alert("Vui lòng nhập mã SKU");
      return;
    }
    if (gia === "" || isNaN(giaSo) || giaSo <= 0) {
      alert("Giá bán phải là số lớn hơn 0");
      return;
    }

    const khac = skus.filter((s) => s.id !== idDangSua);
    if (khac.some((s) => getSkuCode(s).toLowerCase() === sku.toLowerCase())) {
      alert("Mã SKU đã tồn tại trong hệ thống!");
      return;
    }
    if (bc !== "" && khac.some((s) => (s.barcode || "") === bc)) {
      alert("Barcode đã tồn tại trong hệ thống!");
      return;
    }

    const payload = {
      productId: Number(productId),
      sku,
      skuCode: sku,
      barcode: bc,
      price: giaSo,
      sellingPrice: giaSo,
    };

    setSubmitting(true);
    try {
      if (idDangSua === null) {
        await productApi.createSku(payload);
      } else {
        await productApi.updateSku(idDangSua, payload);
      }
      lamMoiForm();
      await loadAllData();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu SKU!");
    } finally {
      setSubmitting(false);
    }
  };

  const batDauSua = (s) => {
    setIdDangSua(s.id);
    const pId = s.productId ?? s.product?.id ?? products[0]?.id ?? "";
    setProductId(String(pId));
    setMaSku(getSkuCode(s));
    setBarcode(s.barcode || "");
    setGia(String(getSkuPrice(s)));
  };

  const xoaSku = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa mã SKU này?")) return;
    try {
      await productApi.deleteSku(id);
      setSkus((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Không thể xóa SKU (có thể đang phát sinh giao dịch kho hoặc đơn hàng)!"
      );
    }
  };

  const kw = tuKhoa.toLowerCase();
  const dsHienThi = skus.filter(
    (s) =>
      getSkuCode(s).toLowerCase().includes(kw) ||
      (s.barcode || "").includes(tuKhoa) ||
      getProductLabel(s).toLowerCase().includes(kw)
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Quản lý SKU, Barcode & Giá bán</h2>
        <p style={styles.subtitle}>
          Quản lý mã định danh chi tiết, mã vạch quét tại quầy POS và giá niêm yết
        </p>
      </div>

      <form onSubmit={luuSku} style={styles.formBar}>
        <select
          style={styles.select}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.length === 0 && <option value="">-- Chưa có sản phẩm --</option>}
          {products.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          value={maSku}
          onChange={(e) => setMaSku(e.target.value)}
          placeholder="Mã SKU * (VD: AT-001-M)"
        />
        <input
          style={styles.input}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Barcode (VD: 893000001)"
        />
        <input
          type="number"
          style={styles.input}
          value={gia}
          onChange={(e) => setGia(e.target.value)}
          placeholder="Giá bán (VNĐ) *"
        />
        <button type="submit" style={styles.btnPrimary} disabled={submitting}>
          {submitting
            ? "Đang lưu..."
            : idDangSua === null
            ? "+ Thêm SKU"
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
          placeholder="Tìm theo mã SKU, barcode hoặc tên sản phẩm..."
        />
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Sản phẩm</th>
              <th style={styles.th}>Mã SKU</th>
              <th style={styles.th}>Barcode</th>
              <th style={styles.th}>Giá bán</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : dsHienThi.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  Chưa có dữ liệu SKU.
                </td>
              </tr>
            ) : (
              dsHienThi.map((s, index) => (
                <tr key={s.id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{getProductLabel(s)}</td>
                  <td style={styles.td}>
                    <code>{getSkuCode(s)}</code>
                  </td>
                  <td style={styles.td}>{s.barcode || "—"}</td>
                  <td style={styles.td}>
                    <strong>{getSkuPrice(s).toLocaleString("vi-VN")} đ</strong>
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => batDauSua(s)}
                      style={styles.btnEdit}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => xoaSku(s.id)}
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
  select: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    background: "#fff",
    minWidth: 180,
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    minWidth: 170,
  },
  searchBar: { marginBottom: 16 },
  searchInput: {
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    width: "100%",
    maxWidth: 360,
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

export default SkuPage;