import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Header.css";
import { getCartItemCount } from "../data/cart";

const Header = () => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // update count on initial render
        setCount(getCartItemCount());

        // update count on cart changes
        // This will listen to custom events and storage changes
        // to update the cart count in the header
        const onCart = () => setCount(getCartItemCount());

        window.addEventListener("cart:updated", onCart as EventListener);
        window.addEventListener("storage", onCart as EventListener);

        return () => {
            window.removeEventListener("cart:updated", onCart as EventListener);
            window.removeEventListener("storage", onCart as EventListener);
        };
    }, []);

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <div className="logo-icon">
                            <span className="material-icons">store</span>
                        </div>
                        <span className="logo-text p1-medium">SWAG Challenge</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="nav">
                        <Link to="/" className="nav-link l1">
                            <span className="material-icons">home</span>
                            Catálogo
                        </Link>
                        <button className="nav-link l1" onClick={() => window.dispatchEvent(new CustomEvent("cart:open"))} aria-label="Abrir carrito">
                            <span className="material-icons">shopping_cart</span>
                            {/* use `count` for the badge */}
                            Carrito ({count})
                        </button>
                    </nav>

                    {/* Actions */}
                    <div className="header-actions">
                        <button className="btn btn-secondary cta1">
                            <span className="material-icons">person</span>
                            Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
