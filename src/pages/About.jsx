import './About.css'

function About() {
    const timeline = [
        {
            year: '2020',
            title: 'Company Founded',
            description: 'Started with a vision to revolutionize the tailoring machine industry.'
        },
        {
            year: '2021',
            title: 'First 100 Customers',
            description: 'Reached our first milestone of serving 100 happy customers.'
        },
        {
            year: '2022',
            title: 'Service Center Launch',
            description: 'Opened our first dedicated service and repair center.'
        },
        {
            year: '2023',
            title: 'Spare Parts Division',
            description: 'Launched our genuine spare parts distribution network.'
        }
    ]

    return (
        <div className="about-page">
            <div className="page-header">
                <h1>About Running Trader</h1>
                <p>Your trusted partner in tailoring machine solutions</p>
            </div>

            {/* Mission Section */}
            <section className="section mission-section">
                <div className="container">
                    <div className="mission-grid">
                        <div className="mission-content">
                            <h2>Our Mission</h2>
                            <p>
                                At Running Trader, we are dedicated to providing
                                quality tailoring machines, genuine spare parts, and expert services to
                                tailoring businesses of all sizes.
                            </p>
                            <p>
                                We believe in making professional tailoring equipment accessible and affordable,
                                while ensuring our customers receive the best after-sales support in the industry.
                            </p>
                            <div className="mission-stats">
                                <div className="mission-stat">
                                    <span className="stat-value">500+</span>
                                    <span className="stat-text">Machines Sold</span>
                                </div>
                                <div className="mission-stat">
                                    <span className="stat-value">1000+</span>
                                    <span className="stat-text">Happy Customers</span>
                                </div>
                                <div className="mission-stat">
                                    <span className="stat-value">3+</span>
                                    <span className="stat-text">Years Experience</span>
                                </div>
                            </div>
                        </div>
                        <div className="mission-image">
                            <div className="image-placeholder">
                                <span>🪡</span>
                                <p>Quality Tailoring Solutions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="section values-section">
                <div className="container">
                    <h2 className="section-title">Our Values</h2>
                    <div className="grid grid-3 values-grid">
                        <div className="value-card card">
                            <div className="value-icon">🎯</div>
                            <h3>Quality First</h3>
                            <p>We only deal in quality machines and genuine parts that meet industry standards.</p>
                        </div>
                        <div className="value-card card">
                            <div className="value-icon">🤝</div>
                            <h3>Customer Trust</h3>
                            <p>Building long-term relationships through transparent and honest dealings.</p>
                        </div>
                        <div className="value-card card">
                            <div className="value-icon">⚡</div>
                            <h3>Quick Service</h3>
                            <p>Fast response times and efficient solutions for all your service needs.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="section timeline-section">
                <div className="container">
                    <h2 className="section-title">Our Journey</h2>
                    <p className="section-subtitle">
                        A brief look at our growth and achievements
                    </p>
                    <div className="timeline">
                        {timeline.map((item, index) => (
                            <div key={index} className="timeline-item">
                                <div className="timeline-marker">
                                    <span className="timeline-year">{item.year}</span>
                                </div>
                                <div className="timeline-content card">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


        </div>
    )
}

export default About
