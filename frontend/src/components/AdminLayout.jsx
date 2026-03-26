import React from 'react'
import AdminSidebar from './AdminSidebar'
import './AdminLayout.css'

const AdminLayout = ({ children, activeTab, stats }) => {
    return (
        <div className="admin-layout">
            <AdminSidebar activeTab={activeTab} stats={stats} />
            <main className="admin-main-content">
                {children}
            </main>
        </div>
    )
}

export default AdminLayout