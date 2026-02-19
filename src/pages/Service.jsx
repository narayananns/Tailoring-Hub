import { useState } from 'react'
import './Service.css'

function Service() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        machineType: '',
        brand: '',
        model: '',
        issue: '',
        preferredDate: '',
        preferredTime: ''
    })

    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('http://localhost:5000/api/service-bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                setSubmitted(true)
            } else {
                setError(data.message || 'Failed to submit service request')
                alert(data.message || 'Failed to submit service request')
            }
        } catch (err) {
            console.error('Error submitting service request:', err)
            setError('An error occurred. Please try again later.')
            alert('An error occurred. Please try again later.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const services = [
        {
            icon: '🔧',
            title: 'Regular Maintenance',
            description: 'Periodic servicing to keep your machine running smoothly.',
            price: 'From ₹500'
        },
        {
            icon: '⚡',
            title: 'Emergency Repairs',
            description: 'Quick fixes for urgent breakdowns and issues.',
            price: 'From ₹800'
        },
        {
            icon: '🛠️',
            title: 'Complete Overhaul',
            description: 'Full machine restoration to like-new condition.',
            price: 'From ₹2000'
        },
        {
            icon: '📦',
            title: 'Parts Replacement',
            description: 'Genuine spare parts installation and upgrade.',
            price: 'Based on parts'
        }
    ]

    const machineTypes = [
        'Straight Stitch Machine',
        'Overlock Machine',
        'Interlock Machine',
        'Button Hole Machine',
        'Button Attach Machine',
        'Embroidery Machine',
        'Flat Lock Machine',
        'Other'
    ]

    if (submitted) {
        return (
            <div className="service-page">
                <div className="page-header">
                    <h1>Book a Service</h1>
                    <p>Your service request has been submitted!</p>
                </div>
                <section className="section">
                    <div className="container">
                        <div className="success-card card">
                            <div className="success-icon">✅</div>
                            <h2>Service Booked Successfully!</h2>
                            <p>
                                Thank you for booking a service with us. Our technician will contact you
                                within 24 hours to confirm your appointment.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSubmitted(false)
                                    setFormData({
                                        name: '',
                                        email: '',
                                        phone: '',
                                        address: '',
                                        machineType: '',
                                        brand: '',
                                        model: '',
                                        issue: '',
                                        preferredDate: '',
                                        preferredTime: ''
                                    })
                                }}
                            >
                                Book Another Service
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="service-page">
            <div className="page-header">
                <h1>Book a Service</h1>
                <p>Professional maintenance and repair services for your tailoring machines</p>
            </div>

            {/* Services Overview */}
            <section className="section services-overview">
                <div className="container">
                    <h2 className="section-title">Our Services</h2>
                    <p className="section-subtitle">
                        Expert technicians for all types of tailoring machine repairs
                    </p>
                    <div className="grid grid-4 services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="service-card card">
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                                <span className="service-price">{service.price}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Booking Form */}
            <section className="section booking-section">
                <div className="container">
                    <div className="booking-container">
                        <div className="booking-info">
                            <h2>Book Your Service</h2>
                            <p>Fill out the form and our team will get back to you within 24 hours.</p>
                            <div className="booking-features">
                                <div className="booking-feature">
                                    <span>✓</span>
                                    <p>Experienced technicians</p>
                                </div>
                                <div className="booking-feature">
                                    <span>✓</span>
                                    <p>Genuine spare parts</p>
                                </div>
                                <div className="booking-feature">
                                    <span>✓</span>
                                    <p>Service warranty</p>
                                </div>
                                <div className="booking-feature">
                                    <span>✓</span>
                                    <p>Flexible scheduling</p>
                                </div>
                            </div>
                        </div>

                        <form className="booking-form" onSubmit={handleSubmit}>
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
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
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
                                <label className="form-label">Service Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-input"
                                    placeholder="Full address for service visit"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Machine Type *</label>
                                    <select
                                        name="machineType"
                                        className="form-select"
                                        value={formData.machineType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select type</option>
                                        {machineTypes.map((type, index) => (
                                            <option key={index} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Brand / Model</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        className="form-input"
                                        placeholder="e.g., Singer / Model 1234"
                                        value={formData.brand}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Describe the Issue *</label>
                                <textarea
                                    name="issue"
                                    className="form-textarea"
                                    placeholder="What problem are you facing with your machine?"
                                    value={formData.issue}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Preferred Date</label>
                                    <input
                                        type="date"
                                        name="preferredDate"
                                        className="form-input"
                                        value={formData.preferredDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preferred Time</label>
                                    <select
                                        name="preferredTime"
                                        className="form-select"
                                        value={formData.preferredTime}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select time slot</option>
                                        <option value="morning">Morning (9 AM - 12 PM)</option>
                                        <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                                        <option value="evening">Evening (4 PM - 7 PM)</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full">
                                Book Service Now
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Service
