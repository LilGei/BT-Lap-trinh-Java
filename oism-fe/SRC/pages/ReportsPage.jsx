import { useMemo, useState } from "react";
import "../styles/ReportsPage.css";

const reportData = {
  "7": {
    revenue: 48650000,
    cost: 30200000,
    profit: 18450000,
    orders: 128,
    previousRevenue: 42100000,
    previousProfit: 15800000,
    channels: [
      { name: "Website", value: 45, amount: 21892500 },
      { name: "POS", value: 35, amount: 17027500 },
      { name: "Shopee", value: 20, amount: 9730000 },
    ],
    chart: [
      { label: "T2", revenue: 520 },
      { label: "T3", revenue: 680 },
      { label: "T4", revenue: 590 },
      { label: "T5", revenue: 850 },
      { label: "T6", revenue: 720 },
      { label: "T7", revenue: 950 },
      { label: "CN", revenue: 880 },
    ],
  },
  "30": {
    revenue: 186500000,
    cost: 119200000,
    profit: 67300000,
    orders: 526,
    previousRevenue: 165000000,
    previousProfit: 58200000,
    channels: [
      { name: "Website", value: 42, amount: 78330000 },
      { name: "POS", value: 38, amount: 70870000 },
      { name: "Shopee", value: 20, amount: 37300000 },
    ],
    chart: [
      { label: "Tuần 1", revenue: 520 },
      { label: "Tuần 2", revenue: 680 },
      { label: "Tuần 3", revenue: 590 },
      { label: "Tuần 4", revenue: 850 },
    ],
  },
  "90": {
    revenue: 542800000,
    cost: 348600000,
    profit: 194200000,
    orders: 1548,
    previousRevenue: 498000000,
    previousProfit: 172000000,
    channels: [
      { name: "Website", value: 40, amount: 217120000 },
      { name: "POS", value: 37, amount: 200836000 },
      { name: "Shopee", value: 23, amount: 124844000 },
    ],
    chart: [
      { label: "Tháng 1", revenue: 620 },
      { label: "Tháng 2", revenue: 780 },
      { label: "Tháng 3", revenue: 950 },
    ],
  },
};

const topProducts = [
  {
    id: 1,
    name: "Áo thun nam Basic",
    sku: "SKU-001",
    quantity: 320,
    revenue: 32000000,
    profit: 11200000,
  },
  {
    id: 2,
    name: "Tai nghe Bluetooth",
    sku: "SKU-003",
    quantity: 215,
    revenue: 26875000,
    profit: 8050000,
  },
  {
    id: 3,
    name: "Quần jean nữ",
    sku: "SKU-002",
    quantity: 180,
    revenue: 25200000,
    profit: 9000000,
  },
  {
    id: 4,
    name: "Bình giữ nhiệt 500ml",
    sku: "SKU-004",
    quantity: 156,
    revenue: 15600000,
    profit: 5460000,
  },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompact = (value) =>
  new Intl.NumberFormat("vi-VN").format(value);

function ReportsPage() {
  const [period, setPeriod] = useState("30");
  const [channelFilter, setChannelFilter] = useState("all");

  const data = reportData[period];

  const revenueGrowth =
    ((data.revenue - data.previousRevenue) / data.previousRevenue) * 100;

  const profitGrowth =
    ((data.profit - data.previousProfit) / data.previousProfit) * 100;

  const chartMax = Math.max(...data.chart.map((item) => item.revenue));

  const filteredChannels = useMemo(() => {
    if (channelFilter === "all") return data.channels;
    return data.channels.filter((item) => item.name === channelFilter);
  }, [data, channelFilter]);

  const exportReport = () => {
    const rows = [
      ["Chỉ số", "Giá trị"],
      ["Doanh thu", data.revenue],
      ["Giá vốn", data.cost],
      ["Lợi nhuận gộp", data.profit],
      ["Số đơn hàng", data.orders],
      [],
      ["Kênh bán", "Tỷ trọng (%)", "Doanh thu"],
      ...data.channels.map((item) => [
        item.name,
        item.value,
        item.amount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-doanh-thu-${period}-ngay.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <header className="rp-header">
        <div>
          <h1>Doanh thu & Lợi nhuận</h1>
          <p>
            Theo dõi hiệu quả kinh doanh và phân tích doanh thu toàn hệ thống.
          </p>
        </div>

        <button className="rp-export-btn" onClick={exportReport}>
          ↓ Xuất báo cáo
        </button>
      </header>

      <section className="rp-toolbar">
        <div>
          <span className="rp-toolbar-label">Khoảng thời gian</span>
          <div className="rp-periods">
            <button
              className={period === "7" ? "active" : ""}
              onClick={() => setPeriod("7")}
            >
              7 ngày
            </button>
            <button
              className={period === "30" ? "active" : ""}
              onClick={() => setPeriod("30")}
            >
              30 ngày
            </button>
            <button
              className={period === "90" ? "active" : ""}
              onClick={() => setPeriod("90")}
            >
              90 ngày
            </button>
          </div>
        </div>

        <span className="rp-updated">Dữ liệu minh họa</span>
      </section>

      <section className="rp-stats">
        <div className="rp-stat-card">
          <div className="rp-stat-heading">
            <span>Tổng doanh thu</span>
            <span className="rp-stat-icon blue">↗</span>
          </div>
          <strong>{formatMoney(data.revenue)}</strong>
          <small className="rp-growth positive">
            ↑ {revenueGrowth.toFixed(1)}% so với kỳ trước
          </small>
        </div>

        <div className="rp-stat-card">
          <div className="rp-stat-heading">
            <span>Giá vốn hàng bán</span>
            <span className="rp-stat-icon orange">▤</span>
          </div>
          <strong>{formatMoney(data.cost)}</strong>
          <small>Chi phí vốn hàng hóa</small>
        </div>

        <div className="rp-stat-card">
          <div className="rp-stat-heading">
            <span>Lợi nhuận gộp</span>
            <span className="rp-stat-icon green">↗</span>
          </div>
          <strong className="rp-green">{formatMoney(data.profit)}</strong>
          <small className="rp-growth positive">
            ↑ {profitGrowth.toFixed(1)}% so với kỳ trước
          </small>
        </div>

        <div className="rp-stat-card">
          <div className="rp-stat-heading">
            <span>Tổng đơn hàng</span>
            <span className="rp-stat-icon purple">▦</span>
          </div>
          <strong>{formatCompact(data.orders)}</strong>
          <small>Đơn hàng trong kỳ</small>
        </div>
      </section>

      <section className="rp-main-grid">
        <div className="rp-card rp-chart-card">
          <div className="rp-card-heading">
            <div>
              <h2>Biểu đồ doanh thu</h2>
              <p>Doanh thu theo từng giai đoạn</p>
            </div>
            <span className="rp-legend">
              <i /> Doanh thu
            </span>
          </div>

          <div className="rp-chart">
            <div className="rp-y-labels">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            <div className="rp-chart-content">
              <div className="rp-grid-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className="rp-bars">
                {data.chart.map((item) => (
                  <div className="rp-bar-column" key={item.label}>
                    <div className="rp-bar-track">
                      <div
                        className="rp-bar"
                        style={{
                          height: `${(item.revenue / chartMax) * 100}%`,
                        }}
                        title={`${item.label}: ${item.revenue}`}
                      />
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rp-card rp-channel-card">
          <div className="rp-card-heading">
            <div>
              <h2>Doanh thu theo kênh</h2>
              <p>Phân bổ doanh thu từng kênh bán</p>
            </div>
          </div>

          <label className="rp-channel-filter">
            Lọc kênh bán
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="all">Tất cả kênh</option>
              <option value="Website">Website</option>
              <option value="POS">POS</option>
              <option value="Shopee">Shopee</option>
            </select>
          </label>

          <div className="rp-channel-list">
            {filteredChannels.map((channel) => (
              <div className="rp-channel-item" key={channel.name}>
                <div className="rp-channel-info">
                  <strong>{channel.name}</strong>
                  <span>{channel.value}%</span>
                </div>
                <div className="rp-progress">
                  <i style={{ width: `${channel.value}%` }} />
                </div>
                <small>{formatMoney(channel.amount)}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rp-card rp-products-card">
        <div className="rp-card-heading">
          <div>
            <h2>Sản phẩm kinh doanh nổi bật</h2>
            <p>Danh sách sản phẩm có doanh thu và lợi nhuận tốt.</p>
          </div>
        </div>

        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>Đã bán</th>
                <th>Doanh thu</th>
                <th>Lợi nhuận gộp</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td className="rp-sku">{product.sku}</td>
                  <td>{formatCompact(product.quantity)}</td>
                  <td>{formatMoney(product.revenue)}</td>
                  <td className="rp-green">
                    <strong>{formatMoney(product.profit)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rp-note">
        <span>ⓘ</span>
        Báo cáo đang sử dụng dữ liệu minh họa ở Frontend. Số liệu thực tế sẽ
        được cập nhật khi tích hợp API báo cáo từ Backend.
      </div>
    </div>
  );
}

export default ReportsPage;