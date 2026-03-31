/**
 * ADMIN DASHBOARD - AUTHENTICATION & AUTHORIZATION
 * 
 * This middleware ensures:
 * - Only approved (active) admins can access dashboard
 * - Super-admin has full access
 * - Regular admins have limited access
 * - Audit trail of all dashboard access
 * 
 * Frontend: React component to protect dashboard routes
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

// Admin Dashboard Protection Component
export const AdminDashboardGuard = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        verifyAdminAccess();
    }, []);

    const verifyAdminAccess = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            // 1. Check if token exists
            if (!token) {
                setError('No authentication token. Please login.');
                setIsAuthenticated(false);
                return;
            }

            // 2. Verify token with backend
            const response = await axios.get(
                'http://localhost:5000/api/admin/verify-access',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const { admin, canAccess, reason } = response.data;

            // 3. Check access permission
            if (!canAccess) {
                setError(reason || 'Access denied. You are not approved to access the dashboard.');
                setIsAuthenticated(false);
                localStorage.removeItem('adminToken');
                return;
            }

            // 4. Check admin status
            if (admin.status !== 'active') {
                setError(`Access denied. Your account status is: ${admin.status}`);
                setIsAuthenticated(false);
                localStorage.removeItem('adminToken');
                return;
            }

            // 5. Grant access
            setAdminData(admin);
            setIsAuthenticated(true);

        } catch (err) {
            console.error('Access verification failed:', err);
            setError('Authentication failed. Please login again.');
            setIsAuthenticated(false);
            localStorage.removeItem('adminToken');
        }
    };

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3>Verifying access...</h3>
                    <p>Please wait while we verify your admin credentials.</p>
                </div>
            </div>
        );
    }

    // Access denied
    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ color: '#d32f2f' }}>❌ Access Denied</h2>
                    <p>{error}</p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
                        <strong>Status:</strong> Awaiting super-admin approval
                    </p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Contact your administrator to request access.
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('adminToken');
                            window.location.href = '/admin-login';
                        }}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Access granted - render dashboard with admin data context
    return (
        <AdminContext.Provider value={{ admin: adminData, verifyAccess: verifyAdminAccess }}>
            {children}
        </AdminContext.Provider>
    );
};

// Context for admin data
export const AdminContext = React.createContext();

export const useAdmin = () => {
    const context = React.useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within AdminDashboardGuard');
    }
    return context;
};

// Protected Route Component
export const AdminRoute = ({ element }) => {
    return (
        <AdminDashboardGuard>
            {element}
        </AdminDashboardGuard>
    );
};

export default AdminDashboardGuard;
