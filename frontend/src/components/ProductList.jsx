import ProductCard from "./ProductCard";

export default function ProductList({ products, addToCart, cart, updateCartItem }) {
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {products.map((p) => {
        // For Try & Buy, sync checkbox state per product (checked if any cart item for this product has try_and_buy true)
        const cartItems = cart.filter(item => item.id === p.id);
        const count = cartItems.length;
        const tryAndBuyChecked = cartItems.some(item => item.try_and_buy);
        const lastCartItem = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;
        return (
          <ProductCard
            key={p.id}
            product={p}
            addToCart={addToCart}
            count={count}
            cartItem={lastCartItem}
            updateCartItem={updateCartItem}
            tryAndBuyChecked={tryAndBuyChecked}
          />
        );
      })}
    </div>
  );
}
