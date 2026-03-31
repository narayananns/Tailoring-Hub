# 🔐 Professional Admin Access Request & Approval System

## Overview

This system implements a **professional, secure, and auditable workflow** for admin account creation. Instead of instant admin access via a shared admin code, new admins must submit a request that is reviewed and approved by existing **super-admins**.

### Key Features

✅ **Request-Based Registration** - New admins submit requests instead of direct registration  
✅ **Multi-Level Approval** - Only super-admins can approve new admin requests  
✅ **Audit Trail** - All requests, approvals, and rejections are tracked  
✅ **Email Notifications** - Super-admins and requesters are notified  
✅ **Professional Workflow** - Clear status tracking and rejection reasons  
✅ **Role & Permission Control** - Super-admins assign roles and permissions during approval  

---

## Database Schema

### AdminRequest Model

```javascript
{
  // Request Information
  name: String,                    // Admin's full name
  email: String,                   // Unique email address
  password: String,                // Hashed password (bcrypt)
  adminCode: String,               // Hashed admin access code
  
  // Request Status
  status: String,                  // 'pending', 'approved', 'rejected'
  
  // Approval Information
  approvedBy: ObjectId,            // Reference to approving super-admin
  approvedAt: Date,                // When approved
  rejectionReason: String,         // Why rejected (if rejected)
  rejectedAt: Date,                // When rejected
  
  // Role & Permissions
  role: String,                    // 'admin' or 'super-admin'
  permissions: [String],           // Array of 8 permissions
  
  // Request Details
  requestedAt: Date,               // When request submitted
  reason: String,                  // Why admin access needed
  department: String,              // Department/team name
  
  // Tracking
  updatedAt: Date                  // Last update timestamp
}
```

---

## API Endpoints

### 1. 📝 Submit Admin Request

**Endpoint:** `POST /api/admin-management/request`

**No Authentication Required** (Public endpoint)

**Request Body:**
```json
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

**Response (Success):**
```json
{
  "message": "Admin access request submitted successfully. Awaiting super-admin approval.",
  "request": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.supervisor@company.com",
    "status": "pending",
    "requestedAt": "2024-03-26T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "message": "Request for this email already pending approval"
}
```

---

### 2. 📋 View Pending Requests (Super-Admin)

**Endpoint:** `GET /api/admin-management/requests/pending`

**Authentication:** Required (Super-Admin Token)

**Headers:**
```
Authorization: Bearer <super-admin-token>
```

**Response:**
```json
{
  "count": 3,
  "requests": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Supervisor",
      "email": "john.supervisor@company.com",
      "role": "admin",
      "department": "Operations",
      "reason": "Need admin access for order management",
      "requestedAt": "2024-03-26T10:30:00Z"
    },
    ...
  ]
}
```

---

### 3. 📊 View All Requests (Super-Admin)

**Endpoint:** `GET /api/admin-management/requests/all`

**Authentication:** Required (Super-Admin Token)

**Response:**
```json
{
  "pending": {
    "count": 2,
    "requests": [...]
  },
  "approved": {
    "count": 5,
    "requests": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Jane Admin",
        "email": "jane.admin@company.com",
        "status": "approved",
        "approvedByName": "Super Admin Name",
        "approvedByEmail": "super@company.com",
        "approvedAt": "2024-03-26T11:00:00Z"
      }
    ]
  },
  "rejected": {
    "count": 1,
    "requests": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Bob Denied",
        "email": "bob.denied@company.com",
        "status": "rejected",
        "rejectionReason": "Department authorization not provided",
        "rejectedAt": "2024-03-26T12:00:00Z"
      }
    ]
  },
  "total": 8
}
```

---

### 4. 🔍 View Specific Request (Super-Admin)

**Endpoint:** `GET /api/admin-management/request/:id`

**Authentication:** Required (Super-Admin Token)

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Supervisor",
  "email": "john.supervisor@company.com",
  "role": "admin",
  "status": "pending",
  "department": "Operations",
  "reason": "Need admin access for order management",
  "requestedAt": "2024-03-26T10:30:00Z",
  "permissions": [
    "manage_users",
    "manage_orders",
    "manage_machines",
    "manage_spare_parts",
    "view_analytics",
    "manage_payments",
    "view_reports"
  ]
}
```

---

### 5. ✅ Approve Admin Request (Super-Admin)

**Endpoint:** `POST /api/admin-management/approve-request/:id`

**Authentication:** Required (Super-Admin Token)

**Request Body (Optional):**
```json
{
  "permissions": [
    "manage_users",
    "manage_orders",
    "view_analytics"
  ]
}
```

**Response (Success):**
```json
{
  "message": "Admin request approved successfully",
  "admin": {
    "id": "607f1f77bcf86cd799439012",
    "name": "John Supervisor",
    "email": "john.supervisor@company.com",
    "role": "admin",
    "status": "active",
    "permissions": [
      "manage_users",
      "manage_orders",
      "manage_machines",
      "manage_spare_parts",
      "view_analytics",
      "manage_payments",
      "view_reports"
    ]
  },
  "approvedAt": "2024-03-26T11:00:00Z"
}
```

**What Happens:**
- ✅ AdminRequest status set to 'approved'
- ✅ New Admin account created in Admin collection
- ✅ Admin can now login with email + password + admin code
- ✅ Approval email sent to new admin
- ✅ Audit trail recorded

---

### 6. ❌ Reject Admin Request (Super-Admin)

**Endpoint:** `POST /api/admin-management/reject-request/:id`

**Authentication:** Required (Super-Admin Token)

**Request Body (Required):**
```json
{
  "reason": "Department authorization not provided. Please resubmit with proper documentation."
}
```

**Response (Success):**
```json
{
  "message": "Admin request rejected successfully",
  "request": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.supervisor@company.com",
    "status": "rejected",
    "rejectionReason": "Department authorization not provided. Please resubmit with proper documentation.",
    "rejectedAt": "2024-03-26T11:30:00Z"
  }
}
```

**What Happens:**
- ✅ AdminRequest status set to 'rejected'
- ✅ Rejection reason recorded
- ✅ Rejection email sent to requester
- ✅ No admin account created
- ✅ Requester can submit new request later

---

### 7. 🗑️ Cancel Admin Request (Super-Admin)

**Endpoint:** `DELETE /api/admin-management/cancel-request/:id`

**Authentication:** Required (Super-Admin Token)

**Response (Success):**
```json
{
  "message": "Admin request cancelled successfully",
  "request": {
    "email": "john.supervisor@company.com"
  }
}
```

---

## 📊 Complete Workflow

### Step 1: User Submits Request

```
User submits: POST /api/admin-management/request
├── Name, email, password, admin code
├── Department and reason provided
└── Status = 'pending'
```

**Email Sent:** All super-admins receive notification

---

### Step 2: Super-Admin Reviews Request

```
Super-Admin sees: GET /api/admin-management/requests/pending
├── Reviews all pending requests
├── Can view specific request details
└── Decides to approve or reject
```

---

### Step 3: Super-Admin Approves

```
Super-Admin calls: POST /api/admin-management/approve-request/:id
├── Creates new Admin account (active status)
├── Sets role and permissions
├── Records approver and approval time
├── Sends approval email to new admin
└── New admin can now login
```

---

### Step 4: New Admin Logins

```
New admin calls: POST /api/auth/admin/login
├── Email: john.supervisor@company.com
├── Password: SecurePass@123
├── Admin Code: ADMIN-CODE-2024
└── Receives JWT token + admin dashboard access
```

---

## 🔒 Security Features

### 1. **Password & Admin Code Security**
- Both hashed with bcrypt (salt rounds: 10)
- Not returned in any API response
- Selected only when needed for comparison

### 2. **Role-Based Access Control**
- Only super-admins can:
  - View pending requests
  - View all requests history
  - Approve requests
  - Reject requests
  - Cancel requests
- Regular admins cannot see request management

### 3. **Email Validation**
- Email format validated
- Unique email enforcement via MongoDB index
- Check for existing requests or admin accounts

### 4. **Audit Trail**
- All requests logged with:
  - Requester information
  - Submission timestamp
  - Approver identity
  - Approval/rejection timestamp
  - Rejection reason (if applicable)

### 5. **Request Status Enforcement**
- Once approved, request cannot be re-reviewed
- Once rejected, request cannot be approved
- Only pending requests can be cancelled

---

## 📧 Email Notifications

### Notification 1: New Request Submitted

**To:** All Super-Admins  
**Subject:** New Admin Access Request

```
New Admin Access Request

Name: John Supervisor
Email: john.supervisor@company.com
Department: Operations
Reason: Need admin access for order management
Requested Role: admin

Please login to the dashboard to review and approve/reject this request.
```

---

### Notification 2: Request Approved

**To:** New Admin  
**Subject:** Admin Account Approved

```
Your Admin Access Request Has Been Approved!

Hello John Supervisor,

Your request for admin access has been approved by Super Admin Name.

Your admin account is now active.

Credentials:
- Email: john.supervisor@company.com
- Role: admin

You can now login to the admin dashboard with your email, password, and admin code.

Admin Dashboard: http://localhost:5174/admin-login
```

---

### Notification 3: Request Rejected

**To:** Requester  
**Subject:** Admin Access Request - Not Approved

```
Your Admin Access Request

Hello John Supervisor,

Your request for admin access has been reviewed and not approved at this time.

Reason: Department authorization not provided. Please resubmit with proper documentation.

If you have any questions, please contact the administrator.
```

---

## 🧪 Testing the System

### Test Scenario 1: Submit Admin Request

```bash
curl -X POST http://localhost:5000/api/admin-management/request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "testadmin@company.com",
    "password": "TestPass@123",
    "adminCode": "TEST-CODE-2024",
    "reason": "Testing admin workflow",
    "department": "QA"
  }'
```

---

### Test Scenario 2: View Pending Requests (Super-Admin)

```bash
curl -X GET http://localhost:5000/api/admin-management/requests/pending \
  -H "Authorization: Bearer <super-admin-jwt-token>"
```

---

### Test Scenario 3: Approve Request (Super-Admin)

```bash
curl -X POST http://localhost:5000/api/admin-management/approve-request/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super-admin-jwt-token>" \
  -d '{
    "permissions": [
      "manage_users",
      "manage_orders",
      "view_analytics"
    ]
  }'
```

---

### Test Scenario 4: New Admin Logins

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@company.com",
    "password": "TestPass@123",
    "adminCode": "TEST-CODE-2024"
  }'
```

---

## 📋 Request Status Lifecycle

```
PENDING (Initial)
    ↓
    ├─→ APPROVED ✅ (Admin account created, can login)
    │
    └─→ REJECTED ❌ (Reason provided, cannot login)
    
Note: Once approved, status is permanent.
      Once rejected, requester can submit new request.
```

---

## 🎯 Best Practices

### For Super-Admins:

1. ✅ Review all pending requests regularly
2. ✅ Check department authorization before approving
3. ✅ Assign appropriate permissions based on role
4. ✅ Document rejection reasons clearly
5. ✅ Maintain audit trail of all approvals

### For New Admins:

1. ✅ Provide clear reason for admin access
2. ✅ Include department information
3. ✅ Wait for super-admin approval
4. ✅ Use secure password (min 6 chars)
5. ✅ Keep admin code secure

### For System:

1. ✅ Regularly review rejected requests
2. ✅ Monitor approval patterns
3. ✅ Maintain database backups
4. ✅ Test email notifications
5. ✅ Review admin permissions periodically

---

## 🚀 Integration with Admin Dashboard

### Frontend Integration Points:

1. **Admin Request Form**
   - POST /api/admin-management/request
   - Collect: name, email, password, admin code, reason, department

2. **Super-Admin Dashboard**
   - GET /api/admin-management/requests/pending
   - GET /api/admin-management/requests/all
   - POST /api/admin-management/approve-request/:id
   - POST /api/admin-management/reject-request/:id

3. **Notifications**
   - Display pending request count
   - Show approval status
   - Email confirmation tracking

---

## ⚙️ Configuration

### Environment Variables Needed:

```env
JWT_SECRET=your-secret-key
ADMIN_CODE=initial-super-admin-code  # For creating first super-admin
MONGODB_URI=mongodb://localhost:27017/tmms
ADMIN_DASHBOARD_URL=http://localhost:5174
EMAIL_SERVICE=brevo  # For sending notifications
```

---

## 📊 Database Indexes Recommended

```javascript
// For faster queries
db.adminrequests.createIndex({ email: 1 }, { unique: true })
db.adminrequests.createIndex({ status: 1 })
db.adminrequests.createIndex({ requestedAt: -1 })
db.adminrequests.createIndex({ approvedBy: 1 })
```

---

## ✨ Summary

This professional admin access control system provides:

✅ **Secure** - Multi-level approval with audit trails  
✅ **Professional** - Clear workflow and email notifications  
✅ **Scalable** - Handles multiple admin requests  
✅ **Transparent** - Full request history tracking  
✅ **Flexible** - Customizable permissions during approval  

**Result:** Enterprise-grade admin account management with complete accountability.

---

**Last Updated:** March 26, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

