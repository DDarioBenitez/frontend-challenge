import { categories, suppliers, products } from "../data/products";
import "./ProductFilters.css";

interface ProductFiltersProps {
    selectedCategory: string;
    searchQuery: string;
    sortBy: string;
    onCategoryChange: (category: string) => void;
    onSearchChange: (search: string) => void;
    onSortChange: (sort: string) => void;
    onSupplierChange?: (supplier: string) => void; // Optional for future use

    // --- New props for price range & clear (added) ---
    priceMin?: number | null;
    priceMax?: number | null;
    onPriceRangeChange?: (min: number | null, max: number | null) => void;
    onClearFilters?: () => void;
}

const ProductFilters = ({
    selectedCategory,
    searchQuery,
    sortBy,
    onCategoryChange,
    onSearchChange,
    onSortChange,
    onSupplierChange,

    // --- New props (added) ---
    priceMin,
    priceMax,
    onPriceRangeChange,
    onClearFilters,
}: ProductFiltersProps) => {
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

    // --- Compute global price hints for placeholders (added) ---
    // NOTE: we compute min/max unit price across products for better UX in placeholders
    const allUnitPrices: number[] = products.flatMap((p) => {
        const breaks = (p.priceBreaks || []).map((b) => b.price);
        const candidates = [p.basePrice, ...breaks];
        return [Math.min(...candidates), Math.max(...candidates)];
    });
    const globalMinPrice = allUnitPrices.length ? Math.min(...allUnitPrices) : 0;
    const globalMaxPrice = allUnitPrices.length ? Math.max(...allUnitPrices) : 0;

    // --- Local helpers to handle price input changes (added) ---
    const handleMinChange = (value: string) => {
        const v = value.trim();
        const min = v === "" ? null : Math.max(0, Number.parseInt(v, 10) || 0);
        onPriceRangeChange?.(min, priceMax ?? null);
    };
    const handleMaxChange = (value: string) => {
        const v = value.trim();
        const max = v === "" ? null : Math.max(0, Number.parseInt(v, 10) || 0);
        onPriceRangeChange?.(priceMin ?? null, max);
    };

    return (
        <div className="product-filters">
            <div className="filters-card">
                {/* === Top row: search (compact), price range, sort, and clear-all === */}
                <div className="filters-header">
                    {/* Search Bar */}
                    <div className="search-section compact">
                        <div className="search-box compact">
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

                    {/* Price range (min - max) */}
                    <div className="price-range">
                        <label className="filter-title p1-medium price-range__label">Precio</label>
                        <div className="price-range__inputs">
                            <div className="price-field">
                                <span className="prefix">$</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    placeholder={globalMinPrice ? String(globalMinPrice) : "0"}
                                    value={priceMin ?? ""}
                                    onChange={(e) => handleMinChange(e.target.value)}
                                    className="price-input p1"
                                    aria-label="Precio mínimo"
                                />
                            </div>
                            <span className="price-dash">—</span>
                            <div className="price-field">
                                <span className="prefix">$</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    placeholder={globalMaxPrice ? String(globalMaxPrice) : "0"}
                                    value={priceMax ?? ""}
                                    onChange={(e) => handleMaxChange(e.target.value)}
                                    className="price-input p1"
                                    aria-label="Precio máximo"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div className="sort-inline">
                        <label htmlFor="sortBy" className="filter-title p1-medium sort-label">
                            Ordenar por
                        </label>
                        <select id="sortBy" value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="sort-select p1">
                            <option value="name">Nombre A-Z</option>
                            <option value="+price">Precio (ascendente)</option>
                            <option value="-price">Precio (descendente)</option>
                            <option value="stock">Stock disponible</option>
                        </select>
                    </div>
                    {/* Clear all */}
                    <div className="clear-all-wrap">
                        <button
                            type="button"
                            className="btn btn-ghost clear-all-btn"
                            onClick={() => onClearFilters?.()}
                            aria-label="Limpiar filtros"
                            title="Limpiar filtros"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="filters-grid">
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

                    {/* Quick Stats - Bug: hardcoded values instead of dynamic */}
                    <div className="filter-section">
                        <h3 className="filter-title p1-medium">Proveedores</h3>
                        <div className="supplier-list">
                            {updatedSuppliers.map((supplier) => (
                                <div key={supplier.id} className="supplier-item" onClick={() => onSupplierChange?.(supplier.id)}>
                                    <span className="supplier-name l1">{supplier.name}</span>
                                    <span className="supplier-count l1">{supplier.products}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductFilters;
