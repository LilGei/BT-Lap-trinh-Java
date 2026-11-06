import "../styles/PosCategoryFilter.css";

export const productCategories = [
  "All Products",
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Accessories",
  "Beauty & Personal Care",
  "Toys & Games",
  "Office Supplies",
  "Food & Beverage",
];

function PosCategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div
      className="pos-category-filter"
      role="group"
      aria-label="Product categories"
    >
      {productCategories.map((category) => (
        <button
          className={`pos-category-filter__button${
            selectedCategory === category
              ? " pos-category-filter__button--active"
              : ""
          }`}
          key={category}
          type="button"
          aria-pressed={selectedCategory === category}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default PosCategoryFilter;