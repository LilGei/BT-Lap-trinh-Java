import { useState } from "react";

const duLieuBanDau = [
  { id: 1, name: "Áo thun" },
  { id: 2, name: "Quần jean" },
  { id: 3, name: "Giày thể thao" },
];

function CategoryPage() {
  const [categories, setCategories] = useState(duLieuBanDau);
  const [tenMoi, setTenMoi] = useState("");

  const themDanhMuc = () => {
    if (tenMoi.trim() === "") {
      alert("Vui lòng nhập tên danh mục");
      return;
    }
    const moi = { id: Date.now(), name: tenMoi.trim() };
    setCategories([...categories, moi]);
    setTenMoi("");
  };

  const xoaDanhMuc = (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa?")) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý danh mục</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          value={tenMoi}
          onChange={(e) => setTenMoi(e.target.value)}
          placeholder="Tên danh mục mới"
        />
        <button onClick={themDanhMuc} style={{ marginLeft: 8 }}>
          Thêm
        </button>
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên danh mục</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c, index) => (
            <tr key={c.id}>
              <td>{index + 1}</td>
              <td>{c.name}</td>
              <td>
                <button onClick={() => xoaDanhMuc(c.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryPage;
