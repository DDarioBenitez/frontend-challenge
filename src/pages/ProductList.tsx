import { useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { products as allProducts, categories } from "../data/products";
import { Product } from "../types/Product";
import "./ProductList.css";
import QuoteModal from "../components/QuoteModal";

const ProductList = () => {
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [min, setMin] = useState<number | null>(null);
    const [max, setMax] = useState<number | null>(null);

    //  Quote modal local state (page-scoped, not global)
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [quoteProduct, setQuoteProduct] = useState<Product | null>(null);
    const [quoteQty, setQuoteQty] = useState(1); // list context -> default 1

    // Helper: minimal unit price (base or best break)
    const productMinUnitPrice = (p: Product) => {
        let m = p.basePrice;
        if (p.priceBreaks && p.priceBreaks.length) {
            for (const b of p.priceBreaks) if (b.price < m) m = b.price;
        }
        return m;
    };

    // Filter and sort products based on criteria
    const filterProducts = (category: string, search: string, sort: string, minPrice: number | null, maxPrice: number | null) => {
        let filtered = [...allProducts];

        // Category filter
        if (category !== "all") {
            filtered = filtered.filter((product) => product.category === category);
        }

        // Supplier filter
        if (selectedSupplier) {
            filtered = filtered.filter((product) => product.supplier === selectedSupplier);
        }

        // Search filter
        if (search) {
            filtered = filtered.filter(
                (product) => product.name.toLowerCase().includes(search.toLowerCase()) || product.sku.includes(search.toUpperCase())
            );
        }

        // Price range filter
        if (minPrice !== null || maxPrice !== null) {
            filtered = filtered.filter((product) => {
                const unitPrice = productMinUnitPrice(product);
                return (minPrice === null || unitPrice >= minPrice) && (maxPrice === null || unitPrice <= maxPrice);
            });
        }

        // Sorting logic
        switch (sort) {
            case "name":
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "+price":
                filtered.sort((a, b) => productMinUnitPrice(b) - productMinUnitPrice(a));
                break;
            case "-price":
                filtered.sort((a, b) => productMinUnitPrice(a) - productMinUnitPrice(b));
                break;
            case "stock":
                filtered.sort((a, b) => b.stock - a.stock);
                break;
            default:
                break;
        }

        setFilteredProducts(filtered);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        filterProducts(category, searchQuery, sortBy, min, max);
    };

    const handleSearchChange = (search: string) => {
        setSearchQuery(search);
        filterProducts(selectedCategory, search, sortBy, min, max);
    };

    const handleSortChange = (sort: string) => {
        setSortBy(sort);
        filterProducts(selectedCategory, searchQuery, sort, min, max);
    };

    const handleSupplierChange = (supplier: string) => {
        setSelectedSupplier(supplier);
        filterProducts(selectedCategory, searchQuery, supplier, min, max);
    };

    // price range change
    const handlePriceRangeChange = (minVal: number | null, maxVal: number | null) => {
        setMin(minVal);
        setMax(maxVal);
        filterProducts(selectedCategory, searchQuery, sortBy, minVal, maxVal);
    };

    // clear all filters
    const handleClearFilters = () => {
        const defaultSort = "name";
        setSearchQuery("");
        setSelectedCategory("all");
        setSortBy(defaultSort);
        setMin(null);
        setMax(null);
        filterProducts("all", "", defaultSort, null, null);
    };

    // Open quote modal
    const openQuoteFromCard = (p: Product) => {
        setQuoteProduct(p);
        setQuoteQty(1); // card has no qty selector; default to 1
        setQuoteOpen(true);
    };

    return (
        <div className="product-list-page">
            <div className="container">
                {/* Page Header */}
                <div className="page-header">
                    <div className="page-info">
                        <h1 className="page-title h2">Catálogo de Productos</h1>
                        <p className="page-subtitle p1">Descubre nuestra selección de productos promocionales premium</p>
                    </div>

                    <div className="page-stats">
                        <div className="stat-item">
                            <span className="stat-value p1-medium">{filteredProducts.length}</span>
                            <span className="stat-label l1">productos</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value p1-medium">{categories.length - 1}</span>
                            <span className="stat-label l1">categorías</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <ProductFilters
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    sortBy={sortBy}
                    onCategoryChange={handleCategoryChange}
                    onSearchChange={handleSearchChange}
                    onSortChange={handleSortChange}
                    onSupplierChange={handleSupplierChange}
                    onPriceRangeChange={handlePriceRangeChange}
                    onClearFilters={handleClearFilters}
                    priceMin={min}
                    priceMax={max}
                />

                {/* Products Grid */}
                <div className="products-section">
                    {filteredProducts.length === 0 ? (
                        <div className="empty-state">
                            <span className="material-icons">search_off</span>
                            <h3 className="h2">No hay productos</h3>
                            <p className="p1">No se encontraron productos que coincidan con tu búsqueda.</p>
                            <button
                                className="btn btn-primary cta1"
                                onClick={() => {
                                    handleClearFilters();
                                }}
                            >
                                Ver todos los productos
                            </button>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onQuote={openQuoteFromCard} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Page-scoped Quote modal (only render when a product is selected) */}
            {quoteProduct && <QuoteModal product={quoteProduct} quantity={quoteQty} open={quoteOpen} onClose={() => setQuoteOpen(false)} />}
        </div>
    );
};

export default ProductList;
