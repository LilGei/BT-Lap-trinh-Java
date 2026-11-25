import { useEffect, useRef, useState } from "react";
import "@/presentation/styles/PosOnlineOrderNotification.css";

export const POS_ONLINE_ORDER_EVENT = "oism:online-order";

function PosOnlineOrderNotification() {
  const [notification, setNotification] = useState(null);
  const audioContextRef = useRef(null);
  const dismissTimeoutRef = useRef(null);

  useEffect(() => {
    const activateAudio = () => {
      if (audioContextRef.current) return;

      const AudioContextConstructor =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) {
        console.warn("Web Audio is not supported in this browser.");
        return;
      }

      audioContextRef.current = new AudioContextConstructor();
      audioContextRef.current.resume().catch((error) => {
        console.error("Unable to enable POS notification sound.", error);
      });
    };

    window.addEventListener("pointerdown", activateAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", activateAudio);
      if (dismissTimeoutRef.current) {
        window.clearTimeout(dismissTimeoutRef.current);
      }
      audioContextRef.current?.close().catch((error) => {
        console.error("Unable to close POS notification audio.", error);
      });
    };
  }, []);

  useEffect(() => {
    const handleOnlineOrder = (event) => {
      const order = event.detail;
      if (!order || (typeof order.id !== "string" && typeof order.id !== "number")) {
        console.error("Received an online-order event without a valid order ID.");
        return;
      }

      setNotification({
        id: String(order.id),
        customerName:
          typeof order.customerName === "string" ? order.customerName : "",
        total: Number.isFinite(order.total) ? order.total : null,
      });

      if (dismissTimeoutRef.current) {
        window.clearTimeout(dismissTimeoutRef.current);
      }
      dismissTimeoutRef.current = window.setTimeout(
        () => setNotification(null),
        8000
      );

      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state !== "running") return;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startTime = audioContext.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.35);
    };

    window.addEventListener(POS_ONLINE_ORDER_EVENT, handleOnlineOrder);
    return () =>
      window.removeEventListener(POS_ONLINE_ORDER_EVENT, handleOnlineOrder);
  }, []);

  if (!notification) return null;

  return (
    <aside className="pos-online-order-notification" role="alert" aria-live="assertive">
      <span className="pos-online-order-notification-icon" aria-hidden="true">
        ↗
      </span>
      <div className="pos-online-order-notification-content">
        <strong>Có đơn hàng online mới</strong>
        <span>Mã đơn: {notification.id}</span>
        {notification.customerName && (
          <span>Khách hàng: {notification.customerName}</span>
        )}
        {notification.total !== null && (
          <span>
            Giá trị: {new Intl.NumberFormat("vi-VN").format(notification.total)}đ
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setNotification(null)}
        aria-label="Đóng thông báo đơn hàng online"
      >
        ×
      </button>
    </aside>
  );
}

export default PosOnlineOrderNotification;
