import { useState } from "react";
import "../styles/PosCustomerSection.css";

const initialCustomers = [
  { name: "Walk-in Customer", phone: "" },
  { name: "Nguyễn Minh Anh", phone: "0901 234 567" },
  { name: "Trần Gia Bảo", phone: "0912 345 678" },
  { name: "Lê Thu Hà", phone: "0987 654 321" },
];

function PosCustomerSection({ customer, onCustomerChange }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const selectedCustomer = customers.find((item) => item.name === customer);

  const addCustomer = (event) => {
    event.preventDefault();
    const name = newCustomerName.trim();
    const phone = newCustomerPhone.trim();
    if (!name) return;

    const existingCustomer = customers.find(
      (item) =>
        item.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi")
    );

    if (existingCustomer) {
      onCustomerChange(existingCustomer.name);
    } else {
      setCustomers((currentCustomers) => [
        ...currentCustomers,
        { name, phone },
      ]);
      onCustomerChange(name);
    }

    setNewCustomerName("");
    setNewCustomerPhone("");
    setIsAddingCustomer(false);
  };

  return (
    <section className="pos-customer" aria-labelledby="pos-customer-title">
      <div className="pos-customer__heading">
        <h3 id="pos-customer-title">Khách hàng</h3>
        <button
          className="pos-customer__new"
          type="button"
          onClick={() => setIsAddingCustomer((isOpen) => !isOpen)}
          aria-expanded={isAddingCustomer}
        >
          <span aria-hidden="true">+</span>
          New
        </button>
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
          {customers.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
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

      {selectedCustomer?.phone && (
        <div className="pos-customer__contact">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M7 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
            <path d="M10 17.5h4" />
          </svg>
          <span>{selectedCustomer.phone}</span>
        </div>
      )}

      {isAddingCustomer && (
        <form className="pos-customer__form" onSubmit={addCustomer}>
          <input
            type="text"
            value={newCustomerName}
            onChange={(event) => setNewCustomerName(event.target.value)}
            placeholder="Tên khách hàng"
            aria-label="Tên khách hàng mới"
            autoFocus
            required
          />
          <input
            type="tel"
            value={newCustomerPhone}
            onChange={(event) => setNewCustomerPhone(event.target.value)}
            placeholder="Số điện thoại (không bắt buộc)"
            aria-label="Số điện thoại khách hàng"
          />
          <div className="pos-customer__form-actions">
            <button
              className="pos-customer__cancel"
              type="button"
              onClick={() => {
                setIsAddingCustomer(false);
                setNewCustomerName("");
                setNewCustomerPhone("");
              }}
            >
              Hủy
            </button>
            <button className="pos-customer__save" type="submit">
              Thêm khách
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default PosCustomerSection;