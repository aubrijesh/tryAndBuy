import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import OrderSummary from "./pages/OrderSummary";
import StoreOps from "./pages/StoreOps";
import RiderDeliveryReturn from "./pages/RiderDeliveryReturn";


function App() {
  const [cart, setCart] = useState([]);

  return (
    <Router>
      <nav style={{ display: 'flex', gap: 16, padding: 16, background: '#f5f5f5', marginBottom: 24 }}>
        <Link to="/">Home</Link>
        <Link to="/summary">Order Summary</Link>
        <Link to="/storeops">Store Ops</Link>
        <Link to="/rider">Rider Delivery & Return</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
        <Route path="/summary" element={<OrderSummary cart={cart} />} />
        <Route path="/storeops" element={<StoreOps />} />
        <Route path="/rider" element={<RiderDeliveryReturn />} />
      </Routes>
    </Router>
  );
}

export default App;
