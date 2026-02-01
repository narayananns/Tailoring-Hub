import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
    const features = [
        {
            icon: '🛒',
            title: 'Buy Machines',
            description: 'Browse our wide collection of new and refurbished tailoring machines and spare parts.',
            link: '/buy'
        },
        {
            icon: '💰',
            title: 'Sell Machines',
            description: 'Have an old tailoring machine? Sell it to us and get the best value for your equipment.',
            link: '/sell'
        },
        {
            icon: '🔧',
            title: 'Book Service',
            description: 'Expert maintenance and repair services for all types of tailoring machines.',
            link: '/service'
        }
    ]

    const stats = [
        { number: '500+', label: 'Machines Sold' },
        { number: '1000+', label: 'Happy Customers' },
        { number: '50+', label: 'Spare Parts' },
        { number: '24/7', label: 'Support' }
    ]

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg"></div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <span className="hero-badge">
                            <span className="badge-dot"></span>
                            Trusted Since 2024
                        </span>
                        <h1 className="hero-title">
                            Tailoring Machine <br />
                            <span className="gradient-text">Management System</span>
                        </h1>
                        <p className="hero-description">
                            Your one-stop solution for buying, selling, and servicing industrial tailoring machines.
                            We offer quality equipment, genuine spare parts, and expert maintenance services.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/buy" className="btn btn-primary">
                                Explore Machines
                            </Link>
                            <Link to="/contact" className="btn btn-secondary">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                    <div className="hero-image">
                        <div className="hero-card animate-float">
                            <div className="machine-icon">🪡</div>
                            <p>Premium Tailoring Machines</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section features">
                <div className="container">
                    <h2 className="section-title">What We Offer</h2>
                    <p className="section-subtitle">
                        Comprehensive solutions for all your tailoring machine needs
                    </p>
                    <div className="grid grid-3 features-grid">
                        {features.map((feature, index) => (
                            <Link to={feature.link} key={index} className="feature-card card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                                <span className="feature-link">
                                    Learn More →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="section stats">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-number">{stat.number}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta">
                <div className="container">
                    <div className="cta-card">
                        <h2>Ready to Get Started?</h2>
                        <p>
                            Whether you want to buy, sell, or service your tailoring machine,
                            we're here to help you every step of the way.
                        </p>
                        <div className="cta-buttons">
                            <Link to="/buy" className="btn btn-primary">Browse Machines</Link>
                            <Link to="/sell" className="btn btn-outline">Sell Your Machine</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
