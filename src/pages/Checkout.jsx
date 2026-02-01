import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Checkout.css'

function Checkout() {
    const [checkoutItems, setCheckoutItems] = useState([])
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState('')
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        paymentMethod: 'cod'
    })

    const [errors, setErrors] = useState({})

    useEffect(() => {
        // Load checkout items
        const items = JSON.parse(localStorage.getItem('checkoutItems') || '[]')
        if (items.length === 0) {
            navigate('/cart')
            return
        }
        setCheckoutItems(items)

        // Load user data if logged in
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setFormData(prev => ({
                ...prev,
                name: userData.name || '',
                email: userData.email || ''
            }))
        }
    }, [navigate])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter valid 10-digit phone'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!formData.address.trim()) newErrors.address = 'Address is required'
        if (!formData.city.trim()) newErrors.city = 'City is required'
        if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required'
        if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Enter valid 6-digit pincode'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const getTotal = () => {
        return checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    const handlePlaceOrder = async () => {
        if (!validateForm()) return

        // Check if user is logged in
        const token = localStorage.getItem('token')
        if (!token) {
            // Redirect to login if not logged in
            alert('Please login to place an order')
            navigate('/customer/login')
            return
        }

        setIsLoading(true)

        try {
            // Send order to backend
            const response = await fetch('http://localhost:5000/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: checkoutItems.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        type: item.type,
                        image: item.image
                    })),
                    shippingDetails: {
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode
                    },
                    paymentMethod: formData.paymentMethod,
                    totalAmount: getTotal()
                })
            })

            const data = await response.json()

            if (response.ok) {
                setOrderId(data.order.orderId)

                // Clear cart and checkout items
                localStorage.removeItem('cart')
                localStorage.removeItem('checkoutItems')
                window.dispatchEvent(new Event('cartUpdated'))

                setOrderPlaced(true)
            } else {
                alert(data.message || 'Failed to place order')
            }
        } catch (error) {
            console.error('Order error:', error)
            alert('Failed to place order. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (orderPlaced) {
        return (
            <div className="checkout-page">
                <div className="checkout-container">
                    <div className="order-success">
                        <div className="success-icon">✓</div>
                        <h1>Order Placed Successfully!</h1>
                        <p className="order-id">Order ID: <strong>{orderId}</strong></p>
                        <p className="success-message">
                            Thank you for your order! We'll contact you shortly at <strong>{formData.phone}</strong> to confirm your order.
                        </p>
                        <div className="order-details-box">
                            <h3>Order Summary</h3>
                            {checkoutItems.map(item => (
                                <div key={`${item.type}-${item.id}`} className="order-item">
                                    <span>{item.name} × {item.quantity}</span>
                                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="order-total">
                                <span>Total Paid</span>
                                <span>₹{getTotal().toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="success-actions">
                            <Link to="/my-orders" className="btn btn-primary">
                                View My Orders
                            </Link>
                            <Link to="/buy" className="btn btn-secondary">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-header">
                    <h1>🛍️ Checkout</h1>
                    <p>Complete your order</p>
                </div>

                <div className="checkout-content">
                    <div className="checkout-form">
                        {/* Shipping Details */}
                        <div className="form-section">
                            <h2>📍 Shipping Details</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                    />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className={`form-input ${errors.phone ? 'error' : ''}`}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                    />
                                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    className={`form-input ${errors.email ? 'error' : ''}`}
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Delivery Address *</label>
                                <textarea
                                    name="address"
                                    className={`form-input ${errors.address ? 'error' : ''}`}
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="House No., Street, Landmark"
                                    rows="3"
                                />
                                {errors.address && <span className="error-text">{errors.address}</span>}
                            </div>

                            <div className="form-row form-row-3">
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className={`form-input ${errors.city ? 'error' : ''}`}
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                    {errors.city && <span className="error-text">{errors.city}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <select
                                        name="state"
                                        className="form-input"
                                        value={formData.state}
                                        onChange={handleChange}
                                    >
                                        <option value="Tamil Nadu">Tamil Nadu</option>
                                        <option value="Karnataka">Karnataka</option>
                                        <option value="Kerala">Kerala</option>
                                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        className={`form-input ${errors.pincode ? 'error' : ''}`}
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        placeholder="6-digit"
                                        maxLength="6"
                                    />
                                    {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="form-section">
                            <h2>💳 Payment Method</h2>

                            <div className="payment-options">
                                <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleChange}
                                    />
                                    <span className="payment-icon">💵</span>
                                    <div className="payment-info">
                                        <span className="payment-title">Cash on Delivery</span>
                                        <span className="payment-desc">Pay when you receive</span>
                                    </div>
                                </label>

                                <label className={`payment-option ${formData.paymentMethod === 'upi' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="upi"
                                        checked={formData.paymentMethod === 'upi'}
                                        onChange={handleChange}
                                    />
                                    <span className="payment-icon">📱</span>
                                    <div className="payment-info">
                                        <span className="payment-title">UPI Payment</span>
                                        <span className="payment-desc">GPay, PhonePe, Paytm</span>
                                    </div>
                                </label>

                                <label className={`payment-option ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={formData.paymentMethod === 'card'}
                                        onChange={handleChange}
                                    />
                                    <span className="payment-icon">💳</span>
                                    <div className="payment-info">
                                        <span className="payment-title">Card Payment</span>
                                        <span className="payment-desc">Credit / Debit Card</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="checkout-summary">
                        <h3>Order Summary</h3>

                        <div className="checkout-items">
                            {checkoutItems.map(item => (
                                <div key={`${item.type}-${item.id}`} className="checkout-item">
                                    <div className="checkout-item-info">
                                        <span className="checkout-item-name">{item.name}</span>
                                        <span className="checkout-item-qty">Qty: {item.quantity}</span>
                                    </div>
                                    <span className="checkout-item-price">
                                        ₹{(item.price * item.quantity).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{getTotal().toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span className="free-shipping">FREE</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>₹{getTotal().toLocaleString()}</span>
                        </div>

                        <button
                            className="btn btn-primary btn-full place-order-btn"
                            onClick={handlePlaceOrder}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Processing...
                                </>
                            ) : (
                                `Place Order • ₹${getTotal().toLocaleString()}`
                            )}
                        </button>

                        <Link to="/cart" className="back-to-cart">
                            ← Back to Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
