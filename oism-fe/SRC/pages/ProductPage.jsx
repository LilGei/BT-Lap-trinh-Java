import { useState } from "react";

const dsDanhMuc = ["Áo thun", "Quần jean", "Giày thể thao"];
const dsThuongHieu = ["Nike", "Adidas", "Biti's"];

const duLieuBanDau = [
  { id: 1, name: "Áo thun basic", category: "Áo thun", brand: "Nike" },
  { id: 2, name: "Quần jean slim", category: "Quần jean", brand: "Adidas" },
  { id: 3, name: "Giày chạy bộ", category: "Giày thể thao", brand: "Biti's" },
];

function ProductPage() {
  const [products, setProducts] = useState(duLieuBanDau);
  const [ten, setTen] = useState("");
  const [danhMuc, setDanhMuc] = useState(dsDanhMuc[0]);
  const [thuongHieu, setThuongHieu] = useState(dsThuongHieu[0]);
  const [idDangSua, setIdDangSua] = useState(null);
  const [tuKhoa, setTuKhoa] = useState("");

  const lamMoiForm = () => {
    setTen("");
    setDanhMuc(dsDanhMuc[0]);
    setThuongHieu(dsThuongHieu[0]);
    setIdDangSua(null);
  };

  const luuSanPham = () => {
    if (ten.trim() === "") {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (idDangSua === null) {
      const moi = {
        id: Date.now(),
        name: ten.trim(),
        category: danhMuc,
        brand: thuongHieu,
      };
      setProducts([...products, moi]);
    } else {
      setProducts(
        products.map((p) =>
          p.id === idDangSua
            ? { ...p, name: ten.trim(), category: danhMuc, brand: thuongHieu }
            : p
        )
      );
    }
    lamMoiForm();
  };

  const batDauSua = (p) => {
    setIdDangSua(p.id);
    setTen(p.name);
    setDanhMuc(p.category);
    setThuongHieu(p.brand);
  };

  const xoaSanPham = (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const dsHienThi = products.filter((p) =>
    p.name.toLowerCase().includes(tuKhoa.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý sản phẩm</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Tên sản phẩm"
        />

        <select
          value={danhMuc}
          onChange={(e) => setDanhMuc(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {dsDanhMuc.map((dm) => (
            <option key={dm} value={dm}>
              {dm}
            </option>
          ))}
        </select>

        <select
          value={thuongHieu}
          onChange={(e) => setThuongHieu(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {dsThuongHieu.map((th) => (
            <option key={th} value={th}>
              {th}
            </option>
          ))}
        </select>

        <button onClick={luuSanPham} style={{ marginLeft: 8 }}>
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
          placeholder="Tìm theo tên sản phẩm"
        />
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Thương hiệu</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {dsHienThi.map((p, index) => (
            <tr key={p.id}>
              <td>{index + 1}</td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.brand}</td>
              <td>
                <button onClick={() => batDauSua(p)}>Sửa</button>
                <button
                  onClick={() => xoaSanPham(p.id)}
                  style={{ marginLeft: 8 }}
                >
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

export default ProductPage;
