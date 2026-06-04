const CART_KEY = "food_delivery_customer_cart";

export function loadStoredCart() {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return { restaurantId: null, lines: [] };
    const parsed = JSON.parse(raw);
    return {
      restaurantId: parsed.restaurantId ?? null,
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  } catch {
    return { restaurantId: null, lines: [] };
  }
}

export function saveStoredCart(restaurantId, lines) {
  const payload = {
    restaurantId: restaurantId ?? null,
    lines: lines || [],
  };
  sessionStorage.setItem(CART_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("food-delivery-cart-update"));
}

export function getCartItemCount() {
  const { lines } = loadStoredCart();
  return lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
}

export function getCartRestaurantId() {
  return loadStoredCart().restaurantId;
}
