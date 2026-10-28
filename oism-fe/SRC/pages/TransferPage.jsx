import { useState } from "react";

const dsKho = ["Kho Quận 1", "Kho Thủ Đức", "Kho Bình Tân"];
const dsSku = ["AT-001-M", "AT-001-L", "QJ-002-32"];

function TransferPage() {
  const [phieuChuyen, setPhieuChuyen] = useState([]);
  const [khoGui, setKhoGui] = useState(dsKho[0]);
  const [khoNhan, setKhoNhan] = useState(dsKho[1]);
  const [dongTam, setDongTam] = useState([]);

  const [sku, setSku] = useState(dsSku[0]);
  const [soLuong, setSoLuong] = useState("");

  const themDong = () => {
    const sl = Number(soLuong);
    if (soLuong === "" || isNaN(sl) || sl <= 0 || !Number.isInteger(sl)) {
      alert("Số lượng phải là số nguyên lớn hơn 0");
      return;
    }
    const daCo = dongTam.find((d) => d.sku === sku);
    if (daCo) {
      setDongTam(
        dongTam.map((d) =>
          d.sku === sku ? { ...d, quantity: d.quantity + sl } : d
        )
      );
    } else {
      setDongTam([...dongTam, { id: Date.now(), sku, quantity: sl }]);
    }
    setSoLuong("");
  };

  const xoaDong = (id) => {
    setDongTam(dongTam.filter((d) => d.id !== id));
  };

  const taoPhieu = () => {
    if (khoGui === khoNhan) {
      alert("Kho gửi và kho nhận phải khác nhau");
      return;
    }
    if (dongTam.length === 0) {
      alert("Phiếu chuyển chưa có dòng hàng nào");
      return;
    }

    const phieu = {
      id: Date.now(),
      code: "CK" + String(phieuChuyen.length + 1).padStart(4, "0"),
      dateSend: new Date().toLocaleString("vi-VN"),
      dateReceive: "",
      from: khoGui,
      to: khoNhan,
      lines: dongTam,
      status: "Đang chuyển",
    };

    setPhieuChuyen([phieu, ...phieuChuyen]);
    setDongTam([]);
  };

  const xacNhanNhan = (id) => {
    if (!window.confirm("Xác nhận kho nhận đã nhận đủ hàng?")) return;
    setPhieuChuyen(
      phieuChuyen.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "Đã nhận",
              dateReceive: new Date().toLocaleString("vi-VN"),
            }
          : p
      )
    );
  };

  const moTaDong = (lines) =>
    lines.map((d) => d.sku + " x " + d.quantity).join(", ");

  return (
    <div style={{ padding: 20 }}>
      <h2>Chuyển kho</h2>

      <div style={{ marginBottom: 16 }}>
        <label>Kho gửi: </label>
        <select value={khoGui} onChange={(e) => setKhoGui(e.target.value)}>
          {dsKho.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: 16 }}>Kho nhận: </label>
        <select value={khoNhan} onChange={(e) => setKhoNhan(e.target.value)}>
          {dsKho.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
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
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {dongTam.map((d) => (
            <tr key={d.id}>
              <td>{d.sku}</td>
              <td>{d.quantity}</td>
              <td>
                <button onClick={() => xoaDong(d.id)}>Bỏ dòng</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={taoPhieu} style={{ marginTop: 12 }}>
        Tạo phiếu chuyển
      </button>

      <h3 style={{ marginTop: 32 }}>Danh sách phiếu chuyển</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Kho gửi</th>
            <th>Kho nhận</th>
            <th>Hàng chuyển</th>
            <th>Ngày gửi</th>
            <th>Ngày nhận</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {phieuChuyen.map((p) => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.from}</td>
              <td>{p.to}</td>
              <td>{moTaDong(p.lines)}</td>
              <td>{p.dateSend}</td>
              <td>{p.dateReceive}</td>
              <td>
                <span
                  className={
                    "badge " + (p.status === "Đã nhận" ? "badge-la" : "badge-cam")
                  }
                >
                  {p.status}
                </span>
              </td>
              <td>
                {p.status === "Đang chuyển" && (
                  <button onClick={() => xacNhanNhan(p.id)}>
                    Xác nhận đã nhận
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransferPage;
