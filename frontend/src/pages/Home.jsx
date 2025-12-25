import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductList from "../components/ProductList";

export default function Home({ cart, setCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => {
        setProducts([]);
      });
  }, []);

  const addToCart = (product) => setCart([...cart, product]);

  // Update cart for a product (by id, size, etc.)
  // If all is true, update all cart items for this product; else only the first
  const updateCartItem = (productId, updates, all = false) => {
    setCart((prevCart) =>
      prevCart.map((item, idx) => {
        if (item.id === productId && (all || idx === prevCart.findIndex(i => i.id === productId))) {
          return { ...item, ...updates };
        }
        return item;
      })
    );
  };

  const navigate = useNavigate();
  return (
    <div style={{ padding: 20 }}>
      <h1>Fashion Shop</h1>
      <ProductList products={products} addToCart={addToCart} cart={cart} updateCartItem={updateCartItem} />
      <button onClick={() => navigate("/summary")} style={{ marginTop: 20 }}>
        Go to Order Summary ({cart.length})
      </button>
    </div>
  );
}
