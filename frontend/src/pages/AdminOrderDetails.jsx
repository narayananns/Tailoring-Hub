import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import './AdminOrderDetails.css'
import './AdminOrderDetailsResponsive.css'
import AdminLayout from '../components/AdminLayout'

const AdminOrderDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAdminAuth()
        fetchOrderDetails()
    }, [id])

    const checkAdminAuth = () => {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        
        if (!token || (user.role !== 'admin' && user.role !== 'super-admin')) {
            toast.error('Access denied. Admin only.')
            navigate('/admin/login')
        }
    }

    const fetchOrderDetails = async () => {
        try {
            const res = await axios.get(`/api/orders/admin/${id}`)
            setOrder(res.data)
        } catch (error) {
            console.error('Error fetching order:', error)
            toast.error('Failed to load order details')
        } finally {
            setLoading(false)
        }
    }

    const updateOrderStatus = async (newStatus) => {
        try {
            const res = await axios.put(`/api/orders/${id}/status`, { status: newStatus })
            setOrder({ ...res.data }) // Ensure state update triggers re-render
            toast.success('Order status updated')
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const handlePrintInvoice = () => {
        window.print();
    };

    if (loading) {
        return (
            <AdminLayout activeTab="orders">
                <div className="admin-order-details-container">
                    <div className="order-details-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton width={150} height={36} />
                        <Skeleton width={120} height={36} />
                    </div>
                    <div className="order-content-section" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                            <div>
                                <Skeleton height={30} width={200} style={{ marginBottom: '1rem' }} />
                                <Skeleton count={3} width={300} style={{ marginBottom: '0.5rem' }} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Skeleton height={30} width={150} style={{ marginBottom: '1rem', marginLeft: 'auto' }} />
                                <Skeleton count={2} width={200} style={{ marginLeft: 'auto', marginBottom: '0.5rem' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <Skeleton height={40} style={{ marginBottom: '1rem' }} />
                            <Skeleton count={3} height={60} style={{ marginBottom: '0.5rem' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <Skeleton height={50} width={250} />
                        </div>
                    </div>
                </div>
            </AdminLayout>
        )
    }
    
    if (!order) return <div className="error">Order not found</div>

    return (
        <AdminLayout activeTab="orders">
            <div className="admin-order-details-container">
            <div className="order-details-header">
                <button className="btn-back" onClick={() => navigate('/admin/dashboard?tab=orders')}>
                    ← Back to Dashboard
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-print" onClick={handlePrintInvoice} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📅 Print Invoice
                    </button>
                </div>
            </div>
            
            {/* INVOICE PRINT TEMPLATE (Hidden on Screen) */}
            <div className="printable-invoice">
                <div className="invoice-header">
                    <div>
                        <h1>INVOICE</h1>
                        <p><strong>Order ID:</strong> {order.orderId || order._id}</p>
                        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2>Tailoring Machine System</h2>
                        <p>123 Business Road, Tech City</p>
                        <p>support@tms.com | +91 98765 43210</p>
                    </div>
                </div>
                
                <div className="invoice-addresses" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '2rem' }}>
                    <div className="bill-to">
                        <h3>Bill To:</h3>
                        <p><strong>{order.shippingDetails?.name}</strong></p>
                        <p>{order.shippingDetails?.address}</p>
                        <p>{order.shippingDetails?.city}, {order.shippingDetails?.pincode}</p>
                        <p>Phone: {order.shippingDetails?.phone}</p>
                    </div>
                    <div className="ship-to">
                        <h3>Payment Details:</h3>
                        <p>Status: <span style={{ textTransform: 'uppercase' }}>{order.paymentStatus || 'Paid'}</span></p>
                        <p>Method: Online Payment</p>
                    </div>
                </div>

                <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #333' }}>
                            <th style={{ textAlign: 'left', padding: '10px 0' }}>Item</th>
                            <th style={{ textAlign: 'center', padding: '10px 0' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '10px 0' }}>Price</th>
                            <th style={{ textAlign: 'right', padding: '10px 0' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px 0' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', padding: '10px 0' }}>₹{item.price}</td>
                                <td style={{ textAlign: 'right', padding: '10px 0' }}>₹{item.quantity * item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="invoice-footer" style={{ textAlign: 'right', marginTop: '2rem' }}>
                    <h3>Total Amount: ₹{order.totalAmount}</h3>
                    <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>Thank you for your business!</p>
                </div>
            </div>

            <div className="order-details-content">
                <section className="detail-section status-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Order #{order.orderId || order._id}</h3>
                        <div className="status-control">
                            <span className={`status-badge ${order.status ? order.status.toLowerCase() : ''}`}>{order.status}</span>
                            <select 
                                value={order.status} 
                                onChange={(e) => updateOrderStatus(e.target.value)}
                                className="status-select-large"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <p className="order-date">Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                </section>

                <div className="details-grid">
                    <section className="detail-section customer-info">
                        <h3>Customer Information</h3>
                        <div className="info-row">
                            <strong>Name:</strong> <span>{order.shippingDetails?.name}</span>
                        </div>
                        <div className="info-row">
                            <strong>Phone:</strong> <span>{order.shippingDetails?.phone}</span>
                        </div>
                        <div className="info-row">
                            <strong>Email:</strong> <span>{order.userId?.email || 'N/A'}</span>
                        </div>
                        <div className="info-group">
                            <strong>Shipping Address:</strong>
                            <p>
                                {order.shippingDetails?.address}<br/>
                                {order.shippingDetails?.city}, {order.shippingDetails?.state} - {order.shippingDetails?.pincode}
                            </p>
                        </div>
                    </section>

                    <section className="detail-section payment-info">
                        <h3>Payment Information</h3>
                        <div className="info-row">
                            <strong>Method:</strong> <span>{order.paymentMethod}</span>
                        </div>
                        <div className="info-row">
                            <strong>Total Amount:</strong> <span className="price-highlight">₹{order.totalAmount}</span>
                        </div>
                        <div className="info-row">
                            <strong>Transaction ID:</strong> <span>{order.transactionId || order.paymentId || 'N/A'}</span>
                        </div>
                    </section>
                </div>

                <section className="detail-section items-section">
                    <h3>Order Items</h3>
                    <div className="table-wrapper">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="item-name">{item.name}</div>
                                        <small className="item-brand">{item.brand}</small>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>₹{item.price}</td>
                                    <td>₹{item.price * item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="text-right"><strong>Total:</strong></td>
                                <td><strong>₹{order.totalAmount}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                </section>
            </div>
            </div>
        </AdminLayout>
    )
}

export default AdminOrderDetails
