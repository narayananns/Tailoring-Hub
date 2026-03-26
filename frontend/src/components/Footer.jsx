import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <span className="brand-icon">⚙️</span>
                            <span className="brand-text">Running Trader</span>
                        </Link>
                        <p className="footer-description">
                            Running Trader - Your one-stop solution for buying, selling,
                            and servicing tailoring machines and spare parts.
                        </p>
                    </div>

                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/buy">Buy Machines</Link></li>
                            <li><Link to="/sell">Sell Machines</Link></li>
                            <li><Link to="/service">Book Service</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Company</h4>
                        <ul>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4>Contact Info</h4>
                        <ul>
                            <li>📍 118/60, Kangayam Cross Road, Tirupur</li>
                            <li>📞 +91 98431 42979</li>
                            <li>✉️ runningsiva3@gmail.com</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {currentYear} Running Trader. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
