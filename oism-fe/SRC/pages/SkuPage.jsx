import { useState } from "react";

const dsSanPham = ["Áo thun basic", "Quần jean slim", "Giày chạy bộ"];

const duLieuBanDau = [
  { id: 1, product: "Áo thun basic", sku: "AT-001-M", barcode: "8930000000011", price: 150000 },
  { id: 2, product: "Áo thun basic", sku: "AT-001-L", barcode: "8930000000028", price: 150000 },
  { id: 3, product: "Quần jean slim", sku: "QJ-002-32", barcode: "8930000000035", price: 350000 },
];

function SkuPage() {
  const [skus, setSkus] = useState(duLieuBanDau);
  const [sanPham, setSanPham] = useState(dsSanPham[0]);
  const [maSku, setMaSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [gia, setGia] = useState("");
  const [idDangSua, setIdDangSua] = useState(null);
  const [tuKhoa, setTuKhoa] = useState("");

  const lamMoiForm = () => {
    setSanPham(dsSanPham[0]);
    setMaSku("");
    setBarcode("");
    setGia("");
    setIdDangSua(null);
  };

  const luuSku = () => {
    const sku = maSku.trim();
    const bc = barcode.trim();
    const giaSo = Number(gia);

    if (sku === "") {
      alert("Vui lòng nhập mã SKU");
      return;
    }
    if (gia === "" || isNaN(giaSo) || giaSo <= 0) {
      alert("Giá bán phải là số lớn hơn 0");
      return;
    }

    const khac = skus.filter((s) => s.id !== idDangSua);
    if (khac.some((s) => s.sku.toLowerCase() === sku.toLowerCase())) {
      alert("Mã SKU đã tồn tại");
      return;
    }
    if (bc !== "" && khac.some((s) => s.barcode === bc)) {
      alert("Barcode đã tồn tại");
      return;
    }

    if (idDangSua === null) {
      const moi = { id: Date.now(), product: sanPham, sku, barcode: bc, price: giaSo };
      setSkus([...skus, moi]);
    } else {
      setSkus(
        skus.map((s) =>
          s.id === idDangSua
            ? { ...s, product: sanPham, sku, barcode: bc, price: giaSo }
            : s
        )
      );
    }
    lamMoiForm();
  };

  const batDauSua = (s) => {
    setIdDangSua(s.id);
    setSanPham(s.product);
    setMaSku(s.sku);
    setBarcode(s.barcode);
    setGia(String(s.price));
  };

  const xoaSku = (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa?")) {
      setSkus(skus.filter((s) => s.id !== id));
    }
  };

  const kw = tuKhoa.toLowerCase();
  const dsHienThi = skus.filter(
    (s) => s.sku.toLowerCase().includes(kw) || s.barcode.includes(tuKhoa)
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý SKU, barcode và giá</h2>

      <div style={{ marginBottom: 16 }}>
        <select value={sanPham} onChange={(e) => setSanPham(e.target.value)}>
          {dsSanPham.map((sp) => (
            <option key={sp} value={sp}>
              {sp}
            </option>
          ))}
        </select>
        <input
          value={maSku}
          onChange={(e) => setMaSku(e.target.value)}
          placeholder="Mã SKU"
          style={{ marginLeft: 8 }}
        />
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Barcode"
          style={{ marginLeft: 8 }}
        />
        <input
          type="number"
          value={gia}
          onChange={(e) => setGia(e.target.value)}
          placeholder="Giá bán (VNĐ)"
          style={{ marginLeft: 8 }}
        />
        <button onClick={luuSku} style={{ marginLeft: 8 }}>
          {idDangSua === null ? "Thêm" : "Cập nhật"}
        </button>
        {idDangSua !== null && (
          <button onClick={lamMoiForm} style={{ marginLeft: 8 }}>
            Hủy
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          placeholder="Tìm theo SKU hoặc barcode"
        />
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Sản phẩm</th>
            <th>SKU</th>
            <th>Barcode</th>
            <th>Giá bán</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {dsHienThi.map((s, index) => (
            <tr key={s.id}>
              <td>{index + 1}</td>
              <td>{s.product}</td>
              <td>{s.sku}</td>
              <td>{s.barcode}</td>
              <td>{s.price.toLocaleString("vi-VN")} đ</td>
              <td>
                <button onClick={() => batDauSua(s)}>Sửa</button>
                <button onClick={() => xoaSku(s.id)} style={{ marginLeft: 8 }}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SkuPage;
