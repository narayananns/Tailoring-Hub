import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageTransition from './components/PageTransition'
import Home from './pages/Home'
import Buy from './pages/Buy'
import Sell from './pages/Sell'
import Service from './pages/Service'
import About from './pages/About'
import Contact from './pages/Contact'
import CustomerLogin from './pages/CustomerLogin'
import CustomerSignup from './pages/CustomerSignup'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminLogin from './pages/AdminLogin'
import AdminSignup from './pages/AdminSignup'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrderDetails from './pages/AdminOrderDetails'
import Profile from './pages/Profile'
import MyOrders from './pages/MyOrders'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import './App.css'

function App() {
  const location = useLocation()
  
  // Check if current route should use Admin Layout (no public Navbar/Footer)
  const isAdminLayout = location.pathname.startsWith('/admin/dashboard') || location.pathname.startsWith('/admin/orders');

  return (
    <div className="app">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
      {!isAdminLayout && <Navbar />}
      <main className={isAdminLayout ? "" : "main-content"}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/buy" element={<PageTransition><Buy /></PageTransition>} />
            <Route path="/sell" element={<PageTransition><Sell /></PageTransition>} />
            <Route path="/service" element={<PageTransition><Service /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />

            {/* Customer Auth Routes */}
            <Route path="/customer/login" element={<PageTransition><CustomerLogin /></PageTransition>} />
            <Route path="/customer/signup" element={<PageTransition><CustomerSignup /></PageTransition>} />
            <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />

            {/* Admin Auth Routes */}
            <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
            <Route path="/admin/signup" element={<PageTransition><AdminSignup /></PageTransition>} />
            <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
            <Route path="/admin/orders/:id" element={<PageTransition><AdminOrderDetails /></PageTransition>} />

            {/* Profile Route */}
            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />

            {/* My Orders Route */}
            <Route path="/my-orders" element={<PageTransition><MyOrders /></PageTransition>} />

            {/* Cart & Checkout Routes */}
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdminLayout && !location.pathname.startsWith('/admin/login') && !location.pathname.startsWith('/admin/signup') && <Footer />}
    </div>
  )
}

export default App
