# 🛡️ FRONTEND DASHBOARD PROTECTION SETUP

**Component:** AdminDashboardGuard  
**Location:** src/components/AdminDashboardGuard.jsx  
**Purpose:** Protect admin dashboard from unapproved admins  

---

## 📋 OVERVIEW

The `AdminDashboardGuard` component ensures that:

✅ Only **approved admins** (status = "active") can access dashboard  
✅ **Tokens are verified** on backend before access  
✅ **Helpful error messages** explain why access was denied  
✅ **Redirect to login** if access is denied  
✅ **Admin data context** available throughout dashboard  

---

## 🚀 IMPLEMENTATION

### Step 1: Import the Guard Component

```jsx
import { AdminDashboardGuard, AdminRoute, useAdmin } from './components/AdminDashboardGuard';
```

### Step 2: Wrap Your Dashboard Routes

**In App.jsx or main routing file:**

```jsx
import { AdminDashboardGuard, AdminRoute } from './components/AdminDashboardGuard';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <Routes>
      {/* Other routes... */}
      
      {/* Wrap admin dashboard routes with guard */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute element={<AdminDashboard />} />
        }
      />
      
      <Route
        path="/admin/orders"
        element={
          <AdminRoute element={<AdminOrders />} />
        }
      />
      
      <Route
        path="/admin/users"
        element={
          <AdminRoute element={<AdminUsers />} />
        }
      />
    </Routes>
  );
}
```

### Step 3: Access Admin Data in Components

**Inside any dashboard component:**

```jsx
import { useAdmin } from '../components/AdminDashboardGuard';

function AdminDashboard() {
  const { admin, verifyAccess } = useAdmin();

  return (
    <div>
      <header>
        <h1>Admin Dashboard</h1>
        <p>Welcome, {admin.name}!</p>
        <p>Role: {admin.isSuperAdmin ? 'Super-Admin' : 'Admin'}</p>
      </header>
      
      {/* Your dashboard content */}
    </div>
  );
}
```

---

## 🔄 HOW IT WORKS

### Flow 1: Approved Admin (Access Granted)

```
1. Admin clicks "Admin Dashboard" link
        ↓
2. Frontend: Load AdminDashboardGuard
        ↓
3. Guard: Send token to /api/auth/admin/verify-access
        ↓
4. Backend: Verify token valid
        ↓
5. Backend: Find admin in database
        ↓
6. Backend: Check status = "active" ✅
        ↓
7. Backend: Return { canAccess: true, admin: {...} }
        ↓
8. Frontend: Load dashboard ✅ SUCCESS
```

### Flow 2: Unapproved Admin (Access Denied)

```
1. Admin clicks "Admin Dashboard" link
        ↓
2. Frontend: Load AdminDashboardGuard
        ↓
3. Guard: Send token to /api/auth/admin/verify-access
        ↓
4. Backend: Find admin in database
        ↓
5. Backend: Check status ❌ NOT "active"
        ↓
6. Backend: Return { canAccess: false, reason: "..." }
        ↓
7. Frontend: Show error message ❌
        ↓
8. Frontend: Redirect to login after 5 seconds
```

---

## 💻 COMPONENT CODE REFERENCE

### AdminDashboardGuard Component

```jsx
export const AdminDashboardGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState(null);

  // Verify access on mount
  useEffect(() => {
    verifyAdminAccess();
  }, []);

  // Checks: token valid + admin exists + status = active
  const verifyAdminAccess = async () => {
    const token = localStorage.getItem('adminToken');
    // ... verification logic ...
  };

  // Loading state
  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  // Access denied
  if (!isAuthenticated) {
    return <AccessDeniedScreen error={error} />;
  }

  // Access granted - provide context
  return (
    <AdminContext.Provider value={{ admin: adminData, verifyAccess }}>
      {children}
    </AdminContext.Provider>
  );
};
```

### useAdmin Hook

```jsx
export const useAdmin = () => {
  const context = React.useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminDashboardGuard');
  }
  return context;
};
```

### AdminRoute Wrapper

```jsx
export const AdminRoute = ({ element }) => {
  return (
    <AdminDashboardGuard>
      {element}
    </AdminDashboardGuard>
  );
};
```

---

## 🎨 CUSTOMIZING ERROR MESSAGES

### Access Denied Screen

You can customize the access denied message:

```jsx
// In AdminDashboardGuard.jsx, modify the error display:

if (!isAuthenticated) {
  return (
    <div className="access-denied-container">
      <div className="error-card">
        <h2>❌ Access Denied</h2>
        <p className="error-message">{error}</p>
        
        {/* Show different message based on status */}
        {error.includes('pending') && (
          <p className="info-text">
            Your account is pending super-admin approval.
            <br/>
            This usually takes 1-2 business days.
          </p>
        )}
        
        {error.includes('inactive') && (
          <p className="info-text">
            Your account has been suspended.
            <br/>
            Please contact the administrator.
          </p>
        )}
        
        <button onClick={() => window.location.href = '/admin-login'}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
```

---

## 🔐 SECURITY FEATURES

### 1. Token Verification
```jsx
// Every access checks token validity on backend
const response = await axios.get(
  'http://localhost:5000/api/auth/admin/verify-access',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### 2. Status Enforcement
```javascript
// Backend critically checks status = "active"
if (admin.status !== 'active') {
  return { canAccess: false };
}
```

### 3. Automatic Logout
```jsx
// If access denied, remove token and redirect
if (!canAccess) {
  localStorage.removeItem('adminToken');
  redirectToLogin();
}
```

### 4. Session Validation
```jsx
// Re-verify access whenever admin tries to navigate
// to a protected route
```

---

## 📊 EXAMPLE: COMPLETE PROTECTED DASHBOARD

```jsx
// AdminDashboard.jsx
import React from 'react';
import { AdminRoute, useAdmin } from '../components/AdminDashboardGuard';

function AdminDashboardContent() {
  const { admin, verifyAccess } = useAdmin();

  return (
    <div className="admin-dashboard">
      {/* Header with admin info */}
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-info">
          <p>Name: {admin.name}</p>
          <p>Email: {admin.email}</p>
          <p>Role: {admin.role}</p>
          <p>Status: {admin.status}</p>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="dashboard-content">
        {admin.isSuperAdmin ? (
          // Super-admin gets more options
          <>
            <section>
              <h2>Super-Admin Panel</h2>
              <button onClick={() => window.location.href = '/admin-requests'}>
                Review Admin Requests
              </button>
            </section>
          </>
        ) : (
          // Regular admin gets limited options
          <>
            <section>
              <h2>Admin Panel</h2>
              <p>Access based on permissions: {admin.permissions.join(', ')}</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// Export with protection
export default () => <AdminRoute element={<AdminDashboardContent />} />;
```

---

## 🧪 TESTING THE GUARD

### Test 1: Approved Admin (Should Pass)
```bash
1. Login with approved admin credentials
2. Token saved to localStorage
3. Navigate to dashboard
4. Guard should load dashboard ✅
```

### Test 2: Unapproved Admin (Should Fail)
```bash
1. Submit admin request
2. Don't approve it
3. Try to login (account won't be created)
4. No token - redirect to login ✅
```

### Test 3: Deactivated Admin (Should Fail)
```bash
1. Login as approved admin
2. Super-admin sets status = "inactive"
3. Refresh dashboard
4. Guard should show access denied ✅
```

### Test 4: Expired Token (Should Fail)
```bash
1. Wait for token to expire (7 days)
2. Try to access dashboard
3. (or manually delete localStorage token)
4. Guard should show access denied ✅
```

---

## ⚙️ CONFIGURATION

### Update Token Storage Key (Optional)
```jsx
// In AdminDashboardGuard.jsx
const token = localStorage.getItem('adminToken');  // Change key if needed
```

### Change Verification Endpoint (Optional)
```jsx
const response = await axios.get(
  'http://localhost:5000/api/auth/admin/verify-access',  // Change if needed
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Update Loading Message (Optional)
```jsx
<h3>Verifying your admin credentials...</h3>
<p>This may take a few moment.</p>
```

---

## 📋 CHECKLIST

- [ ] Import AdminDashboardGuard component
- [ ] Wrap dashboard routes with AdminRoute
- [ ] Test approved admin access (should work)
- [ ] Test unapproved admin access (should fail)
- [ ] Verify error messages display correctly
- [ ] Test token expiration (re-login required)
- [ ] Customize UI to match your design
- [ ] Test in production environment

---

## 🎯 QUICK INTEGRATION EXAMPLE

**Minimal setup (5 lines of code):**

```jsx
import { AdminRoute } from './components/AdminDashboardGuard';
import AdminDashboard from './pages/AdminDashboard';

// In your Routes:
<Route
  path="/admin"
  element={<AdminRoute element={<AdminDashboard />} />}
/>
```

**Done!** Your dashboard is now protected. Only approved admins can access it.

---

## 🚀 NEXT STEPS

1. ✅ Add AdminDashboardGuard to routing
2. ✅ Test with approved admin
3. ✅ Test with unapproved admin
4. ✅ Customize error messages
5. ✅ Add super-admin approval dashboard
6. ✅ Deploy to production

---

*Frontend Dashboard Protection Setup - Version 1.0*  
*Last Updated: March 26, 2024*
