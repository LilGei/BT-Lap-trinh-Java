import { useState } from "react";

const duLieuSoCai = [
  { id: 1, date: "2026-10-20T08:00:00", warehouse: "Kho Quận 1", sku: "AT-001-M", type: "Nhập hàng", ref: "PN0001", change: 60 },
  { id: 2, date: "2026-10-20T08:05:00", warehouse: "Kho Quận 1", sku: "QJ-002-32", type: "Nhập hàng", ref: "PN0001", change: 25 },
  { id: 3, date: "2026-10-21T09:00:00", warehouse: "Kho Thủ Đức", sku: "AT-001-M", type: "Nhập hàng", ref: "PN0002", change: 5 },
  { id: 4, date: "2026-10-22T10:30:00", warehouse: "Kho Quận 1", sku: "AT-001-M", type: "Bán hàng", ref: "DH0012", change: -8 },
  { id: 5, date: "2026-10-23T15:20:00", warehouse: "Kho Quận 1", sku: "QJ-002-32", type: "Bán hàng", ref: "DH0013", change: -5 },
  { id: 6, date: "2026-10-24T14:00:00", warehouse: "Kho Quận 1", sku: "AT-001-M", type: "Chuyển đi", ref: "CK0001", change: -5 },
  { id: 7, date: "2026-10-25T09:30:00", warehouse: "Kho Thủ Đức", sku: "AT-001-M", type: "Chuyển đến", ref: "CK0001", change: 5 },
  { id: 8, date: "2026-10-26T09:00:00", warehouse: "Kho Quận 1", sku: "AT-001-M", type: "Kiểm kê", ref: "KK0001", change: 3 },
];

const dsKho = ["Tất cả", "Kho Quận 1", "Kho Thủ Đức", "Kho Bình Tân"];
const dsSku = ["Tất cả", "AT-001-M", "AT-001-L", "QJ-002-32"];
const dsLoai = ["Tất cả", "Nhập hàng", "Bán hàng", "Chuyển đi", "Chuyển đến", "Kiểm kê"];

function tinhSoDu(danhSach) {
  const daSapXep = [...danhSach].sort((a, b) => a.date.localeCompare(b.date));
  const soDu = {};

  return daSapXep.map((d) => {
    const khoa = d.warehouse + "|" + d.sku;
    soDu[khoa] = (soDu[khoa] || 0) + d.change;
    return { ...d, balance: soDu[khoa] };
  });
}

function LedgerPage() {
  const [loaiKho, setLoaiKho] = useState("Tất cả");
  const [loaiSku, setLoaiSku] = useState("Tất cả");
  const [loaiGd, setLoaiGd] = useState("Tất cả");

  const coSoDu = tinhSoDu(duLieuSoCai);

  const daLoc = coSoDu.filter(
    (d) =>
      (loaiKho === "Tất cả" || d.warehouse === loaiKho) &&
      (loaiSku === "Tất cả" || d.sku === loaiSku) &&
      (loaiGd === "Tất cả" || d.type === loaiGd)
  );

  const dsHienThi = [...daLoc].reverse();

  const hienDau = (so) => (so > 0 ? "+" + so : String(so));

  return (
    <div style={{ padding: 20 }}>
      <h2>Sổ cái tồn kho</h2>

      <div style={{ marginBottom: 16 }}>
        <label>Kho: </label>
        <select value={loaiKho} onChange={(e) => setLoaiKho(e.target.value)}>
          {dsKho.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: 16 }}>SKU: </label>
        <select value={loaiSku} onChange={(e) => setLoaiSku(e.target.value)}>
          {dsSku.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: 16 }}>Loại: </label>
        <select value={loaiGd} onChange={(e) => setLoaiGd(e.target.value)}>
          {dsLoai.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <p>Có {dsHienThi.length} dòng</p>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Kho</th>
            <th>SKU</th>
            <th>Loại</th>
            <th>Chứng từ</th>
            <th>Thay đổi</th>
            <th>Tồn sau giao dịch</th>
          </tr>
        </thead>
        <tbody>
          {dsHienThi.map((d) => (
            <tr key={d.id}>
              <td>{new Date(d.date).toLocaleString("vi-VN")}</td>
              <td>{d.warehouse}</td>
              <td>{d.sku}</td>
              <td>{d.type}</td>
              <td>{d.ref}</td>
              <td style={{ color: d.change < 0 ? "red" : "green" }}>
                {hienDau(d.change)}
              </td>
              <td>{d.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LedgerPage;
