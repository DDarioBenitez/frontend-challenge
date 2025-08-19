import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import "./App.css";
import CartAside from "./components/CartAside";

function App() {
    return (
        <div className="App">
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={<ProductList />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                </Routes>
            </main>
            <CartAside />
        </div>
    );
}

export default App;
