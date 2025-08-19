import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { products } from "../data/products";
import { Product } from "../types/Product";
import PricingCalculator from "../components/PricingCalculator";
import "./ProductDetail.css";
import { addToCart } from "../data/cart";
import QuoteModal from "../components/QuoteModal";
import { getUnitPriceForQty } from "../data/pricing";

function Spinner() {
    return <span className="spinner" aria-hidden />;
}

const ProductDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);

    // Loading flags for buttons
    const [adding, setAdding] = useState(false);
    const [quoting, setQuoting] = useState(false);

    // Quote modal state (controlled)
    const [isOpen, setIsOpen] = useState<boolean>(false);
    // Optional overrides when opening from PricingCalculator
    const [quoteUnitPrice, setQuoteUnitPrice] = useState<number | undefined>(undefined);
    const [quoteNetSubtotal, setQuoteNetSubtotal] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (id) {
            const foundProduct = products.find((p) => p.id === parseInt(id));
            setProduct(foundProduct || null);

            // Set default selections
            if (foundProduct?.colors && foundProduct.colors.length > 0) {
                setSelectedColor(foundProduct.colors[0]);
            }
            if (foundProduct?.sizes && foundProduct.sizes.length > 0) {
                setSelectedSize(foundProduct.sizes[0]);
            }
        }
    }, [id]);

    // Handle loading state
    if (!product) {
        return (
            <div className="container">
                <div className="product-not-found">
                    <span className="material-icons">error_outline</span>
                    <h2 className="h2">Producto no encontrado</h2>
                    <p className="p1">El producto que buscas no existe o ha sido eliminado.</p>
                    <Link to="/" className="btn btn-primary cta1">
                        <span className="material-icons">arrow_back</span>
                        Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    // Validate product status
    const canAddToCart = product.status === "active" && product.stock > 0;

    // Open quote from this page (ProductDetail button)
    const openQuoteFromDetail = () => {
        // Clear overrides so the modal computes using its own logic
        setQuoteUnitPrice(undefined);
        setQuoteNetSubtotal(undefined);
        setIsOpen(true);
    };

    // Open quote from PricingCalculator with calculated price
    const openQuoteFromCalculator = (ctx: {
        product: Product;
        quantity: number;
        unitPrice: number;
        netSubtotal: number;
        discountPercent: number;
    }) => {
        // Sync selected quantity with calculator's value
        setQuantity(ctx.quantity);
        // Set overrides so the modal shows exactly what calculator computed
        setQuoteUnitPrice(ctx.unitPrice);
        setQuoteNetSubtotal(ctx.netSubtotal);
        setIsOpen(true);
    };
    const handleOpenQuote = async () => {
        if (quoting) return;
        try {
            setQuoting(true);
            // Optional: tiny delay para ver el spinner
            await new Promise((r) => setTimeout(r, 200));
            openQuoteFromDetail();
        } finally {
            setQuoting(false);
        }
    };
    // Handlers con spinner
    const handleAddToCart = async () => {
        if (!canAddToCart || adding) return;
        try {
            setAdding(true);
            addToCart({
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: getUnitPriceForQty(product, quantity),
                qty: quantity,
                color: selectedColor,
                size: selectedSize,
            });
            // Optional: tiny delay so el spinner se vea (UX)
            await new Promise((r) => setTimeout(r, 350));
            // Optional: abrir el aside del carrito
            // window.dispatchEvent(new Event("cart:open"));
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="product-detail-page">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/" className="breadcrumb-link l1">
                        Catálogo
                    </Link>
                    <span className="breadcrumb-separator l1">/</span>
                    <span className="breadcrumb-current l1">{product.name}</span>
                </nav>

                <div className="product-detail">
                    {/* Product Images */}
                    <div className="product-images">
                        <div className="main-image">
                            {product.image ? (
                                <img src={product.image} alt={product.name} />
                            ) : (
                                <div className="image-placeholder">
                                    <span className="material-icons">image</span>
                                </div>
                            )}
                        </div>

                        {/* Bug: thumbnails don't work */}
                        <div className="image-thumbnails">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="thumbnail">
                                    <span className="material-icons">image</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="product-details">
                        <div className="product-header">
                            <h1 className="product-title h2">{product.name}</h1>
                            <p className="product-sku p1">SKU: {product.sku}</p>

                            {/* Status */}
                            <div className="product-status">
                                {product.status === "active" ? (
                                    <span className="status-badge status-active l1">✓ Disponible</span>
                                ) : product.status === "pending" ? (
                                    <span className="status-badge status-pending l1">⏳ Pendiente</span>
                                ) : (
                                    <span className="status-badge status-inactive l1">❌ No disponible</span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="product-description">
                                <h3 className="p1-medium">Descripción</h3>
                                <p className="p1">{product.description}</p>
                            </div>
                        )}

                        {/* Features */}
                        {product.features && product.features.length > 0 && (
                            <div className="product-features">
                                <h3 className="p1-medium">Características</h3>
                                <ul className="features-list">
                                    {product.features.map((feature, index) => (
                                        <li key={index} className="feature-item l1">
                                            <span className="material-icons">check_circle</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Color Selection */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="selection-group">
                                <h3 className="selection-title p1-medium">Color disponibles</h3>
                                <div className="color-options">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            className={`color-option ${selectedColor === color ? "selected" : ""}`}
                                            onClick={() => setSelectedColor(color)}
                                        >
                                            <div className="color-preview"></div>
                                            <span className="l1">{color}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="selection-group">
                                <h3 className="selection-title p1-medium">Tallas disponibles</h3>
                                <div className="size-options">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            className={`size-option ${selectedSize === size ? "selected" : ""}`}
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            <span className="l1">{size}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="product-actions">
                            <div className="quantity-selector">
                                <label className="quantity-label l1">Cantidad:</label>
                                <div className="quantity-controls">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="quantity-btn">
                                        <span className="material-icons">remove</span>
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="quantity-input"
                                        min="1"
                                    />
                                    <button onClick={() => setQuantity(quantity + 1)} className="quantity-btn">
                                        <span className="material-icons">add</span>
                                    </button>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className={`btn btn-primary cta1 ${!canAddToCart ? "disabled" : ""}`}
                                    disabled={!canAddToCart || adding}
                                    onClick={handleAddToCart}
                                    aria-busy={adding}
                                    aria-live="polite"
                                >
                                    {adding ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <span className="material-icons">shopping_cart</span>
                                            Agregar al carrito
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-secondary cta1"
                                    onClick={handleOpenQuote} // open modal from Product Detail
                                    disabled={quoting}
                                    aria-busy={quoting}
                                >
                                    {quoting ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <span className="material-icons">calculate</span>
                                            Solicitar cotización
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Calculator */}
                <div className="pricing-section">
                    <PricingCalculator
                        product={product}
                        // open modal using the exact values calculated in the calculator
                        onOpenQuote={(ctx) => openQuoteFromCalculator(ctx)}
                    />
                </div>
            </div>
            <QuoteModal
                product={product}
                quantity={quantity}
                open={isOpen}
                onClose={() => setIsOpen(false)}
                /* Optional overrides when coming from PricingCalculator */
                unitPriceOverride={quoteUnitPrice}
                netSubtotalOverride={quoteNetSubtotal}
            />
        </div>
    );
};

export default ProductDetail;
