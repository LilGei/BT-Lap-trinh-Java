import { useState } from "react";

const dsKho = ["Kho Quận 1", "Kho Thủ Đức", "Kho Bình Tân"];

const duLieuTon = {
  "Kho Quận 1": { "AT-001-M": 50, "AT-001-L": 30, "QJ-002-32": 20 },
  "Kho Thủ Đức": { "AT-001-M": 10, "AT-001-L": 15, "QJ-002-32": 40 },
  "Kho Bình Tân": { "AT-001-M": 0, "AT-001-L": 25, "QJ-002-32": 5 },
};

function StocktakePage() {
  const [tonKho, setTonKho] = useState(duLieuTon);
  const [kho, setKho] = useState(dsKho[0]);
  const [soDem, setSoDem] = useState({});
  const [lichSu, setLichSu] = useState([]);

  const dsSku = Object.keys(tonKho[kho]);

  const doiKho = (e) => {
    setKho(e.target.value);
    setSoDem({});
  };

  const nhapSoDem = (sku, giaTri) => {
    setSoDem({ ...soDem, [sku]: giaTri });
  };

  const tinhChenhLech = (sku) => {
    const v = soDem[sku];
    if (v === undefined || v === "") return null;
    return Number(v) - tonKho[kho][sku];
  };

  const luuKiemKe = () => {
    const dong = [];

    for (const sku of dsSku) {
      const v = soDem[sku];
      if (v === undefined || v === "") continue;

      const so = Number(v);
      if (isNaN(so) || so < 0 || !Number.isInteger(so)) {
        alert("Số đếm của " + sku + " phải là số nguyên từ 0 trở lên");
        return;
      }
      const heThong = tonKho[kho][sku];
      dong.push({ sku, system: heThong, actual: so, diff: so - heThong });
    }

    if (dong.length === 0) {
      alert("Bạn chưa nhập số đếm cho SKU nào");
      return;
    }

    const phieu = {
      id: Date.now(),
      code: "KK" + String(lichSu.length + 1).padStart(4, "0"),
      date: new Date().toLocaleString("vi-VN"),
      warehouse: kho,
      lines: dong,
    };
    setLichSu([phieu, ...lichSu]);

    const tonMoi = {};
    dong.forEach((d) => {
      tonMoi[d.sku] = d.actual;
    });
    setTonKho({ ...tonKho, [kho]: { ...tonKho[kho], ...tonMoi } });
    setSoDem({});
  };

  const mauChenhLech = (diff) => {
    if (diff < 0) return "red";
    if (diff > 0) return "green";
    return "black";
  };

  const hienDau = (diff) => (diff > 0 ? "+" + diff : String(diff));

  return (
    <div style={{ padding: 20 }}>
      <h2>Kiểm kê kho</h2>

      <div style={{ marginBottom: 16 }}>
        <label>Kho: </label>
        <select value={kho} onChange={doiKho}>
          {dsKho.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Tồn hệ thống</th>
            <th>Số đếm thực tế</th>
            <th>Chênh lệch</th>
          </tr>
        </thead>
        <tbody>
          {dsSku.map((sku) => {
            const diff = tinhChenhLech(sku);
            return (
              <tr key={sku}>
                <td>{sku}</td>
                <td>{tonKho[kho][sku]}</td>
                <td>
                  <input
                    type="number"
                    value={soDem[sku] === undefined ? "" : soDem[sku]}
                    onChange={(e) => nhapSoDem(sku, e.target.value)}
                    style={{ width: 100 }}
                  />
                </td>
                <td style={{ color: diff === null ? "black" : mauChenhLech(diff) }}>
                  {diff === null ? "" : hienDau(diff)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={luuKiemKe} style={{ marginTop: 12 }}>
        Lưu kiểm kê
      </button>

      <h3 style={{ marginTop: 32 }}>Lịch sử kiểm kê</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Ngày</th>
            <th>Kho</th>
            <th>Số SKU đã đếm</th>
            <th>Số SKU lệch</th>
            <th>Chi tiết lệch</th>
          </tr>
        </thead>
        <tbody>
          {lichSu.map((p) => {
            const dsLech = p.lines.filter((d) => d.diff !== 0);
            return (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.date}</td>
                <td>{p.warehouse}</td>
                <td>{p.lines.length}</td>
                <td>{dsLech.length}</td>
                <td>
                  {dsLech.length === 0
                    ? "Khớp hết"
                    : dsLech.map((d) => d.sku + " (" + hienDau(d.diff) + ")").join(", ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StocktakePage;
