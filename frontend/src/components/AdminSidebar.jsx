import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminSidebar.css'

const AdminSidebar = ({ activeTab, stats = {} }) => {
    const navigate = useNavigate()
    
    // Get admin info from localStorage to check if super-admin
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {}
    const isSuperAdmin = user.isSuperAdmin || false

    const handleNavigation = (tab) => {
        navigate(`/admin/dashboard?tab=${tab}`)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/' // Force refresh to clear state if needed, or use navigate
    }

    return (
        <div className="admin-sidebar">
            <div className="admin-profile">
                <h3>Admin Panel</h3>
                <p>Running Trader</p>
            </div>
            <nav className="admin-nav">
                <button 
                    className={activeTab === 'overview' ? 'active' : ''} 
                    onClick={() => handleNavigation('overview')}
                >
                    📊 Overview
                </button>
                <button 
                    className={activeTab === 'inventory' ? 'active' : ''} 
                    onClick={() => handleNavigation('inventory')}
                >
                    🔧 Inventory
                </button>
                <button 
                    className={activeTab === 'sell-requests' ? 'active' : ''} 
                    onClick={() => handleNavigation('sell-requests')}
                >
                    💰 Sell Requests
                    {stats.pendingSellRequests > 0 && <span className="badge">{stats.pendingSellRequests}</span>}
                </button>
                <button 
                    className={activeTab === 'orders' ? 'active' : ''} 
                    onClick={() => handleNavigation('orders')}
                >
                    📦 Orders
                    {stats.pendingOrders > 0 && <span className="badge">{stats.pendingOrders}</span>}
                </button>
                <button 
                    className={activeTab === 'service-bookings' ? 'active' : ''} 
                    onClick={() => handleNavigation('service-bookings')}
                >
                    🛠️ Service Bookings
                    {stats.pendingServiceBookings > 0 && <span className="badge">{stats.pendingServiceBookings}</span>}
                </button>
                <button 
                    className={activeTab === 'contacts' ? 'active' : ''} 
                    onClick={() => handleNavigation('contacts')}
                >
                    ✉️ Messages
                    {stats.totalContacts > 0 && <span className="badge">{stats.totalContacts}</span>} 
                </button>

                <button 
                    className={activeTab === 'customers' ? 'active' : ''} 
                    onClick={() => handleNavigation('customers')}
                >
                    👥 Customers
                </button>
                
                <div className="admin-nav-divider"></div>

                <button onClick={() => navigate('/admin-profile')}>
                    👤 My Profile
                </button>

                {isSuperAdmin && (
                    <button onClick={() => navigate('/admin-requests')}>
                        👑 Admin Requests
                    </button>
                )}
                
                <button onClick={() => navigate('/')}>
                    🏠 Home Site
                </button>
                <button onClick={handleLogout} className="logout-btn">
                    🚪 Logout
                </button>
            </nav>
        </div>
    )
}

export default AdminSidebar