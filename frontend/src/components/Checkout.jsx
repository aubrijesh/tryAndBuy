import { useState } from "react";

// Static customer id
const STATIC_CUSTOMER_ID = 1;

export default function Checkout({ total, groupedCart }) {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    // Prepare payload
    const payload = {
      customer: { id: STATIC_CUSTOMER_ID },
      products: groupedCart.map(item => ({
        id: item.id,
        variant_id: item.selected_size ? item.selected_size.id : undefined,
        try_and_buy: !!item.try_and_buy
      }))
    };
    try {
      const res = await fetch("/api/orders/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Order failed");
      alert("Payment & Order successful!");
      setPaid(true);
    } catch (err) {
      alert("Order failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return <h3>Payment completed ✅</h3>;
  }

  return (
    <div>
      <h3>Pay ₹{total}</h3>
      <button onClick={handlePayment} disabled={loading}>{loading ? "Processing..." : "Pay Now"}</button>
    </div>
  );
}
