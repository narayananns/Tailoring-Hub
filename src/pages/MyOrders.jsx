import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './MyOrders.css'

function MyOrders() {
    const [user, setUser] = useState(null)
    const [orders, setOrders] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')

        if (!storedUser || !token) {
            navigate('/customer/login')
            return
        }

        setUser(JSON.parse(storedUser))
        fetchOrders(token)
    }, [navigate])

    const fetchOrders = async (token) => {
        try {
            const response = await fetch('/api/orders/my-orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                setOrders(data.orders || [])
            } else {
                setError(data.message || 'Failed to fetch orders')
            }
        } catch (err) {
            setError('Failed to connect to server')
            console.error('Fetch orders error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'pending',
            confirmed: 'confirmed',
            shipped: 'shipped',
            delivered: 'delivered',
            cancelled: 'cancelled'
        }
        return colors[status] || 'pending'
    }

    const filteredOrders = orders.filter(order => 
        (order._id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.items || []).some(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (!user) {
        return (
            <div className="orders-page">
                <div className="orders-loading">Redirecting to login...</div>
            </div>
        )
    }

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-header">
                    <h1>📦 My Orders</h1>
                    <p className="orders-subtitle">Track and manage your orders</p>
                </div>

                <div className="orders-content">
                    {isLoading ? (
                        <div className="orders-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading your orders...</p>
                        </div>
                    ) : error ? (
                        <div className="orders-error">
                            <p>⚠️ {error}</p>
                            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                                Try Again
                            </button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="orders-empty">
                            <div className="empty-icon">🛒</div>
                            <h2>No Orders Yet</h2>
                            <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
                            <Link to="/buy" className="btn btn-primary">
                                Browse Machines
                            </Link>
                        </div>
                    ) : (
                        <div className="orders-list">
                            <div className="search-container" style={{ margin: '0 auto 2rem auto' }}>
                                <span className="search-icon">🔍</span>
                                <input 
                                    type="text" 
                                    className="search-input" 
                                    placeholder="Search orders by ID, status or product name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {filteredOrders.length === 0 ? (
                                <div className="orders-empty" style={{ margin: '2rem 0' }}>
                                    <div className="empty-icon">🔍</div>
                                    <h3>No orders found</h3>
                                    <p>Try searching for a different term.</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order._id} className="order-card">
                                        <div className="order-header">
                                            <div className="order-id-section">
                                                <span className="order-id">
                                                    {(order.orderId || order._id).toString().substring(0, 8)}...
                                                </span>
                                                <span className="order-date">{formatDate(order.createdAt)}</span>
                                            </div>
                                            <span className={`order-status ${getStatusColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="order-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row">
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-qty">×{item.quantity}</span>
                                                    <span className="item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <div className="shipping-info">
                                                <span className="shipping-label">📍 Shipping to:</span>
                                                <span className="shipping-address">
                                                    {order.shippingDetails?.city || 'City'}, {order.shippingDetails?.state || 'State'}
                                                </span>
                                            </div>
                                            <div className="order-total">
                                                <span>Total:</span>
                                                <span className="total-amount">₹{order.totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="orders-actions">
                    <Link to="/" className="btn btn-secondary">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MyOrders
