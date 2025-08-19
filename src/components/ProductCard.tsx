import { Link } from "react-router-dom";
import { Product } from "../types/Product";
import "./ProductCard.css";

interface ProductCardProps {
    product: Product;
    onQuote?: (product: Product) => void; // Callback for quote action
}

const ProductCard = ({ product, onQuote }: ProductCardProps) => {
    // Handle product status display
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <span className="status-badge status-active l1">Disponible</span>;
            case "inactive":
                return <span className="status-badge status-inactive l1">No disponible</span>;
            case "pending":
                // Handle pending status
                return <span className="status-badge status-pending l1">Pendiente</span>;
            default:
                return null;
        }
    };

    // Format price for display
    const formatPrice = (price: number) => {
        return Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(price); // `$${price.toLocaleString()}`; // Missing currency and proper formatting
    };

    // Check stock availability
    const getStockStatus = (stock: number) => {
        if (stock === 0) {
            return <span className="stock-status out-of-stock l1">Sin stock</span>;
        } else if (stock < 10) {
            return <span className="stock-status low-stock l1">Stock bajo ({stock})</span>;
        }
        return <span className="stock-status in-stock l1">{stock} disponibles</span>;
    };

    // Calculate discount percentage
    const getDiscountPrice = () => {
        if (product.priceBreaks && product.priceBreaks.length > 1) {
            const bestDiscount = product.priceBreaks[product.priceBreaks.length - 1];
            return bestDiscount.price;
        }
        return null;
    };

    return (
        <div className="product-card">
            <Link to={`/product/${product.id}`} className="product-link">
                {/* Product Image */}
                <div className="product-image">
                    {/* Bug: no real image handling */}
                    {product.image ? (
                        <img src={product.image} alt={product.name} />
                    ) : (
                        <>
                            <div className="image-placeholder">
                                <span className="material-icons">image</span>
                            </div>
                        </>
                    )}

                    {/* Status Badge */}
                    <div className="product-status">{getStatusBadge(product.status)}</div>
                </div>

                {/* Product Info */}
                <div className="product-info">
                    <div className="product-header">
                        <h3 className="product-name p1-medium">{product.name}</h3>
                        <p className="product-sku l1">{product.sku}</p>
                    </div>

                    <div className="product-details">
                        <div className="product-category">
                            <span className="material-icons">category</span>
                            <span className="l1">{product.category}</span>
                        </div>

                        {getStockStatus(product.stock)}
                    </div>

                    {/* Features - Bug: displays all features without limit */}
                    {/* Now only displays first 4 features */}
                    {product.features && (
                        <div className="product-features">
                            {product.features.slice(0, 4).map((feature, index) => (
                                <span key={index} className="feature-tag l1">
                                    {feature}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="product-colors">
                            <span className="colors-label l1">{product.colors.length} colores:</span>
                            <div className="colors-preview">
                                {product.colors.slice(0, 3).map((color, index) => (
                                    <div key={index} className="color-dot" title={color}></div>
                                ))}
                                {product.colors.length > 3 && <span className="more-colors l1">+{product.colors.length - 3}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Product Footer */}
            <div className="product-footer">
                <div className="price-section">
                    <div className="current-price p1-medium">{formatPrice(product.basePrice)}</div>
                    {getDiscountPrice() && (
                        <div className="discount-info">
                            <span className="discount-price l1">{formatPrice(getDiscountPrice()!)}</span>
                            {/* Fixed: Correct quantity per product not displayed */}
                            <span className="discount-label l1">desde {product.priceBreaks?.[product.priceBreaks.length - 1]?.minQty} unidades</span>
                        </div>
                    )}
                </div>

                <div className="card-actions">
                    <button
                        className="btn btn-secondary l1"
                        onClick={(e) => {
                            e.preventDefault();
                            onQuote?.(product);
                        }}
                    >
                        <span className="material-icons">calculate</span>
                        Cotizar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
