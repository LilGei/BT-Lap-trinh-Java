import { useState } from "react";

const duLieuBanDau = [
  { id: 1, warehouse: "Kho Quận 1", sku: "AT-001-M", stock: 12, forecast7: 28, suggest: 40, done: false },
  { id: 2, warehouse: "Kho Quận 1", sku: "AT-001-L", stock: 30, forecast7: 14, suggest: 0, done: false },
  { id: 3, warehouse: "Kho Thủ Đức", sku: "QJ-002-32", stock: 6, forecast7: 10, suggest: 20, done: false },
  { id: 4, warehouse: "Kho Bình Tân", sku: "AT-001-M", stock: 2, forecast7: 21, suggest: 45, done: false },
  { id: 5, warehouse: "Kho Bình Tân", sku: "QJ-002-32", stock: 5, forecast7: 3, suggest: 0, done: false },
];

function soNgayConHang(d) {
  if (d.forecast7 <= 0) return 999;
  return d.stock / (d.forecast7 / 7);
}

function mucDo(d) {
  const ngay = soNgayConHang(d);
  if (ngay < 3) return { text: "Khẩn", cls: "badge-do" };
  if (ngay < 7) return { text: "Sắp hết", cls: "badge-cam" };
  return { text: "Ổn", cls: "badge-la" };
}

function AiSuggestPage() {
  const [goiY, setGoiY] = useState(duLieuBanDau);
  const [daChon, setDaChon] = useState([]);
  const [chiCanNhap, setChiCanNhap] = useState(true);
  const [ketQua, setKetQua] = useState("");

  const doiSoLuong = (id, giaTri) => {
    setGoiY(goiY.map((d) => (d.id === id ? { ...d, suggest: giaTri } : d)));
  };

  const chonDong = (id) => {
    if (daChon.includes(id)) {
      setDaChon(daChon.filter((x) => x !== id));
    } else {
      setDaChon([...daChon, id]);
    }
  };

  const dsHienThi = goiY.filter(
    (d) => !chiCanNhap || Number(d.suggest) > 0 || d.done
  );

  const taoPhieuNhap = () => {
    const dsTao = goiY.filter((d) => daChon.includes(d.id) && !d.done);

    if (dsTao.length === 0) {
      alert("Bạn chưa chọn dòng nào (hoặc dòng đã tạo phiếu rồi)");
      return;
    }
    for (const d of dsTao) {
      const sl = Number(d.suggest);
      if (isNaN(sl) || sl <= 0 || !Number.isInteger(sl)) {
        alert("Số lượng của " + d.sku + " phải là số nguyên lớn hơn 0");
        return;
      }
    }

    const idTao = dsTao.map((d) => d.id);
    setGoiY(goiY.map((d) => (idTao.includes(d.id) ? { ...d, done: true } : d)));
    setDaChon([]);

    const tongSl = dsTao.reduce((t, d) => t + Number(d.suggest), 0);
    setKetQua("Đã tạo phiếu nhập cho " + dsTao.length + " dòng, tổng " + tongSl + " sản phẩm.");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Gợi ý nhập hàng từ AI</h2>

      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={chiCanNhap}
            onChange={(e) => setChiCanNhap(e.target.checked)}
          />{" "}
          Chỉ hiện SKU cần nhập
        </label>
        <button onClick={taoPhieuNhap} style={{ marginLeft: 16 }}>
          Tạo phiếu nhập ({daChon.length} dòng)
        </button>
      </div>

      {ketQua !== "" && <p style={{ color: "green" }}>{ketQua}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Chọn</th>
            <th>Kho</th>
            <th>SKU</th>
            <th>Tồn hiện tại</th>
            <th>AI dự báo bán 7 ngày</th>
            <th>Còn đủ bán (ngày)</th>
            <th>Mức độ</th>
            <th>Số lượng đề xuất nhập</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {dsHienThi.map((d) => {
            const md = mucDo(d);
            const ngay = soNgayConHang(d);
            return (
              <tr key={d.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={daChon.includes(d.id)}
                    disabled={d.done}
                    onChange={() => chonDong(d.id)}
                  />
                </td>
                <td>{d.warehouse}</td>
                <td>{d.sku}</td>
                <td>{d.stock}</td>
                <td>{d.forecast7}</td>
                <td>{ngay === 999 ? "-" : ngay.toFixed(1)}</td>
                <td>
                  <span className={"badge " + md.cls}>{md.text}</span>
                </td>
                <td>
                  <input
                    type="number"
                    value={d.suggest}
                    disabled={d.done}
                    onChange={(e) => doiSoLuong(d.id, e.target.value)}
                    style={{ width: 80 }}
                  />
                </td>
                <td>{d.done ? "Đã tạo phiếu" : "Chờ duyệt"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AiSuggestPage;
