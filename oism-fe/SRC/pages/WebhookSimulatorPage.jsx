import { useState } from "react";
import "./WebhookSimulatorPage.css";

const initialPayload = {
  event: "order.created",
  timestamp: "2026-11-07T08:00:00+07:00",
  data: {
    orderId: "ORD-00128",
    channel: "Website",
    totalAmount: 1250000,
    status: "Chờ xử lý",
  },
};

const eventOptions = [
  "order.created",
  "order.updated",
  "order.cancelled",
  "inventory.low_stock",
];

function WebhookSimulatorPage() {
  const [event, setEvent] = useState("order.created");
  const [endpoint, setEndpoint] = useState(
    "https://example.com/webhook"
  );
  const [payload, setPayload] = useState(
    JSON.stringify(initialPayload, null, 2)
  );
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleEventChange = (value) => {
    setEvent(value);

    try {
      const parsed = JSON.parse(payload);
      parsed.event = value;
      setPayload(JSON.stringify(parsed, null, 2));
    } catch {
      // Không ghi đè JSON khi nội dung đang chỉnh sửa bị lỗi.
    }
  };

  const handleSend = () => {
    if (!endpoint.trim()) {
      setResult({
        success: false,
        message: "Vui lòng nhập Endpoint URL.",
      });
      return;
    }

    let parsedPayload;

    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setResult({
        success: false,
        message: "JSON không hợp lệ. Vui lòng kiểm tra lại Payload.",
      });
      return;
    }

    const time = new Date().toLocaleString("vi-VN");

    const response = {
      success: true,
      status: 200,
      message: "Webhook mô phỏng được xử lý thành công.",
      time,
    };

    setResult(response);

    setHistory((prev) => [
      {
        id: Date.now(),
        event,
        endpoint,
        status: 200,
        time,
      },
      ...prev,
    ]);

    console.log("Webhook payload mô phỏng:", parsedPayload);
  };

  const handleReset = () => {
    setEvent("order.created");
    setEndpoint("https://example.com/webhook");
    setPayload(JSON.stringify(initialPayload, null, 2));
    setResult(null);
  };

  return (
    <div className="webhook-page">
      <main className="webhook-main">
        <header className="webhook-header">
          <div>
            <h1>Webhook Simulator</h1>
            <p>
              Kiểm tra và mô phỏng các sự kiện gửi Webhook trong hệ thống.
            </p>
          </div>

          <span className="webhook-badge">Development</span>
        </header>

        <section className="webhook-notice">
          <span>ⓘ</span>
          Đây là chức năng mô phỏng Frontend. Chưa gửi request thật đến
          Endpoint.
        </section>

        <section className="webhook-card">
          <h2>Cấu hình Webhook</h2>

          <div className="webhook-field">
            <label>Loại sự kiện</label>
            <select
              value={event}
              onChange={(e) => handleEventChange(e.target.value)}
            >
              {eventOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="webhook-field">
            <label>Endpoint URL</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="Nhập Endpoint URL..."
            />
          </div>

          <div className="webhook-field">
            <label>JSON Payload</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              spellCheck="false"
            />
          </div>

          <div className="webhook-actions">
            <button className="webhook-reset" onClick={handleReset}>
              Đặt lại
            </button>

            <button className="webhook-send" onClick={handleSend}>
              Gửi thử Webhook
            </button>
          </div>
        </section>

        {result && (
          <section className="webhook-card webhook-result">
            <h2>Kết quả phản hồi</h2>

            <div className="webhook-result-row">
              <span>Trạng thái</span>
              <strong className={result.success ? "success" : "error"}>
                {result.success ? `HTTP ${result.status}` : "Thất bại"}
              </strong>
            </div>

            <div className="webhook-result-row">
              <span>Thông báo</span>
              <strong>{result.message}</strong>
            </div>

            {result.time && (
              <div className="webhook-result-row">
                <span>Thời gian</span>
                <strong>{result.time}</strong>
              </div>
            )}
          </section>
        )}

        <section className="webhook-card">
          <h2>Lịch sử gửi Webhook</h2>

          {history.length === 0 ? (
            <div className="webhook-empty">
              Chưa có lịch sử gửi Webhook.
            </div>
          ) : (
            <div className="webhook-table-wrapper">
              <table className="webhook-table">
                <thead>
                  <tr>
                    <th>Sự kiện</th>
                    <th>Endpoint</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.event}</td>
                      <td>{item.endpoint}</td>
                      <td>{item.time}</td>
                      <td>
                        <span className="webhook-status">
                          HTTP {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default WebhookSimulatorPage;