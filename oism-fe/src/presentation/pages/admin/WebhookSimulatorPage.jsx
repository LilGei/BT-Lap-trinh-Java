import { useState } from "react";
import orderApi from "@/infrastructure/api/orderApi";
import "@/presentation/styles/WebhookSimulatorPage.css";

// Mẫu dữ liệu đơn gửi lên backend (kênh bán lấy ở ô chọn bên dưới).
// Không điền external_order_id thì backend tự sinh mã, bấm gửi nhiều lần không bị trùng.
const initialPayload = {
  customer_name: "Nguyen Van A",
  total: 450000,
};

// Các kênh bán hợp lệ trong database
const eventOptions = ["SHOPEE", "TIKTOK", "LAZADA"];

// API backend nhận đơn giả lập
const API_PATH = "/orders/webhook-simulate";

function WebhookSimulatorPage() {
  const [event, setEvent] = useState("SHOPEE");
  const [endpoint, setEndpoint] = useState(API_PATH);
  const [payload, setPayload] = useState(
    JSON.stringify(initialPayload, null, 2)
  );
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);

  // Đổi kênh bán
  const handleEventChange = (value) => {
    setEvent(value);
  };

  // Gửi đơn giả lập lên backend
  const handleSend = async () => {
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
    setSending(true);

    try {
      // axiosClient đã trả về data: { message, order }
      const res = await orderApi.simulateWebhook({
        ...parsedPayload,
        channel: event,
      });

      setResult({
        success: true,
        status: 201,
        message: res?.message || "Webhook mô phỏng được xử lý thành công.",
        time,
      });

      setHistory((prev) => [
        { id: Date.now(), event, endpoint, status: 201, time },
        ...prev,
      ]);
    } catch (err) {
      const status = err.response?.status || 0;

      setResult({
        success: false,
        status,
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Gửi webhook thất bại. Kiểm tra backend đã chạy chưa.",
        time,
      });

      setHistory((prev) => [
        { id: Date.now(), event, endpoint, status, time },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setEvent("SHOPEE");
    setEndpoint(API_PATH);
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
                    Gửi một đơn giả lập từ kênh bán lên backend. Đơn sẽ xuất hiện ở trang Đơn hàng.
        </section>

        <section className="webhook-card">
          <h2>Cấu hình Webhook</h2>

          <div className="webhook-field">
            <label>Kênh bán</label>
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
            <label>API gọi đến</label>
            <input
              value={endpoint}
              readOnly
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

                        <button
              className="webhook-send"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Đang gửi..." : "Gửi thử Webhook"}
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
                    <th>Kênh</th>
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