import { categories, suppliers, products } from "../data/products";
import "./ProductFilters.css";

interface ProductFiltersProps {
    selectedCategory: string;
    searchQuery: string;
    sortBy: string;
    onCategoryChange: (category: string) => void;
    onSearchChange: (search: string) => void;
    onSortChange: (sort: string) => void;
}

const ProductFilters = ({ selectedCategory, searchQuery, sortBy, onCategoryChange, onSearchChange, onSortChange }: ProductFiltersProps) => {
    // Calculate product count for each category and supplier dynamically
    const counts = products.reduce(
        (acc, product) => {
            acc.categories[product.category] = (acc.categories[product.category] || 0) + 1;
            acc.suppliers[product.supplier] = (acc.suppliers[product.supplier] || 0) + 1;
            return acc;
        },
        { categories: {} as Record<string, number>, suppliers: {} as Record<string, number> }
    );

    // Update categories with product count
    const updatedCategories = categories.map((category) => {
        const count = category.id === "all" ? products.length : counts.categories[category.id] || 0;
        return { ...category, count };
    });

    // Update suppliers with product count
    const updatedSuppliers = suppliers.map((supplier) => ({
        ...supplier,
        products: counts.suppliers[supplier.id] || 0,
    }));

    return (
        <div className="product-filters">
            <div className="filters-card">
                {/* Search Bar */}
                <div className="search-section">
                    <div className="search-box">
                        <span className="material-icons">search</span>
                        <input
                            type="text"
                            placeholder="Buscar productos, SKU..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="search-input p1"
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => onSearchChange("")}>
                                <span className="material-icons">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Filters */}
                <div className="filter-section">
                    <h3 className="filter-title p1-medium">Categorías</h3>
                    <div className="category-filters">
                        {updatedCategories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-btn ${selectedCategory === category.id ? "active" : ""}`}
                                onClick={() => onCategoryChange(category.id)}
                            >
                                <span className="material-icons">{category.icon}</span>
                                <span className="category-name l1">{category.name}</span>
                                <span className="category-count l1">({category.count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Options */}
                <div className="filter-section">
                    <h3 className="filter-title p1-medium">Ordenar por</h3>
                    <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="sort-select p1">
                        <option value="name">Nombre A-Z</option>
                        <option value="price">Precio</option>
                        <option value="stock">Stock disponible</option>
                    </select>
                </div>

                {/* Quick Stats - Bug: hardcoded values instead of dynamic */}
                <div className="filter-section">
                    <h3 className="filter-title p1-medium">Proveedores</h3>
                    <div className="supplier-list">
                        {updatedSuppliers.map((supplier) => (
                            <div key={supplier.id} className="supplier-item">
                                <span className="supplier-name l1">{supplier.name}</span>
                                <span className="supplier-count l1">{supplier.products}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductFilters;
