import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Cart.css'

function Cart() {
    const [cartItems, setCartItems] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        loadCart()
        window.addEventListener('cartUpdated', loadCart)
        return () => window.removeEventListener('cartUpdated', loadCart)
    }, [])

    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartItems(cart)
    }

    const updateQuantity = (id, type, delta) => {
        const cart = cartItems.map(item => {
            if (item.id === id && item.type === type) {
                const newQty = item.quantity + delta
                return { ...item, quantity: Math.max(1, newQty) }
            }
            return item
        })
        setCartItems(cart)
        localStorage.setItem('cart', JSON.stringify(cart))
        window.dispatchEvent(new Event('cartUpdated'))
    }

    const removeItem = (id, type) => {
        const cart = cartItems.filter(item => !(item.id === id && item.type === type))
        setCartItems(cart)
        localStorage.setItem('cart', JSON.stringify(cart))
        window.dispatchEvent(new Event('cartUpdated'))
    }

    const clearCart = () => {
        setCartItems([])
        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('cartUpdated'))
    }

    const getTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    const proceedToCheckout = () => {
        localStorage.setItem('checkoutItems', JSON.stringify(cartItems))
        navigate('/checkout')
    }

    return (
        <div className="cart-page">
            <div className="cart-container">
                <div className="cart-header">
                    <h1>🛒 Shopping Cart</h1>
                    <p className="cart-subtitle">
                        {cartItems.length === 0
                            ? 'Your cart is empty'
                            : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart`}
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    <div className="cart-empty">
                        <div className="empty-icon">🛒</div>
                        <h2>Your Cart is Empty</h2>
                        <p>Looks like you haven't added any items yet. Start shopping!</p>
                        <Link to="/buy" className="btn btn-primary">
                            Browse Machines
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-content">
                            <div className="cart-items">
                                {cartItems.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className="cart-item">
                                        <div className="cart-item-image">
                                            {item.type === 'part' ? (
                                                <span className="part-emoji">{item.image}</span>
                                            ) : (
                                                <img src={item.image} alt={item.name} />
                                            )}
                                        </div>
                                        <div className="cart-item-details">
                                            <h3>{item.name}</h3>
                                            <span className="item-type">{item.type === 'machine' ? '🪡 Machine' : '⚙️ Spare Part'}</span>
                                        </div>
                                        <div className="cart-item-quantity">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.id, item.type, -1)}
                                            >
                                                −
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.id, item.type, 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="cart-item-price">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeItem(item.id, item.type)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-summary">
                                <h3>Order Summary</h3>
                                <div className="summary-row">
                                    <span>Subtotal ({cartItems.length} items)</span>
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
                                    className="btn btn-primary btn-full checkout-btn"
                                    onClick={proceedToCheckout}
                                >
                                    Proceed to Checkout →
                                </button>
                                <button
                                    className="btn btn-secondary btn-full"
                                    onClick={clearCart}
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>

                        <div className="cart-actions">
                            <Link to="/buy" className="continue-shopping">
                                ← Continue Shopping
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Cart
