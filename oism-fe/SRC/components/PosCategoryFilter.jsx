import "../styles/PosCategoryFilter.css";

const categories = [
  "All Products",
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Accessories",
];

function PosCategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div
      className="pos-category-filter"
      role="group"
      aria-label="Product categories"
    >
      {categories.map((category) => (
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