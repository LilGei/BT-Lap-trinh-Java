import "../styles/PosCustomerSection.css";

const mockCustomers = [
  "Walk-in Customer",
  "Nguyễn Minh Anh",
  "Trần Gia Bảo",
  "Lê Thu Hà",
];

function PosCustomerSection({ customer, onCustomerChange }) {
  return (
    <section className="pos-customer" aria-labelledby="pos-customer-title">
      <div className="pos-customer__heading">
        <div>
          <span className="pos-customer__eyebrow">CUSTOMER</span>
          <h3 id="pos-customer-title">Khách hàng</h3>
        </div>
        <span className="pos-customer__optional">Tùy chọn</span>
      </div>

      <label className="pos-customer__select">
        <svg
          aria-hidden="true"
          className="pos-customer__icon"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20v-1.5a7 7 0 0 1 14 0V20H5Z" />
        </svg>
        <select
          value={customer}
          onChange={(event) => onCustomerChange(event.target.value)}
          aria-label="Chọn khách hàng"
        >
          {mockCustomers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pos-customer__chevron"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </label>

      <p className="pos-customer__hint">
        Có thể chọn khách hàng để lưu thông tin đơn.
      </p>
    </section>
  );
}

export default PosCustomerSection;