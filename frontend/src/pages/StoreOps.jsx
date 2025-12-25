import { useEffect, useState } from "react";

const getOrderStatusColor = (status) => {
    switch (status) {
        case 'CREATED':
            return "orange"
           
        case 'PACKED':
            return "green"
        case 'COMPLETED':
            return "blue"
        default:
            return "grey"
    }
}

export default function StoreOps() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderPacked, setIsOrderPacked] = useState(false);

  useEffect(() => {
    // Fetch TRY_AND_BUY orders from backend
    fetch("/api/storeops/orders?type=try_and_buy")
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

    const markAsPacked = async (order) => {
        //'/:orderId/packed'
        await fetch(`/api/orders/${order.id}/packed`, { method: "POST" });
        // Update order status locally
        setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'PACKED' } : o));
    }
  if (loading) return <div>Loading orders...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Store Ops (Shopify Admin)</h1>
      <h2>TRY_AND_BUY Orders</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'row', gap: 12 }}>
        {orders.map(order => (
          <li key={order.id} style={{ marginBottom: 18, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600 }}>Order #{order.id} (Customer: {order.customer_id})</div>
            <div>Status: {order.status}</div>
            {order.status === 'CREATED' ? (
                <>
              <button onClick={() => setSelectedOrder(order)} style={{ marginTop: 8 }}>View / Edit</button>
              <button style={{ marginLeft: 8, marginTop: 8 , backgroundColor: "green"}} onClick={() => markAsPacked(order)}>Mark as Packed</button>
              </>
            ) : (
                <div style={{marginTop: 8, color: getOrderStatusColor(order.status)}}>{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</div>
            )}
                
          </li>
        ))}
      </ul>
      {selectedOrder && <OrderSidebar order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}




function OrderSidebar({ order, onClose }) {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rider/orders/${order.id}`)
      .then(res => res.json())
      .then(data => {
        setOrderItems(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load order items");
        setLoading(false);
      });
  }, [order.id]);

  useEffect(() => {
    // Fetch suggestions only when sidebar opens (component mounts)
    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.slice(0, 5)); // Show top 5 for demo
      });
  }, []);

  const handleRemoveItem = async (item) => {
    if (item.is_customer_selected) {
        return 
    }
    const itemId = item.id;
    // Call backend to remove item
    await fetch(`/api/orders/${order.id}/items/${itemId}`, { method: "DELETE" });
    setOrderItems(items => items.filter(i => i.id !== itemId));
  };

  const handleSizeSelect = (productId, sizeObj) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: sizeObj }));
  }
  const handleAddItem = async (product) => {
    const selected = selectedSizes[product.id] || (product.ProductVariants && product.ProductVariants[0]);
    if (!selected) return;
    debugger;
    const res = await fetch(`/api/orders/${order.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variant_id: selected.id,
        size: selected.size_value,
        price: selected.price, // ensure price is sent from the selected variant
        recommended: true
      })
    });
    if (res.ok) {
      const newItem = await res.json();
      setOrderItems(items => [...items, newItem]);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '70vw', height: '100vh', background: '#fff', zIndex: 1000, boxShadow: '-2px 0 8px rgba(0,0,0,0.07)', overflowY: 'auto' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }}>Close</button>
      <div style={{ padding: 32 }}>
        <h2>Order #{order.id}</h2>
        <div>Status: {order.status}</div>
        <h3 style={{ marginTop: 24 }}>Order Items</h3>
        {loading && <div>Loading items...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Variant ID</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Size</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Price</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Status</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Recommended</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Customer Selected</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map(item => (
              <tr key={item.id}>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{item.variant_id}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{item.size_label} {item.size_value}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>₹{item.price}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{item.status}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{item.recommended ? 'Yes' : 'No'}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{item.is_customer_selected ? 'Yes' : 'No'}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>
                  {item.is_customer_selected ? (
                    <button
                      style={{
                        color: '#aaa',
                        background: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        padding: '6px 16px',
                        cursor: 'not-allowed',
                        opacity: 1,
                      }}
                      disabled
                      title="Cannot remove customer selected item"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveItem(item)}
                      style={{
                        color: 'red',
                        background: '#fff',
                        border: '1px solid #eee',
                        borderRadius: 4,
                        padding: '6px 16px',
                        cursor: 'pointer',
                      }}
                      title="Remove"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={{ marginTop: 32 }}>Suggestions (Similar Designs)</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          {suggestions.map(product => {
            const selectedSize = selectedSizes[product.id] || (product.ProductVariants && product.ProductVariants[0]);
            return (
              <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, minWidth: 180 }}>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div>Brand: {product.brand}</div>
                <div>Category: {product.category}</div>
                {product.ProductVariants && product.ProductVariants.length > 0 && (
                  <div style={{ margin: "10px 0" }}>
                    <strong>Sizes:</strong>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
                      {product.ProductVariants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSizeSelect(product.id, v)}
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
                <button onClick={() => handleAddItem(product)} style={{ marginTop: 8 }}>Add to Order</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
