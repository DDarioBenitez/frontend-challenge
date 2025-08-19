import { useEffect, useState, useCallback } from "react";
import "./CartAside.css";
import { getCartItems, getCartTotal, setQty, removeFromCart, clearCart, type CartItem } from "../data/cart";

const formatCLP = (n: number) => Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);

const CartAside = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState<number>(0);

    const reload = useCallback(() => {
        setItems(getCartItems());
        setTotal(getCartTotal());
    }, []);

    // Abrir/cerrar por eventos y refrescar datos
    useEffect(() => {
        reload();

        const onOpen = () => setOpen(true);
        const onClose = () => setOpen(false);
        const onToggle = () => setOpen((v) => !v);
        const onUpdated = () => reload();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        window.addEventListener("cart:open", onOpen as EventListener);
        window.addEventListener("cart:close", onClose as EventListener);
        window.addEventListener("cart:toggle", onToggle as EventListener);
        window.addEventListener("cart:updated", onUpdated as EventListener);
        window.addEventListener("storage", onUpdated as EventListener);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("cart:open", onOpen as EventListener);
            window.removeEventListener("cart:close", onClose as EventListener);
            window.removeEventListener("cart:toggle", onToggle as EventListener);
            window.removeEventListener("cart:updated", onUpdated as EventListener);
            window.removeEventListener("storage", onUpdated as EventListener);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [reload]);

    const close = () => setOpen(false);

    return (
        <>
            {/* Overlay */}
            <div className={`cart-overlay ${open ? "open" : ""}`} onClick={close} aria-hidden={!open} />

            {/* Aside */}
            <aside className={`cart-aside ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Carrito">
                <header className="cart-aside__header">
                    <h3>Tu carrito</h3>
                    <button className="icon-btn" onClick={close} aria-label="Cerrar">
                        <span className="material-icons">close</span>
                    </button>
                </header>

                <div className="cart-aside__body">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <span className="material-icons">shopping_bag</span>
                            <p>Tu carrito está vacío.</p>
                        </div>
                    ) : (
                        <ul className="cart-list">
                            {items.map((it) => (
                                <li key={`${it.id}-${it.sku}-${it.color ?? ""}-${it.size ?? ""}`} className="cart-item">
                                    {/* fila superior: título + borrar arriba derecha */}
                                    <div className="cart-item__top">
                                        <div className="cart-item__title">{it.name}</div>
                                        <button
                                            className="remove-btn remove-btn--top"
                                            onClick={() => removeFromCart(it.id, { sku: it.sku, color: it.color, size: it.size })}
                                            aria-label="Quitar item"
                                            title="Quitar"
                                        >
                                            <span className="material-icons">delete</span>
                                        </button>
                                    </div>

                                    {/* metadatos debajo del título */}
                                    <div className="cart-item__meta">
                                        {it.sku && <span>SKU: {it.sku}</span>}
                                        {it.color && <span> · Color: {it.color}</span>}
                                        {it.size && <span> · Talla: {it.size}</span>}
                                        <span className="unit"> · Unit: {formatCLP(it.price)}</span>
                                    </div>

                                    {/* fila inferior: qty a la izquierda, total a la derecha */}
                                    <div className="cart-item__bottom">
                                        <div className="qty-controls">
                                            <button
                                                className="qty-btn"
                                                onClick={() => {
                                                    const next = Math.max(1, it.qty - 1);
                                                    setQty(it.id, next, { sku: it.sku, color: it.color, size: it.size });
                                                }}
                                                aria-label="Restar"
                                            >
                                                <span className="material-icons">remove</span>
                                            </button>

                                            <input
                                                type="number"
                                                min={1}
                                                value={it.qty}
                                                onChange={(e) => {
                                                    const q = Math.max(1, parseInt(e.target.value || "1", 10));
                                                    setQty(it.id, q, { sku: it.sku, color: it.color, size: it.size });
                                                }}
                                                className="qty-input"
                                                aria-label="Cantidad"
                                            />

                                            <button
                                                className="qty-btn"
                                                onClick={() => {
                                                    const next = it.qty + 1;
                                                    setQty(it.id, next, { sku: it.sku, color: it.color, size: it.size });
                                                }}
                                                aria-label="Sumar"
                                            >
                                                <span className="material-icons">add</span>
                                            </button>
                                        </div>

                                        <div className="cart-item__line">{formatCLP(it.price * it.qty)}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <footer className="cart-aside__footer">
                    <div className="cart-total">
                        <span>Total</span>
                        <strong>{formatCLP(total)}</strong>
                    </div>

                    <div className="cart-actions">
                        <button className="btn btn-ghost" onClick={() => clearCart()}>
                            Vaciar
                        </button>
                        <button className="btn btn-primary" onClick={() => alert("Checkout por implementar")}>
                            Ir a pagar
                        </button>
                    </div>
                </footer>
            </aside>
        </>
    );
};

export default CartAside;
