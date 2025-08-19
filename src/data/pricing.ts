import type { Product } from "../types/Product";

/** Sort breaks ascending by minQty */
export const sortBreaks = (product: Product) => (product.priceBreaks ?? []).slice().sort((a, b) => a.minQty - b.minQty);

export const getBestBreakForQty = (product: Product, qty: number) => {
    const sorted = sortBreaks(product);
    if (!sorted.length) return null;
    const eligible = sorted.filter((b) => qty >= b.minQty);
    if (!eligible.length) return null;
    return eligible.reduce((best, curr) => {
        if (!best) return curr;
        if (curr.price < best.price) return curr;
        if (curr.price === best.price && curr.minQty > best.minQty) return curr;
        return best;
    }, null as any);
};

export const getUnitPriceForQty = (product: Product, qty: number) => {
    const best = getBestBreakForQty(product, qty);
    return best ? Math.min(best.price, product.basePrice) : product.basePrice;
};

export const getDiscountPercent = (product: Product, qty: number) => {
    const base = product.basePrice * qty;
    if (base <= 0) return 0;
    const unit = getUnitPriceForQty(product, qty);
    const discounted = unit * qty;
    return ((base - discounted) / base) * 100;
};

/** One-shot calculator for UI use */
export const computePricing = (product: Product, qty: number) => {
    const unitPrice = getUnitPriceForQty(product, qty);
    const netSubtotal = unitPrice * qty;
    const discountPercent = getDiscountPercent(product, qty);
    return { unitPrice, netSubtotal, discountPercent };
};
