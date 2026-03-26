import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import OrderTimeline from '../components/OrderTimeline'
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

    const downloadInvoice = (order) => {
        const invoiceContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${order.orderId}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #d97706; }
                    .invoice-title { font-size: 32px; color: #333; }
                    .invoice-details { margin-bottom: 40px; display: flex; justify-content: space-between; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .table th { text-align: left; border-bottom: 2px solid #ddd; padding: 12px; background: #f9f9f9; }
                    .table td { border-bottom: 1px solid #eee; padding: 12px; }
                    .total-section { text-align: right; font-size: 18px; font-weight: bold; }
                    .footer { margin-top: 50px; text-align: center; color: #777; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
                    .status-stamp { 
                        display: inline-block; padding: 5px 15px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 14px;
                        background: ${order.status === 'delivered' ? '#dcfce7' : '#f1f5f9'};
                        color: ${order.status === 'delivered' ? '#166534' : '#64748b'};
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="company-name">Tailoring Machine MS</div>
                        <div>Tiruppur, India</div>
                        <div>support@tmms.com</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="invoice-title">INVOICE</div>
                        <div style="color: #666;">#${order.orderId || order._id}</div>
                    </div>
                </div>

                <div class="invoice-details">
                    <div>
                        <strong>Billed To:</strong><br>
                        ${order.shippingDetails?.name}<br>
                        ${order.shippingDetails?.address}<br>
                        ${order.shippingDetails?.city}, ${order.shippingDetails?.state} - ${order.shippingDetails?.pincode}<br>
                        Phone: ${order.shippingDetails?.phone}
                    </div>
                    <div style="text-align: right;">
                        <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
                        <strong>Status:</strong> <span class="status-stamp">${order.status}</span>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>₹${item.price.toLocaleString()}</td>
                                <td>₹${(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total-section">
                    Total Amount: ₹${order.totalAmount.toLocaleString()}
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
    };

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
                            {[1, 2, 3].map((_, idx) => (
                                <div key={idx} className="order-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ width: '40%' }}>
                                            <Skeleton count={2} baseColor="#202020" highlightColor="#444" />
                                        </div>
                                        <div style={{ width: '20%' }}>
                                            <Skeleton height={30} baseColor="#202020" highlightColor="#444" />
                                        </div>
                                    </div>
                                    <Skeleton count={3} height={20} baseColor="#202020" highlightColor="#444" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                        <Skeleton width={100} height={36} baseColor="#202020" highlightColor="#444" />
                                    </div>
                                </div>
                            ))}
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

                                        <div style={{ margin: '1rem 0' }}>
                                            <OrderTimeline 
                                                status={order.status} 
                                                createdAt={order.createdAt} 
                                                updatedAt={order.updatedAt} 
                                            />
                                            {order.status === 'cancelled' && order.cancellationReason && (
                                                <div className="cancellation-reason" style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5', color: '#b91c1c' }}>
                                                    <strong>Reason for cancellation:</strong> {order.cancellationReason}
                                                </div>
                                            )}
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
                                        
                                        <div className="card-actions" style={{marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end'}}>
                                            <button 
                                                className="btn-invoice" 
                                                onClick={() => downloadInvoice(order)} 
                                                style={{
                                                    padding: '8px 16px', 
                                                    background: '#3b82f6', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                                                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                                </svg>
                                                Download Invoice
                                            </button>
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
