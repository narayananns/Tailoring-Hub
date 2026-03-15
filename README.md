# 🧵 Tailoring Machine Management System (TMMS)

A comprehensive, full-stack web application designed to digitize and streamline the operations of a tailoring machine business. This system facilitates buying, selling, and servicing tailoring machines with a robust Admin Dashboard for complete business management.

## 🌟 Key Features

### 🛍️ Client Applications
*   **Product Catalog**: Browse new and refurbished machines/spare parts with detailed specifications and images.
*   **Smart Cart & Checkout**: Seamless shopping experience with integrated payment gateway (Razorpay).
*   **Order Tracking**: Visual, real-time **Order Timeline** tracking from confirmation to delivery.
*   **Sell Requests**: Users can submit requests to sell their used machines directly through the portal.
*   **Service Booking**: Schedule maintenance or repair services with preferred dates and issue descriptions.
*   **Account Management**: Profile management, order history, and downloadable **PDF Invoices**.
*   **Secure Authentication**: Email verification, OTP-based password resets, and JWT-secured sessions.

### 🛠️ Admin Dashboard
*   **Executive Overview**: Interactive charts and graphs (Revenue, Order Status, Stock Levels) using `Recharts`.
*   **Order Management**: View details, update statuses, print invoices, and perform bulk actions.
*   **Inventory Control**: Add, edit, or remove machines and parts with image handling.
*   **Service & Sell Requests**: Kanban-style board or list views to manage incoming service and sell requests.
*   **Reports & Analytics**: Export data (Orders, Sell Requests, Service Bookings) to **CSV** for offline analysis.
*   **Communication**: Direct WhatsApp/Call integration to contact customers quickly.

---

## 🏗️ Technology Stack

### Frontend
*   **Framework**: React.js 19 (Vite)
*   **Styling**: Custom CSS3 with CSS Variables, Responsive Design
*   **Motion**: `framer-motion` for smooth page transitions and micro-interactions
*   **State Management**: React Hooks & Context API
*   **Charts**: `recharts` for data visualization
*   **Routing**: `react-router-dom` v7
*   **HTTP Client**: `axios`

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (Mongoose ODM)
*   **Authentication**: JSON Web Tokens (JWT) & bcryptjs
*   **Payment**: Razorpay Integration
*   **Email Service**: Brevo (formerly Sendinblue) Transactional Emails
*   **File Handling**: Multer (for image uploads)

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   MongoDB (Local or Atlas Connection String)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/tmms.git
cd tmms
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:
```env
# Server Configuration
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tmms_db

# Security
JWT_SECRET=your_super_secret_jwt_key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Service (Brevo)
BREVO_API_KEY=xkeysib-...
BREVO_USER=your_verified_sender_email@domain.com
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the root directory, and install dependencies:
```bash
# From project root
npm install
```

Create a `.env` file in the root directory (optional, if you have environment specific configs):
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

---

## 📡 API Documentation

### Authentication (`/api/auth`)
*   `POST /register`: Register a new user
*   `POST /login`: authenticate user & return token
*   `POST /verify-email`: Verify OTP
*   `POST /forgot-password`: Request password reset OTP

### Machines (`/api/machines`)
*   `GET /`: List all machines
*   `GET /:id`: Get machine details
*   `POST /`: Add new machine (Admin only)
*   `PUT /:id`: Update machine (Admin only)

### Orders (`/api/orders`)
*   `POST /`: Create a new order
*   `GET /my-orders`: Get current user's orders
*   `PUT /:id/status`: Update order status (Admin only, triggers email)

### Service (`/api/service-bookings`)
*   `POST /`: Book a service
*   `GET /`: List all bookings (Admin only)

### Sell (`/api/sell`)
*   `POST /`: Submit a sell request

---

## 📂 Project Structure

```
tmms/
├── public/                 # Static assets (images, icons)
├── server/                 # Backend Application
│   ├── models/             # Mongoose Schemas (User, Order, Machine, etc.)
│   ├── routes/             # Express API Routes
│   ├── utils/              # Helper functions (Email, etc.)
│   └── server.js           # Entry point
├── src/                    # Frontend Application
│   ├── assets/             # Local assets
│   ├── components/         # Reusable UI components (Navbar, Footer, Charts)
│   ├── config/             # Configuration files (Razorpay)
│   ├── pages/              # Main Page Views (Home, AdminDashboard, etc.)
│   ├── App.jsx             # Main Component & Routing Logic
│   └── main.jsx            # DOM Rendering
└── package.json            # Project dependencies & scripts
```

## 🤝 Workflow

1.  **User Registration**: Users sign up and verify their email via OTP.
2.  **Browsing**: Users browse machines/spare parts.
3.  **Checkout**: Users add items to cart -> Checkout -> Payment via Razorpay.
4.  **Order Processing**:
    *   Admin receives order in Dashboard.
    *   Admin updates status (Confirmed -> Shipped -> Delivered).
    *   User receives email updates at each stage.
5.  **Service/Sell**: Users fill forms for service or selling; Admin manages these via Kanban/List views.

## 🛡️ Security
*   **RBAC**: Role-Based Access Control (User vs Admin).
*   **Data Protection**: Passwords hashed using `bcryptjs`.
*   **API Security**: Protected routes require valid JWT in `Authorization` header.

---
