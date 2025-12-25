import { useEffect, useState } from "react";

export default function RiderDeliveryReturn() {
  const [randomOrder, setRandomOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRandomOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rider/orders/random');
      if (res.status === 404) {
        setError('No order available');
        setRandomOrder(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch random order');
      const data = await res.json();
      setRandomOrder(data);
    } catch (err) {
      setError(err.message);
      setRandomOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Rider Delivery & Return</h1>
      <button onClick={fetchRandomOrder} style={{ marginBottom: 18, padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
        Get Random Order
      </button>
      {loading && <div>Loading random order...</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {randomOrder && <RiderOrderPage order={randomOrder} onClear={() => setRandomOrder(null)} />}
    </div>
  );
}


function RiderOrderPage({ order, onClear }) {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rider/orders/${order.id}`)
      .then(res => res.json())
      .then(data => {
        setOrderItems(data.items || []);
        setLoading(false);
        // Calculate initial paidAmount for kept items
        let initialPaid = (data.items || []).filter(i => i.rider_status === 'KEPT_PAID').reduce((sum, i) => sum + (i.price || 0), 0);
        if (order.payment_status === 'PENDING') {
          initialPaid += (data.items || []).filter(i => i.is_customer_selected).reduce((sum, i) => sum + (i.price || 0), 0);
        }
        setPaidAmount(initialPaid);
      })
      .catch(err => {
        setError("Failed to load order items");
        setLoading(false);
      });
  }, [order.id, order.payment_status]);

  // Toggle keep/return for all items
  const handleToggle = (item) => {
    setOrderItems(items => items.map(i => {
      if (i.id !== item.id) return i;
      const newStatus = i.rider_status === 'KEPT_PAID' ? 'RETURNED' : 'KEPT_PAID';
      return { ...i, rider_status: newStatus };
    }));
  };

  // Update paidAmount when toggling
  useEffect(() => {
    let paid = orderItems.filter(i => i.rider_status === 'KEPT_PAID').reduce((sum, i) => sum + (i.price || 0), 0);
    if (order.payment_status === 'PENDING') {
      paid += orderItems.filter(i => i.is_customer_selected).reduce((sum, i) => sum + (i.price || 0), 0);
    }
    setPaidAmount(paid);
  }, [orderItems, order.payment_status]);

  // Submit kept/returned/paidAmount
  const handleComplete = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    let kept = [];
    let returned = [];
    orderItems.forEach(i => {
      if (i.rider_status === 'KEPT_PAID') kept.push(i.id);
      else returned.push(i.id);
    });

    try {
      const res = await fetch(`/api/rider/orders/${order.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kept, returned, paidAmount })
      });
      if (!res.ok) throw new Error('Failed to complete order');
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 24, marginBottom: 18, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>Order #{order.id} (Customer: {order.customer_id})</div>
          <div>Status: {order.status}</div>
        </div>
        <button onClick={onClear} style={{ marginLeft: 16, padding: '6px 16px', borderRadius: 4, background: '#eee', color: '#333', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
      </div>
      <h3 style={{ marginTop: 24 }}>Order Items</h3>
      {loading && <div>Loading items...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 10 }}>
        {orderItems.map(item => (
          <div key={item.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 18, minWidth: 220, background: '#fcfcfc', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Variant #{item.variant_id}</div>
            <div><strong>Size:</strong> {item.size_label} {item.size_value}</div>
            <div><strong>Price:</strong> ₹{item.price}</div>
            <div><strong>Status:</strong> {item.status}</div>
            <div><strong>Customer Selected:</strong> {item.is_customer_selected ? 'Yes' : 'No'}</div>
            <div><strong>Rider Status:</strong> {item.rider_status || 'Pending'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ fontWeight: 500, color: (item.is_customer_selected || item.rider_status === 'KEPT_PAID') ? '#388e3c' : '#d32f2f' }}>
                {item.is_customer_selected || item.rider_status === 'KEPT_PAID' ? 'Kept' : 'Return'}
              </span>
              <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 24 }}>
                <input
                  type="checkbox"
                  checked={item.is_customer_selected || item.rider_status === 'KEPT_PAID'}
                  onChange={() => !item.is_customer_selected && handleToggle(item)}
                  disabled={item.is_customer_selected}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: item.is_customer_selected ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: (item.is_customer_selected || item.rider_status === 'KEPT_PAID') ? '#388e3c' : '#d32f2f',
                  transition: '.4s',
                  borderRadius: 24,
                  opacity: item.is_customer_selected ? 0.7 : 1
                }}></span>
                <span style={{
                  position: 'absolute',
                  left: (item.is_customer_selected || item.rider_status === 'KEPT_PAID') ? 24 : 2,
                  top: 2,
                  width: 20,
                  height: 20,
                  background: '#fff',
                  borderRadius: '50%',
                  transition: '.4s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.10)'
                }}></span>
              </label>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32, borderTop: '1px solid #eee', paddingTop: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Paid Amount: ₹{paidAmount}</div>
        <button
          onClick={handleComplete}
          disabled={submitting}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 28px',
            fontWeight: 600,
            fontSize: 16,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? 'Submitting...' : 'Complete Delivery'}
        </button>
        {submitError && <div style={{ color: 'red', marginTop: 8 }}>{submitError}</div>}
        {submitSuccess && <div style={{ color: 'green', marginTop: 8 }}>Order completed successfully!</div>}
      </div>
    </div>
  );
}
