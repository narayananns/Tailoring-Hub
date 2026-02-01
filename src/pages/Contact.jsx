import { useState } from 'react'
import './Contact.css'

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })

    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Contact form submitted:', formData)
        setSubmitted(true)
    }

    const contactInfo = [
        {
            icon: '📍',
            title: 'Address',
            lines: ['118/60, Kangayam Cross Road', 'Tirupur – 641 604, Tamil Nadu']
        },
        {
            icon: '📞',
            title: 'Phone',
            lines: ['+91 98431 42979', '+91 99434 20979']
        },
        {
            icon: '✉️',
            title: 'Email',
            lines: ['runningsiva3@gmail.com']
        },
        {
            icon: '🕐',
            title: 'Business Hours',
            lines: ['Mon - Sat: 9:00 AM - 7:00 PM', 'Sunday: Closed']
        }
    ]

    if (submitted) {
        return (
            <div className="contact-page">
                <div className="page-header">
                    <h1>Contact Us</h1>
                    <p>Thank you for reaching out!</p>
                </div>
                <section className="section">
                    <div className="container">
                        <div className="success-card card">
                            <div className="success-icon">✅</div>
                            <h2>Message Sent Successfully!</h2>
                            <p>
                                Thank you for contacting us. We will get back to you
                                within 24-48 hours.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSubmitted(false)
                                    setFormData({
                                        name: '',
                                        email: '',
                                        phone: '',
                                        subject: '',
                                        message: ''
                                    })
                                }}
                            >
                                Send Another Message
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="contact-page">
            <div className="page-header">
                <h1>Contact Us</h1>
                <p>Have questions? We'd love to hear from you</p>
            </div>

            <section className="section contact-section">
                <div className="container">
                    <div className="contact-layout">
                        {/* Contact Info */}
                        <div className="contact-info">
                            <h2>Get in Touch</h2>
                            <p>
                                Reach out to us through any of the following channels.
                                We're here to help with all your tailoring machine needs.
                            </p>

                            <div className="info-list">
                                {contactInfo.map((info, index) => (
                                    <div key={index} className="info-item">
                                        <div className="info-icon">{info.icon}</div>
                                        <div className="info-content">
                                            <h3>{info.title}</h3>
                                            {info.lines.map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>


                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-container">
                            <h2>Send us a Message</h2>
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Your Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        className="form-input"
                                        placeholder="What is this regarding?"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Message *</label>
                                    <textarea
                                        name="message"
                                        className="form-textarea"
                                        placeholder="Your message..."
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>

                                <button type="submit" className="btn btn-primary btn-full">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Placeholder */}
            <section className="map-section">
                <div className="map-placeholder">
                    <div className="map-content">
                        <span>🗺️</span>
                        <p>Map will be integrated here</p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact
