import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [cartCount, setCartCount] = useState(0)
    const navigate = useNavigate()
    const location = useLocation()

    // Check for user on mount and when location changes (after login redirect)
    useEffect(() => {
        const checkUser = () => {
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
                setUser(JSON.parse(storedUser))
            } else {
                setUser(null)
            }
        }

        checkUser()

        // Listen for storage changes (for multi-tab support)
        window.addEventListener('storage', checkUser)

        return () => {
            window.removeEventListener('storage', checkUser)
        }
    }, [location]) // Re-run when location changes (after login redirect)

    // Track cart count
    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]')
            const count = cart.reduce((sum, item) => sum + item.quantity, 0)
            setCartCount(count)
        }

        updateCartCount()
        window.addEventListener('cartUpdated', updateCartCount)
        window.addEventListener('storage', updateCartCount)

        return () => {
            window.removeEventListener('cartUpdated', updateCartCount)
            window.removeEventListener('storage', updateCartCount)
        }
    }, [])

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const closeMenu = () => {
        setIsMenuOpen(false)
        setIsProfileOpen(false)
    }

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setIsProfileOpen(false)
        navigate('/')
        closeMenu()
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.profile-dropdown-container')) {
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeMenu}>
                    <span className="brand-icon">⚙️</span>
                    <span className="brand-text">Running Trader</span>
                </Link>

                <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
                    <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
                </button>

                <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
                    <NavLink to="/" className="nav-link" onClick={closeMenu}>
                        Home
                    </NavLink>
                    <NavLink to="/buy" className="nav-link" onClick={closeMenu}>
                        Buy
                    </NavLink>
                    <NavLink to="/sell" className="nav-link" onClick={closeMenu}>
                        Sell
                    </NavLink>
                    <NavLink to="/service" className="nav-link" onClick={closeMenu}>
                        Service
                    </NavLink>
                    <NavLink to="/about" className="nav-link" onClick={closeMenu}>
                        About
                    </NavLink>
                    <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
                        Contact
                    </NavLink>

                    <div className="nav-auth">
                        {/* Cart Icon */}
                        <Link to="/cart" className="cart-link" onClick={closeMenu}>
                            <span className="cart-icon">🛒</span>
                            {cartCount > 0 && (
                                <span className="cart-badge">{cartCount}</span>
                            )}
                        </Link>

                        {user ? (
                            <div className="profile-dropdown-container">
                                <button className="profile-trigger" onClick={toggleProfile}>
                                    <span className="profile-avatar">
                                        {user.role === 'admin' ? '🔐' : '👤'}
                                    </span>
                                    <span className="profile-name">{user.name}</span>
                                    <span className={`profile-arrow ${isProfileOpen ? 'open' : ''}`}>▼</span>
                                </button>

                                {isProfileOpen && (
                                    <div className="profile-dropdown">
                                        <div className="profile-dropdown-header">
                                            <span className="profile-dropdown-avatar">
                                                {user.role === 'admin' ? '🔐' : '👤'}
                                            </span>
                                            <div className="profile-dropdown-info">
                                                <span className="profile-dropdown-name">{user.name}</span>
                                                <span className="profile-dropdown-email">{user.email}</span>
                                                <span className="profile-dropdown-role">{user.role === 'admin' ? 'Administrator' : 'Customer'}</span>
                                            </div>
                                        </div>
                                        <div className="profile-dropdown-divider"></div>
                                        <Link to="/profile" className="profile-dropdown-item" onClick={closeMenu}>
                                            <span>👤</span> My Profile
                                        </Link>
                                        <Link to="/my-orders" className="profile-dropdown-item" onClick={closeMenu}>
                                            <span>📦</span> My Orders
                                        </Link>
                                        <button className="profile-dropdown-item logout" onClick={handleLogout}>
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/customer/login" className="btn btn-secondary btn-sm" onClick={closeMenu}>
                                    Login
                                </Link>
                                <Link to="/customer/signup" className="btn btn-primary btn-sm" onClick={closeMenu}>
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
