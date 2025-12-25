
import { useNavigate } from "react-router-dom";
import Checkout from "../components/Checkout";

export default function OrderSummary({ cart }) {
  const getItemPrice = (item) => {
    if (item.selected_size && item.selected_size.price) return item.selected_size.price;
    return item.price;
  };

  // Group cart items by product id, selected size, and try_and_buy
  const grouped = [];
  cart.forEach(item => {
    const key = `${item.id}-${item.selected_size ? item.selected_size.id : ''}-${item.try_and_buy ? 1 : 0}`;
    const found = grouped.find(g => g.key === key);
    if (found) {
      found.count += 1;
    } else {
      grouped.push({ ...item, key, count: 1 });
    }
  });

  const total = grouped.reduce((sum, item) => sum + getItemPrice(item) * item.count, 0);

  const navigate = useNavigate();
  return (
    <div style={{ padding: 20 }}>
      <h1>Order Summary</h1>
      {cart.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {grouped.map((item, idx) => (
              <li key={item.key} style={{ marginBottom: 10, padding: 8, borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {item.selected_size && (
                  <div style={{ fontSize: 13, color: '#555' }}>
                    Size: {item.selected_size.size_label} {item.selected_size.size_value ? `(${item.selected_size.size_value})` : ''}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#1976d2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={!!item.try_and_buy} readOnly style={{ accentColor: '#1976d2' }} />
                  Try & Buy
                </div>
                <div style={{ fontWeight: 500, color: '#1976d2' }}>₹{getItemPrice(item)}
                  {item.count > 1 && (
                    <span style={{ marginLeft: 10, color: '#555', fontWeight: 400, fontSize: 13 }}>
                      × {item.count} = ₹{getItemPrice(item) * item.count}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <h3 style={{ marginTop: 20 }}>Total: ₹{total}</h3>
          <Checkout total={total} groupedCart={grouped} />
        </div>
      )}
      <button style={{ marginTop: 20 }} onClick={() => navigate("/")}> 
        Back to Home
      </button>
    </div>
  );
}
