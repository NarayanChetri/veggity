import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import AddProduce from './pages/AddProduce';
import Dashboard from './pages/Dashboard';
import MyOrders from './pages/MyOrders';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <div className="App">
        <Routes>
          {/* Default route lands directly on the Hyperlocal Produce Market feed */}
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/add-produce" element={<AddProduce />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/my-orders" element={<Navigate to="/orders" replace />} />
        </Routes>
      </div>
    </CartProvider>
  );
}

export default App;
