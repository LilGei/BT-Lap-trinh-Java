import { useEffect, useState } from "react";
import "../../styles/CartCustomer.css";

function CartCustomer({ onCustomerChange }) {
  const [customers, setCustomers] = useState([
    { id: "walk-in", name: "Walk-in Customer", phone: "" },
  ]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("walk-in");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCustomerMenu, setShowCustomerMenu] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const [customerError, setCustomerError] = useState("");

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ??
    customers[0];

  useEffect(() => {
    onCustomerChange(selectedCustomer);
  }, [onCustomerChange, selectedCustomer]);

  const handleCustomerFormChange = (event) => {
    const { name, value } = event.target;
    setCustomerForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleAddCustomer = (event) => {
    event.preventDefault();

    const name = customerForm.name.trim();
    const phone = customerForm.phone.trim();

    if (!name || !phone) {
      setCustomerError("Enter both customer name and phone number.");
      return;
    }

    const newCustomer = { id: `${Date.now()}`, name, phone };
    setCustomers((currentCustomers) => [...currentCustomers, newCustomer]);
    setSelectedCustomerId(newCustomer.id);
    setCustomerForm({ name: "", phone: "" });
    setCustomerError("");
    setShowCustomerForm(false);
    setShowCustomerMenu(false);
  };

  const closeCustomerForm = () => {
    setShowCustomerForm(false);
    setCustomerForm({ name: "", phone: "" });
    setCustomerError("");
  };

  return (
    <section className="pos-customer" aria-label="Customer">
      <div className="pos-customer-heading">
        <h3>Customer</h3>
        <button
          type="button"
          className="pos-add-customer-button"
          onClick={() => {
            setShowCustomerForm((isOpen) => !isOpen);
            setShowCustomerMenu(false);
            setCustomerError("");
          }}
          aria-expanded={showCustomerForm}
        >
          + Add New
        </button>
      </div>

      <div className="pos-customer-picker">
        <button
          type="button"
          className="pos-selected-customer"
          onClick={() => setShowCustomerMenu((isOpen) => !isOpen)}
          aria-expanded={showCustomerMenu}
          aria-haspopup="listbox"
        >
          <span className="pos-customer-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            </svg>
          </span>
          <span className="pos-selected-customer-info">
            <strong>{selectedCustomer.name}</strong>
            <small>{selectedCustomer.phone || "No loyalty points"}</small>
          </span>
          <svg
            className={`pos-customer-chevron ${
              showCustomerMenu ? "open" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="m7 10 5 5 5-5" />
          </svg>
        </button>

        {showCustomerMenu && (
          <div
            className="pos-customer-dropdown"
            role="listbox"
            aria-label="Select customer"
          >
            {customers.map((customer) => (
              <button
                type="button"
                className="pos-customer-option"
                key={customer.id}
                role="option"
                aria-selected={customer.id === selectedCustomerId}
                onClick={() => {
                  setSelectedCustomerId(customer.id);
                  setShowCustomerMenu(false);
                }}
              >
                <span>{customer.name}</span>
                <small>{customer.phone || "No loyalty points"}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCustomerForm && (
        <form className="pos-customer-form" onSubmit={handleAddCustomer}>
          <input
            type="text"
            name="name"
            value={customerForm.name}
            onChange={handleCustomerFormChange}
            placeholder="Customer name"
            aria-label="Customer name"
            autoComplete="name"
            autoFocus
          />
          <input
            type="tel"
            name="phone"
            value={customerForm.phone}
            onChange={handleCustomerFormChange}
            placeholder="Phone number"
            aria-label="Customer phone number"
            autoComplete="tel"
          />
          {customerError && (
            <p className="pos-customer-error" role="alert">
              {customerError}
            </p>
          )}
          <div className="pos-customer-form-actions">
            <button
              type="button"
              className="pos-cancel-customer-button"
              onClick={closeCustomerForm}
            >
              Cancel
            </button>
            <button type="submit" className="pos-save-customer-button">
              Add Customer
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default CartCustomer;
