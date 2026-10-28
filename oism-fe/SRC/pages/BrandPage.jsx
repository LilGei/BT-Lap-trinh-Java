import { useState } from "react";

const duLieuBanDau = [
  { id: 1, name: "Nike", country: "Mỹ" },
  { id: 2, name: "Adidas", country: "Đức" },
  { id: 3, name: "Biti's", country: "Việt Nam" },
];

function BrandPage() {
  const [brands, setBrands] = useState(duLieuBanDau);
  const [ten, setTen] = useState("");
  const [quocGia, setQuocGia] = useState("");
  const [idDangSua, setIdDangSua] = useState(null);

  const lamMoiForm = () => {
    setTen("");
    setQuocGia("");
    setIdDangSua(null);
  };

  const luuThuongHieu = () => {
    if (ten.trim() === "") {
      alert("Vui lòng nhập tên thương hiệu");
      return;
    }

    if (idDangSua === null) {
      const moi = { id: Date.now(), name: ten.trim(), country: quocGia.trim() };
      setBrands([...brands, moi]);
    } else {
      setBrands(
        brands.map((b) =>
          b.id === idDangSua
            ? { ...b, name: ten.trim(), country: quocGia.trim() }
            : b
        )
      );
    }
    lamMoiForm();
  };

  const batDauSua = (b) => {
    setIdDangSua(b.id);
    setTen(b.name);
    setQuocGia(b.country);
  };

  const xoaThuongHieu = (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa?")) {
      setBrands(brands.filter((b) => b.id !== id));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý thương hiệu</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Tên thương hiệu"
        />
        <input
          value={quocGia}
          onChange={(e) => setQuocGia(e.target.value)}
          placeholder="Quốc gia"
          style={{ marginLeft: 8 }}
        />
        <button onClick={luuThuongHieu} style={{ marginLeft: 8 }}>
          {idDangSua === null ? "Thêm" : "Cập nhật"}
        </button>
        {idDangSua !== null && (
          <button onClick={lamMoiForm} style={{ marginLeft: 8 }}>
            Hủy
          </button>
        )}
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên thương hiệu</th>
            <th>Quốc gia</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b, index) => (
            <tr key={b.id}>
              <td>{index + 1}</td>
              <td>{b.name}</td>
              <td>{b.country}</td>
              <td>
                <button onClick={() => batDauSua(b)}>Sửa</button>
                <button
                  onClick={() => xoaThuongHieu(b.id)}
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

export default BrandPage;
