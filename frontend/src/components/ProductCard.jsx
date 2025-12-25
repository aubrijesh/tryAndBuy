import { useState, useEffect } from "react";

export default function ProductCard({ product, addToCart, count, cartItem, updateCartItem, tryAndBuyChecked }) {
  const [tryBuyChecked, setTryBuyChecked] = useState(tryAndBuyChecked || false);
  const [selectedSize, setSelectedSize] = useState(
    cartItem && cartItem.selected_size
      ? cartItem.selected_size
      : (product.ProductVariants && product.ProductVariants.length > 0 ? product.ProductVariants[0] : null)
  );

  // Sync state with cartItem when it changes
  useEffect(() => {
    setTryBuyChecked(tryAndBuyChecked || false);
    setSelectedSize(
      cartItem && cartItem.selected_size
        ? cartItem.selected_size
        : (product.ProductVariants && product.ProductVariants.length > 0 ? product.ProductVariants[0] : null)
    );
  }, [cartItem, product.ProductVariants, product.id, tryAndBuyChecked]);

  const handleTryBuyChange = (e) => {
    setTryBuyChecked(e.target.checked);
    // Update all cart items for this product with the new try_and_buy value
    if (updateCartItem) {
      updateCartItem(product.id, { try_and_buy: e.target.checked }, true);
    }
  };

  const handleSizeSelect = (sizeObj) => {
    setSelectedSize(sizeObj);
    if (cartItem) {
      updateCartItem(product.id, { selected_size: sizeObj });
    }
  };

  const handleAddToCart = () => {
    addToCart({
      ...product,
      try_and_buy: tryBuyChecked,
      selected_size: selectedSize,
    });
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 18,
        width: 240,
        minHeight: 320,
        textAlign: "center",
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22, color: '#1976d2' }}>👗</span>
        {product.name}
      </h3>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
        <img
          src="https://via.placeholder.com/120x120?text=Image"
          alt=""
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, background: "#eee" }}
        />
      </div>
      <p style={{ fontWeight: 600, fontSize: 18, color: '#1976d2', margin: '8px 0' }}>
        ₹{selectedSize && selectedSize.price ? selectedSize.price : product.price}
      </p>
      {product.ProductVariants && product.ProductVariants.length > 0 && (
        <div style={{ margin: "10px 0" }}>
          <strong>Sizes:</strong>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
            {product.ProductVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSizeSelect(v)}
                style={{
                  border: selectedSize && selectedSize.id === v.id ? "2px solid #1976d2" : "1px solid #888",
                  background: selectedSize && selectedSize.id === v.id ? "#1976d2" : "#fff",
                  color: selectedSize && selectedSize.id === v.id ? "#fff" : "#222",
                  borderRadius: 4,
                  padding: "8px 18px",
                  fontSize: 15,
                  cursor: "pointer",
                  fontWeight: selectedSize && selectedSize.id === v.id ? "bold" : "normal",
                  boxShadow: selectedSize && selectedSize.id === v.id ? "0 2px 8px rgba(25,118,210,0.12)" : "none"
                }}
              >
                {v.size_label} {v.size_value ? `(${v.size_value})` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span title="Try & Buy" style={{ fontSize: 18, color: '#1976d2', verticalAlign: 'middle' }}>
            🛍️
          </span>
          <label style={{ fontSize: 14, color: '#1976d2', cursor: 'pointer', marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={tryBuyChecked}
              onChange={handleTryBuyChange}
              style={{ marginRight: 6 }}
            />
            Try & Buy
          </label>
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button onClick={handleAddToCart} style={{ paddingRight: count > 0 ? 32 : undefined }}>
            Add to Cart
          </button>
          {count > 0 && (
            <span style={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
              color: '#fff',
              borderRadius: '50%',
              padding: '2px 8px',
              fontSize: 14,
              fontWeight: 600,
              minWidth: 24,
              textAlign: 'center',
              zIndex: 2
            }}>{count}</span>
          )}
        </div>
      </div>
    </div>
  );
}
