# Frontend-Backend API Integration Fix

## Problem
The frontend deployed on Netlify was getting **404 errors** when calling the backend API at `https://tailoring-hub.onrender.com`.

**Root Cause**: The frontend was using **relative API paths** (e.g., `/api/auth/customer/register`), which resolved to the Netlify domain instead of the Render backend domain.

## Solution Implemented

### 1. Created Centralized API Client (`frontend/src/utils/api.js`)
- Single axios instance configured with the base URL from environment variables
- Automatically includes JWT tokens in request headers  
- Handles 401 errors by redirecting to login
- Used across all pages for consistent API calls

### 2. Updated Frontend Pages to Use API Client
**Updated Pages:**
- `CustomerLogin.jsx` - Changed from `fetch()` to `apiClient.post()`
- `CustomerSignup.jsx` - Changed from `fetch()` to `apiClient.post()`

**Other pages still need updating** (still using `fetch()`):
- `AdminLogin.jsx`
- `AdminSignup.jsx`
- `ForgotPassword.jsx`
- `ResetPassword.jsx`
- `VerifyEmail.jsx`
- `Profile.jsx`
- `Checkout.jsx`
- `Sell.jsx`
- `Service.jsx`
- `MyOrders.jsx`
- `MySellRequests.jsx`

### 3. Backend Configuration
The backend is properly configured:
- ✅ `express.json()` middleware for JSON parsing
- ✅ `cors()` enabled to accept requests from anywhere
- ✅ Routes mounted at `/api/auth` for authentication
- ✅ Test route available at `GET /api/test`
- ✅ Error handling middleware in place

## Environment Configuration

### Frontend - Netlify Deployment
**Set this environment variable in Netlify:**
```
VITE_API_URL=https://tailoring-hub.onrender.com
```

**Steps:**
1. Go to Netlify Dashboard → Your Site
2. Site settings → Build & deploy → Environment
3. Add/Edit the variable `VITE_API_URL=https://tailoring-hub.onrender.com`
4. Trigger a new deploy

### Backend - Render Deployment
No additional configuration needed. The backend is already running and accessible.

## How to Complete the Fix

### Option A: Quick Fix (Immediate)
Just deploy the current changes to both Netlify and Render:

**Frontend:**
```bash
git push origin main  # Netlify will auto-deploy via GitHub
```

**Backend:**
```bash
git push origin main  # Render will auto-deploy via GitHub
```

Then set the `VITE_API_URL` environment variable in Netlify.

### Option B: Complete Fix (Recommended)
Update all remaining pages to use the `apiClient`:

```bash
# For each page file that uses fetch('/api/...'):
```

Replace:
```javascript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// fetch('/api/...')
```

With:
```javascript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/api'

// apiClient.post('/api/...')
```

## Testing

### Test the API is working:
```
GET https://tailoring-hub.onrender.com/api/test
```
Should return: `{ "message": "API working" }`

### Test Customer Registration:
```bash
curl -X POST https://tailoring-hub.onrender.com/api/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "testpass123"
  }'
```

Expected response: `{ "success": true, "message": "User registered successfully..." }`

## Deployment Checklist

- [ ] Push changes to GitHub
- [ ] Render auto-deploys backend changes
- [ ] Set `VITE_API_URL=https://tailoring-hub.onrender.com` in Netlify environment
- [ ] Trigger new deploy on Netlify
- [ ] Test registration at `https://your-netlify-site.netlify.app/signup`
- [ ] Verify no 404 errors in browser console
