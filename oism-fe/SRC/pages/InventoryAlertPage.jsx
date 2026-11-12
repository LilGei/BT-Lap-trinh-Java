import { useMemo, useState } from "react";
import "../styles/InventoryAlertPage.css";

const initialProducts = [
  {
    id: 1,
    sku: "SKU-001",
    name: "Áo thun nam Basic",
    category: "Thời trang",
    warehouse: "Kho trung tâm",
    quantity: 5,
    minimum: 20,
    status: "critical",
  },
  {
    id: 2,
    sku: "SKU-002",
    name: "Quần jean nữ",
    category: "Thời trang",
    warehouse: "Kho trung tâm",
    quantity: 12,
    minimum: 15,
    status: "low",
  },
  {
    id: 3,
    sku: "SKU-003",
    name: "Tai nghe Bluetooth",
    category: "Điện tử",
    warehouse: "Kho chi nhánh 1",
    quantity: 0,
    minimum: 10,
    status: "out",
  },
  {
    id: 4,
    sku: "SKU-004",
    name: "Bình giữ nhiệt 500ml",
    category: "Gia dụng",
    warehouse: "Kho chi nhánh 1",
    quantity: 8,
    minimum: 20,
    status: "critical",
  },
  {
    id: 5,
    sku: "SKU-005",
    name: "Chuột không dây",
    category: "Điện tử",
    warehouse: "Kho trung tâm",
    quantity: 18,
    minimum: 15,
    status: "normal",
  },
  {
    id: 6,
    sku: "SKU-006",
    name: "Balo laptop",
    category: "Phụ kiện",
    warehouse: "Kho chi nhánh 2",
    quantity: 9,
    minimum: 12,
    status: "low",
  },
  {
    id: 7,
    sku: "SKU-007",
    name: "Sạc nhanh 20W",
    category: "Điện tử",
    warehouse: "Kho chi nhánh 2",
    quantity: 0,
    minimum: 8,
    status: "out",
  },
];

const statusLabels = {
  out: "Hết hàng",
  critical: "Rất thấp",
  low: "Sắp hết",
  normal: "An toàn",
};

function InventoryAlertPage() {
  const [products, setProducts] = useState(initialProducts);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [minimumInput, setMinimumInput] = useState("");

  const stats = useMemo(
    () => ({
      total: products.length,
      out: products.filter((p) => p.status === "out").length,
      critical: products.filter((p) => p.status === "critical").length,
      low: products.filter((p) => p.status === "low").length,
    }),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = keyword.toLowerCase().trim();

      const matchKeyword =
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search);

      const matchStatus =
        statusFilter === "all" || product.status === statusFilter;

      const matchWarehouse =
        warehouseFilter === "all" ||
        product.warehouse === warehouseFilter;

      return matchKeyword && matchStatus && matchWarehouse;
    });
  }, [products, keyword, statusFilter, warehouseFilter]);

  const openEdit = (product) => {
    setSelectedProduct(product);
    setMinimumInput(String(product.minimum));
  };

  const saveMinimum = (e) => {
    e.preventDefault();

    const value = Number(minimumInput);

    if (!Number.isInteger(value) || value < 0) {
      alert("Mức tồn tối thiểu phải là số nguyên không âm.");
      return;
    }

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== selectedProduct.id) return product;

        const status =
          product.quantity === 0
            ? "out"
            : product.quantity <= value * 0.5
            ? "critical"
            : product.quantity < value
            ? "low"
            : "normal";

        return { ...product, minimum: value, status };
      })
    );

    setSelectedProduct(null);
  };

  const exportCSV = () => {
    const header = [
      "SKU",
      "Tên sản phẩm",
      "Danh mục",
      "Kho",
      "Tồn hiện tại",
      "Tồn tối thiểu",
      "Trạng thái",
    ];

    const rows = filteredProducts.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.warehouse,
      p.quantity,
      p.minimum,
      statusLabels[p.status],
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "canh-bao-ton-kho.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="inventory-alert-page">
      <header className="iap-header">
        <div>
          <h1>Cảnh báo tồn kho</h1>
          <p>Theo dõi sản phẩm sắp hết hàng và cần bổ sung tồn kho.</p>
        </div>

        <button className="iap-export-btn" onClick={exportCSV}>
          <span>↓</span> Xuất báo cáo
        </button>
      </header>

      <section className="iap-stats">
        <div className="iap-stat-card">
          <div className="iap-stat-top">
            <span>Tổng sản phẩm theo dõi</span>
            <span className="iap-stat-icon blue">▦</span>
          </div>
          <strong>{stats.total}</strong>
          <small>Sản phẩm trong danh sách</small>
        </div>

        <div className="iap-stat-card">
          <div className="iap-stat-top">
            <span>Hết hàng</span>
            <span className="iap-stat-icon red">!</span>
          </div>
          <strong className="red-text">{stats.out}</strong>
          <small>Cần nhập hàng ngay</small>
        </div>

        <div className="iap-stat-card">
          <div className="iap-stat-top">
            <span>Tồn kho rất thấp</span>
            <span className="iap-stat-icon orange">!</span>
          </div>
          <strong className="orange-text">{stats.critical}</strong>
          <small>Nguy cơ thiếu hàng</small>
        </div>

        <div className="iap-stat-card">
          <div className="iap-stat-top">
            <span>Sắp hết hàng</span>
            <span className="iap-stat-icon yellow">◷</span>
          </div>
          <strong className="yellow-text">{stats.low}</strong>
          <small>Cần theo dõi</small>
        </div>
      </section>

      <section className="iap-warning">
        <span className="iap-warning-icon">!</span>
        <div>
          <strong>Cần chú ý tình trạng tồn kho</strong>
          <p>
            Có {stats.out + stats.critical} sản phẩm đang hết hàng hoặc có mức
            tồn kho rất thấp.
          </p>
        </div>
      </section>

      <section className="iap-panel">
        <div className="iap-panel-heading">
          <div>
            <h2>Danh sách cảnh báo</h2>
            <p>Kiểm tra số lượng tồn và mức tồn tối thiểu của từng sản phẩm.</p>
          </div>
        </div>

        <div className="iap-filters">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="out">Hết hàng</option>
            <option value="critical">Rất thấp</option>
            <option value="low">Sắp hết</option>
            <option value="normal">An toàn</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="all">Tất cả kho</option>
            <option value="Kho trung tâm">Kho trung tâm</option>
            <option value="Kho chi nhánh 1">Kho chi nhánh 1</option>
            <option value="Kho chi nhánh 2">Kho chi nhánh 2</option>
          </select>

          <button
            className="iap-reset-btn"
            onClick={() => {
              setKeyword("");
              setStatusFilter("all");
              setWarehouseFilter("all");
            }}
          >
            Đặt lại
          </button>
        </div>

        <div className="iap-table-wrap">
          <table className="iap-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th>Kho</th>
                <th>Tồn hiện tại</th>
                <th>Tồn tối thiểu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="iap-sku">{product.sku}</td>
                  <td>
                    <strong>{product.name}</strong>
                    <small>{product.category}</small>
                  </td>
                  <td>{product.warehouse}</td>
                  <td>
                    <strong
                      className={
                        product.quantity === 0
                          ? "red-text"
                          : product.quantity < product.minimum
                          ? "orange-text"
                          : ""
                      }
                    >
                      {product.quantity}
                    </strong>
                    <small>Sản phẩm</small>
                  </td>
                  <td>{product.minimum}</td>
                  <td>
                    <span className={`iap-status ${product.status}`}>
                      {statusLabels[product.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="iap-edit-btn"
                      onClick={() => openEdit(product)}
                    >
                      Điều chỉnh
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="iap-empty">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="iap-table-footer">
          Hiển thị {filteredProducts.length} / {products.length} sản phẩm
        </div>
      </section>

      {selectedProduct && (
        <div
          className="iap-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedProduct(null);
          }}
        >
          <form className="iap-modal" onSubmit={saveMinimum}>
            <div className="iap-modal-header">
              <div>
                <h2>Điều chỉnh mức tồn tối thiểu</h2>
                <p>{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
              >
                ×
              </button>
            </div>

            <div className="iap-modal-info">
              <span>SKU: {selectedProduct.sku}</span>
              <span>Tồn hiện tại: {selectedProduct.quantity}</span>
            </div>

            <label>Mức tồn tối thiểu mới</label>
            <input
              type="number"
              min="0"
              step="1"
              value={minimumInput}
              onChange={(e) => setMinimumInput(e.target.value)}
              required
            />

            <div className="iap-modal-actions">
              <button
                type="button"
                className="iap-reset-btn"
                onClick={() => setSelectedProduct(null)}
              >
                Hủy
              </button>
              <button type="submit" className="iap-save-btn">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default InventoryAlertPage;