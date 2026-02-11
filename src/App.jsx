import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Buy from './pages/Buy'
import Sell from './pages/Sell'
import Service from './pages/Service'
import About from './pages/About'
import Contact from './pages/Contact'
import CustomerLogin from './pages/CustomerLogin'
import CustomerSignup from './pages/CustomerSignup'
<<<<<<< HEAD
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
=======
>>>>>>> origin/main
import AdminLogin from './pages/AdminLogin'
import AdminSignup from './pages/AdminSignup'
import Profile from './pages/Profile'
import MyOrders from './pages/MyOrders'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/service" element={<Service />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Customer Auth Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
<<<<<<< HEAD
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
=======
>>>>>>> origin/main
          {/* Admin Auth Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          {/* Profile Route */}
          <Route path="/profile" element={<Profile />} />
          {/* My Orders Route */}
          <Route path="/my-orders" element={<MyOrders />} />
          {/* Cart & Checkout Routes */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
