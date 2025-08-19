export type ProductId = string | number;

export interface CartItem {
    id: ProductId;
    qty: number;
    name: string;
    price: number; // unit price
    image?: string;
    sku: string;
    color?: string;
    size?: string;
}

export interface Cart {
    items: CartItem[];
    totalQty: number;
    totalPrice: number;
}

export interface CartState {
    cart: Cart;
    loading: boolean;
    error?: string;
}

const KEY = "cart";

/** Recalculate the cart */
function recalc(items: CartItem[]): Cart {
    const totalQty = items.reduce((sum, it) => sum + it.qty, 0);
    const totalPrice = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    return { items, totalQty, totalPrice };
}

function safeGet(): CartState {
    if (typeof window === "undefined") {
        return { cart: recalc([]), loading: false };
    }
    try {
        const data = localStorage.getItem(KEY);
        if (!data) return { cart: recalc([]), loading: false };
        const parsed = JSON.parse(data);
        if (!parsed || !parsed.cart) return { cart: recalc([]), loading: false };
        return { cart: parsed.cart, loading: false };
    } catch {
        return { cart: recalc([]), loading: false };
    }
}

function safeSet(state: CartState) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(state));
    // Dispatch custom event to notify other parts of the app
    // that the cart has been updated
    // This allows components like Header to react to changes
    // without needing to re-fetch the cart state
    // This is useful for multi-tab scenarios
    // or when the cart is updated from different components
    window.dispatchEvent(new CustomEvent("cart:updated"));
}

function sameKey(a: CartItem, b: CartItem): boolean {
    return String(a.id) === String(b.id) && a.sku === b.sku && a.color === b.color && a.size === b.size;
}

export function getCart(): CartState {
    return safeGet();
}

export function addToCart(item: CartItem): CartState {
    const state = safeGet();
    const items = [...state.cart.items];
    const idx = items.findIndex((it) => sameKey(it, item));

    if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + item.qty };
    } else {
        items.push({ ...item, qty: item.qty || 1 });
    }

    const newCart = recalc(items);
    const newState = { cart: newCart, loading: false };
    safeSet(newState);
    return newState;
}

export function setQty(id: ProductId, qty: number, options?: Partial<CartItem>): CartState {
    const state = safeGet();
    const items = state.cart.items.map((it) =>
        String(it.id) === String(id) && (!options || (it.sku === options.sku && it.color === options.color && it.size === options.size))
            ? { ...it, qty: Math.max(1, qty) }
            : it
    );
    const newCart = recalc(items);
    const newState = { cart: newCart, loading: false };
    safeSet(newState);
    return newState;
}

export function removeFromCart(id: ProductId, options?: Partial<CartItem>): CartState {
    const state = safeGet();
    const items = state.cart.items.filter(
        (it) => !(String(it.id) === String(id) && (!options || (it.sku === options.sku && it.color === options.color && it.size === options.size)))
    );
    const newCart = recalc(items);
    const newState = { cart: newCart, loading: false };
    safeSet(newState);
    return newState;
}

export function clearCart(): CartState {
    const newState = { cart: recalc([]), loading: false };
    safeSet(newState);
    return newState;
}

// Helpers
export function getCartTotal(): number {
    return safeGet().cart.totalPrice;
}

export function getCartItems(): CartItem[] {
    return safeGet().cart.items;
}

export function getCartItemCount(): number {
    return safeGet().cart.totalQty;
}

export function isCartLoading(): boolean {
    return safeGet().loading;
}
