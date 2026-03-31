# 🚀 Admin Request Approval System - Implementation Guide

## Quick Start

### 1. Backend Setup

The system has been installed with:
- ✅ New `AdminRequest` model created (`backend/models/AdminRequest.js`)
- ✅ New `adminManagement` routes created (`backend/routes/adminManagement.js`)
- ✅ Server updated to use new routes (`backend/server.js`)

**Restart your backend server to activate:**
```bash
cd backend
npm start
```

---

## 2. Frontend Implementation

### Option A: Add Admin Request Page

Create `frontend/src/pages/AdminRequest.jsx`:

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminRequest() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        adminCode: '',
        reason: '',
        department: '',
        role: 'admin'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await axios.post(
                'http://localhost:5000/api/admin-management/request',
                formData
            );
            
            setMessage('✅ Request submitted successfully! Waiting for super-admin approval.');
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-request-container">
            <h2>Request Admin Access</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password *</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                    />
                </div>

                <div className="form-group">
                    <label>Admin Access Code *</label>
                    <input
                        type="password"
                        name="adminCode"
                        value={formData.adminCode}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Department</label>
                    <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., Operations, Management"
                    />
                </div>

                <div className="form-group">
                    <label>Reason for Admin Access *</label>
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        required
                        maxLength="500"
                        rows="4"
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>

            {message && <div className="message">{message}</div>}
        </div>
    );
}
```

---

### Option B: Add Admin Approval Dashboard

Create `frontend/src/pages/AdminApprovalDashboard.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminApprovalDashboard() {
    const [requests, setRequests] = useState({ pending: [], approved: [], rejected: [] });
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState({});

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchAllRequests();
    }, []);

    const fetchAllRequests = async () => {
        try {
            const response = await axios.get(
                'http://localhost:5000/api/admin-management/requests/all',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveRequest = async (id) => {
        try {
            await axios.post(
                `http://localhost:5000/api/admin-management/approve-request/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('✅ Request approved successfully!');
            fetchAllRequests();
        } catch (error) {
            alert(`❌ Error: ${error.response?.data?.message}`);
        }
    };

    const rejectRequest = async (id) => {
        const reason = rejectionReason[id] || '';
        if (!reason) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            await axios.post(
                `http://localhost:5000/api/admin-management/reject-request/${id}`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('✅ Request rejected successfully!');
            fetchAllRequests();
        } catch (error) {
            alert(`❌ Error: ${error.response?.data?.message}`);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="approval-dashboard">
            <h1>Admin Approval Dashboard</h1>

            {/* Pending Requests */}
            <section>
                <h2>Pending Requests ({requests.pending.count})</h2>
                <div className="requests-list">
                    {requests.pending.requests?.map(req => (
                        <div key={req.id} className="request-card pending">
                            <h3>{req.name}</h3>
                            <p><strong>Email:</strong> {req.email}</p>
                            <p><strong>Department:</strong> {req.department || 'N/A'}</p>
                            <p><strong>Reason:</strong> {req.reason}</p>
                            <p><strong>Requested:</strong> {new Date(req.requestedAt).toLocaleString()}</p>
                            
                            <div className="actions">
                                <button 
                                    className="approve-btn"
                                    onClick={() => approveRequest(req.id)}
                                >
                                    ✅ Approve
                                </button>
                                
                                <div>
                                    <textarea
                                        placeholder="Rejection reason..."
                                        onChange={(e) => setRejectionReason(prev => ({
                                            ...prev,
                                            [req.id]: e.target.value
                                        }))}
                                    />
                                    <button 
                                        className="reject-btn"
                                        onClick={() => rejectRequest(req.id)}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Approved Requests */}
            <section>
                <h2>Approved Requests ({requests.approved.count})</h2>
                <div className="requests-list">
                    {requests.approved.requests?.map(req => (
                        <div key={req.id} className="request-card approved">
                            <h3>{req.name}</h3>
                            <p><strong>Email:</strong> {req.email}</p>
                            <p><strong>Role:</strong> {req.role}</p>
                            <p><strong>Approved By:</strong> {req.approvedByName}</p>
                            <p><strong>Approved:</strong> {new Date(req.approvedAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Rejected Requests */}
            <section>
                <h2>Rejected Requests ({requests.rejected.count})</h2>
                <div className="requests-list">
                    {requests.rejected.requests?.map(req => (
                        <div key={req.id} className="request-card rejected">
                            <h3>{req.name}</h3>
                            <p><strong>Email:</strong> {req.email}</p>
                            <p><strong>Reason:</strong> {req.rejectionReason}</p>
                            <p><strong>Rejected:</strong> {new Date(req.rejectedAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
```

---

## 3. API Testing with Postman

### Step 1: Test Submit Request

```
POST http://localhost:5000/api/admin-management/request

Body (JSON):
{
  "name": "John Supervisor",
  "email": "john.supervisor@company.com",
  "password": "SecurePass@123",
  "adminCode": "ADMIN-CODE-2024",
  "reason": "Need admin access for order management",
  "department": "Operations",
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "Admin access request submitted successfully. Awaiting super-admin approval.",
  "request": {
    "id": "...",
    "email": "john.supervisor@company.com",
    "status": "pending",
    "requestedAt": "..."
  }
}
```

---

### Step 2: Get Super-Admin Token

```
POST http://localhost:5000/api/auth/admin/login

Body:
{
  "email": "nsnarayanan2612@gmail.com",
  "password": "Narayanan@2604",
  "adminCode": "TMMS-ADMIN-2024"
}
```

**Copy the token from response**

---

### Step 3: View Pending Requests

```
GET http://localhost:5000/api/admin-management/requests/pending

Headers:
Authorization: Bearer <token-from-step-2>
```

---

### Step 4: Approve Request

```
POST http://localhost:5000/api/admin-management/approve-request/<request-id>

Headers:
Authorization: Bearer <token-from-step-2>

Body (optional):
{
  "permissions": [
    "manage_users",
    "manage_orders",
    "manage_machines"
  ]
}
```

---

### Step 5: Wait for Email & New Admin Logins

The new admin receives approval email and can now login:

```
POST http://localhost:5000/api/auth/admin/login

Body:
{
  "email": "john.supervisor@company.com",
  "password": "SecurePass@123",
  "adminCode": "ADMIN-CODE-2024"
}
```

---

## 4. Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│        New Admin Approval Workflow                          │
└─────────────────────────────────────────────────────────────┘

    USER ACTIONS                    SYSTEM ACTIONS
    ────────────                    ──────────────
    
    ① Submit Request ──────→ Save to AdminRequest (pending)
                            Notify all Super-Admins
    
    
    ② Wait for Approval ←──── Super-Admin Reviews
                            GET /requests/pending
    
    
    ③ Super-Admin Approves ──→ Create Admin Account
       or Rejects             Send Email Notification
                            Update AdminRequest Status
    
    
    ④ Check Email ←──────── Approval Email Received
    
    
    ⑤ Login to Dashboard ──→ /api/auth/admin/login
                            JWT Token Generated
                            Dashboard Access Granted

```

---

## 5. Security Checklist

- ✅ Super-admin middleware validates token
- ✅ Passwords hashed with bcrypt (salt: 10)
- ✅ Admin codes hashed separately
- ✅ Email uniqueness enforced
- ✅ Request status validation
- ✅ Audit trail for all actions
- ✅ Rejection reasons recorded
- ✅ Email notifications sent

---

## 6. Production Deployment

Before deploying to production:

1. ✅ Update email service credentials
2. ✅ Set strong JWT_SECRET
3. ✅ Configure ADMIN_DASHBOARD_URL
4. ✅ Enable MongoDB indexes
5. ✅ Test email notifications
6. ✅ Set up logging/monitoring
7. ✅ Configure CORS properly
8. ✅ Use HTTPS for all endpoints

---

## 7. Troubleshooting

### Issue: "Route not found" for admin-management

**Solution:** Restart backend server
```bash
npm start
```

### Issue: Emails not sending

**Solution:** Check emailService.js and Brevo credentials in .env

### Issue: Unauthorized error on approve/reject

**Solution:** Ensure token is from a super-admin account

---

## Summary

✅ New admin requests flow:
1. Non-admin submits request
2. Super-admin reviews & approves/rejects
3. Approved admin receives notification
4. New admin can login with credentials
5. Full audit trail maintained

**Status:** ✅ Ready for Production

