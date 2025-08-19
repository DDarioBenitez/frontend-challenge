import { useEffect, useMemo, useState } from "react";
import { Product } from "../types/Product";
import "./PricingCalculator.css";
import { addToCart } from "../data/cart";
import { sortBreaks, getBestBreakForQty, computePricing } from "../data/pricing";

interface PricingCalculatorProps {
    product: Product;
    onOpenQuote?: (ctx: { product: Product; quantity: number; unitPrice: number; netSubtotal: number; discountPercent: number }) => void;
}

const PricingCalculator = ({ product, onOpenQuote }: PricingCalculatorProps) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedBreak, setSelectedBreak] = useState<number>(0);

    // Sort price breaks by minimum quantity
    const sortedBreaksMemo = useMemo(() => sortBreaks(product), [product]);

    // Update selected price break (match by minQty & price to get index)
    useEffect(() => {
        const best = getBestBreakForQty(product, quantity);
        if (!best) {
            setSelectedBreak(-1);
            return;
        }
        const idx = sortedBreaksMemo.findIndex((b) => b.minQty === best.minQty && b.price === best.price);
        setSelectedBreak(idx);
    }, [product, quantity, sortedBreaksMemo]);

    // Pricing snapshot (unit, subtotal neto, % descuento)
    const { unitPrice, netSubtotal, discountPercent } = useMemo(() => computePricing(product, quantity), [product, quantity]);

    // Format price display
    const formatPrice = (price: number) => {
        return Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(price); // Should be CLP formatting
    };

    return (
        <div className="pricing-calculator">
            <div className="calculator-header">
                <h3 className="calculator-title p1-medium">Calculadora de Precios</h3>
                <p className="calculator-subtitle l1">Calcula el precio según la cantidad que necesitas</p>
            </div>

            <div className="calculator-content">
                {/* Quantity Input */}
                <div className="quantity-section">
                    <label className="quantity-label p1-medium">Cantidad</label>
                    <div className="quantity-input-group">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const value = parseInt(e.target.value || "1", 10);
                                setQuantity(Math.min(product.stock, Math.max(1, value)));
                            }}
                            className="quantity-input p1"
                            min="1"
                            max={product.stock}
                        />

                        <span className="quantity-unit l1">unidades</span>
                    </div>
                </div>

                {/* Price Breaks */}
                {sortedBreaksMemo.length > 0 && (
                    <div className="price-breaks-section">
                        <h4 className="breaks-title p1-medium">Descuentos por volumen</h4>
                        <div className="price-breaks">
                            {sortedBreaksMemo.map((priceBreak, index) => {
                                const isActive = quantity >= priceBreak.minQty;
                                const isSelected = selectedBreak === index;

                                return (
                                    <div
                                        key={`${priceBreak.minQty}-${index}`}
                                        className={`price-break ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`}
                                        onClick={() => {
                                            // when a break is selected, set quantity to minQty
                                            setQuantity(priceBreak.minQty);
                                        }}
                                    >
                                        <div className="break-quantity l1">{priceBreak.minQty}+ unidades</div>
                                        <div className="break-price p1-medium">{formatPrice(priceBreak.price)}</div>
                                        {"discount" in priceBreak && priceBreak.discount != null && (
                                            <div className="break-discount l1">-{priceBreak.discount}%</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Price Summary */}
                <div className="price-summary">
                    <div className="summary-row">
                        <span className="summary-label p1">Precio unitario:</span>
                        <span className="summary-value p1-medium">{formatPrice(unitPrice)}</span>
                    </div>

                    <div className="summary-row">
                        <span className="summary-label p1">Cantidad:</span>
                        <span className="summary-value p1-medium">{quantity} unidades</span>
                    </div>

                    {discountPercent > 0 && (
                        <div className="summary-row discount-row">
                            <span className="summary-label p1">Descuento:</span>
                            <span className="summary-value discount-value p1-medium">-{discountPercent.toFixed(1)}%</span>
                        </div>
                    )}

                    <div className="summary-row total-row">
                        <span className="summary-label p1-medium">Total:</span>
                        <span className="summary-value total-value h2">{formatPrice(netSubtotal)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="calculator-actions">
                    <button
                        className="btn btn-secondary cta1"
                        onClick={() => {
                            onOpenQuote?.({
                                product,
                                quantity,
                                unitPrice,
                                netSubtotal,
                                discountPercent,
                            });
                        }}
                    >
                        <span className="material-icons">email</span>
                        Solicitar cotización oficial
                    </button>

                    <button
                        className="btn btn-primary cta1"
                        onClick={() => {
                            addToCart({
                                id: product.id,
                                name: product.name,
                                image: product.image,
                                price: unitPrice, // unit price (not subtotal)
                                sku: product.sku,
                                qty: quantity,
                            });
                        }}
                    >
                        <span className="material-icons">shopping_cart</span>
                        Agregar al carrito
                    </button>
                </div>

                {/* Additional Info */}
                <div className="additional-info">
                    <div className="info-item">
                        <span className="material-icons">local_shipping</span>
                        <div className="info-content">
                            <span className="info-title l1">Envío gratis</span>
                            <span className="info-detail l1">En pedidos sobre $50.000</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <span className="material-icons">schedule</span>
                        <div className="info-content">
                            <span className="info-title l1">Tiempo de producción</span>
                            <span className="info-detail l1">7-10 días hábiles</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <span className="material-icons">verified</span>
                        <div className="info-content">
                            <span className="info-title l1">Garantía</span>
                            <span className="info-detail l1">30 días de garantía</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingCalculator;
