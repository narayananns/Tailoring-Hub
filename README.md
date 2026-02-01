# TMMS - Tailoring Machine Management System

A full-stack web application for managing tailoring machines - buy, sell, and service.

## 🎯 Project Overview

TMMS is an academic project designed to help a tailoring machine business manage their operations:
- **Buy**: Browse and purchase new/refurbished tailoring machines and spare parts
- **Sell**: Customers can sell their used tailoring machines
- **Service**: Book maintenance and repair services

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Styling**: Vanilla CSS with modern design system

## 📁 Project Structure

```
cons/
├── src/                    # Frontend React application
│   ├── components/         # Reusable components (Navbar, Footer)
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Buy.jsx
│   │   ├── Sell.jsx
│   │   ├── Service.jsx
│   │   ├── About.jsx
│   │   └── Contact.jsx
│   ├── App.jsx             # Main app with routing
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles & design system
├── server/                 # Backend Express application
│   ├── index.js            # Server entry point
│   ├── package.json        # Server dependencies
│   └── .env                # Environment variables
└── package.json            # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   npm install react-router-dom
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Server runs at: http://localhost:5000

2. **Start the Frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   Frontend runs at: http://localhost:5173

## 📄 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with features overview |
| Buy | `/buy` | Browse machines and spare parts |
| Sell | `/sell` | Form to sell used machines |
| Service | `/service` | Book machine repair/maintenance |
| About | `/about` | Company information |
| Contact | `/contact` | Contact form and info |

## 🎨 Design Features

- Modern dark theme with glassmorphism effects
- Responsive design for all screen sizes
- Smooth animations and transitions
- Premium UI/UX with gradient accents

## 📝 Future Development

- [ ] MongoDB database integration
- [ ] User authentication
- [ ] Admin dashboard
- [ ] Image upload for machines
- [ ] Payment gateway integration
- [ ] Email notifications

---

**Academic Project** | Built with ❤️
