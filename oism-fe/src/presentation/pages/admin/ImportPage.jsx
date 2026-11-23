import { useState } from "react";

const dsKho = ["Kho Quận 1", "Kho Thủ Đức", "Kho Bình Tân"];
const dsSku = ["AT-001-M", "AT-001-L", "QJ-002-32"];

function ImportPage() {
  const [phieuNhap, setPhieuNhap] = useState([]);
  const [kho, setKho] = useState(dsKho[0]);
  const [nhaCungCap, setNhaCungCap] = useState("");
  const [dongTam, setDongTam] = useState([]);

  const [sku, setSku] = useState(dsSku[0]);
  const [soLuong, setSoLuong] = useState("");
  const [giaNhap, setGiaNhap] = useState("");

  const themDong = () => {
    const sl = Number(soLuong);
    const gia = Number(giaNhap);

    if (soLuong === "" || isNaN(sl) || sl <= 0 || !Number.isInteger(sl)) {
      alert("Số lượng phải là số nguyên lớn hơn 0");
      return;
    }
    if (giaNhap === "" || isNaN(gia) || gia <= 0) {
      alert("Giá nhập phải là số lớn hơn 0");
      return;
    }

    setDongTam([...dongTam, { id: Date.now(), sku, quantity: sl, cost: gia }]);
    setSoLuong("");
    setGiaNhap("");
  };

  const xoaDong = (id) => {
    setDongTam(dongTam.filter((d) => d.id !== id));
  };

  const tinhTong = (dong) =>
    dong.reduce((tong, d) => tong + d.quantity * d.cost, 0);

  const luuPhieu = () => {
    if (nhaCungCap.trim() === "") {
      alert("Vui lòng nhập nhà cung cấp");
      return;
    }
    if (dongTam.length === 0) {
      alert("Phiếu nhập chưa có dòng hàng nào");
      return;
    }

    const phieu = {
      id: Date.now(),
      code: "PN" + String(phieuNhap.length + 1).padStart(4, "0"),
      date: new Date().toLocaleString("vi-VN"),
      warehouse: kho,
      supplier: nhaCungCap.trim(),
      lines: dongTam,
      total: tinhTong(dongTam),
    };

    setPhieuNhap([phieu, ...phieuNhap]);
    setDongTam([]);
    setNhaCungCap("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Nhập hàng</h2>

      <div style={{ marginBottom: 16 }}>
        <select value={kho} onChange={(e) => setKho(e.target.value)}>
          {dsKho.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          value={nhaCungCap}
          onChange={(e) => setNhaCungCap(e.target.value)}
          placeholder="Nhà cung cấp"
          style={{ marginLeft: 8 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <select value={sku} onChange={(e) => setSku(e.target.value)}>
          {dsSku.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={soLuong}
          onChange={(e) => setSoLuong(e.target.value)}
          placeholder="Số lượng"
          style={{ marginLeft: 8 }}
        />
        <input
          type="number"
          value={giaNhap}
          onChange={(e) => setGiaNhap(e.target.value)}
          placeholder="Giá nhập (VNĐ)"
          style={{ marginLeft: 8 }}
        />
        <button onClick={themDong} style={{ marginLeft: 8 }}>
          Thêm dòng
        </button>
      </div>

      <h3>Phiếu đang soạn</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Số lượng</th>
            <th>Giá nhập</th>
            <th>Thành tiền</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {dongTam.map((d) => (
            <tr key={d.id}>
              <td>{d.sku}</td>
              <td>{d.quantity}</td>
              <td>{d.cost.toLocaleString("vi-VN")} đ</td>
              <td>{(d.quantity * d.cost).toLocaleString("vi-VN")} đ</td>
              <td>
                <button onClick={() => xoaDong(d.id)}>Bỏ dòng</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <b>Tổng tiền: {tinhTong(dongTam).toLocaleString("vi-VN")} đ</b>
      </p>
      <button onClick={luuPhieu}>Lưu phiếu nhập</button>

      <h3 style={{ marginTop: 32 }}>Lịch sử phiếu nhập</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Ngày</th>
            <th>Kho</th>
            <th>Nhà cung cấp</th>
            <th>Số dòng</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          {phieuNhap.map((p) => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.date}</td>
              <td>{p.warehouse}</td>
              <td>{p.supplier}</td>
              <td>{p.lines.length}</td>
              <td>{p.total.toLocaleString("vi-VN")} đ</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ImportPage;
