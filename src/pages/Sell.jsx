import { useState, useRef } from 'react'
import './Sell.css'

function Sell() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        machineType: '',
        brand: '',
        model: '',
        age: '',
        condition: '',
        description: '',
        expectedPrice: ''
    })

    const [photos, setPhotos] = useState([])
    const [photoPreviews, setPhotoPreviews] = useState([])
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef(null)

    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files)
        addPhotos(files)
    }

    const addPhotos = (files) => {
        const validFiles = files.filter(file => file.type.startsWith('image/'))
        const newPhotos = [...photos, ...validFiles].slice(0, 5) // Max 5 photos
        setPhotos(newPhotos)

        // Generate previews
        const newPreviews = newPhotos.map(file => URL.createObjectURL(file))
        // Revoke old URLs to prevent memory leaks
        photoPreviews.forEach(url => URL.revokeObjectURL(url))
        setPhotoPreviews(newPreviews)
    }

    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index)
        setPhotos(newPhotos)

        URL.revokeObjectURL(photoPreviews[index])
        const newPreviews = photoPreviews.filter((_, i) => i !== index)
        setPhotoPreviews(newPreviews)
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            addPhotos(Array.from(e.dataTransfer.files))
        }
    }

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            // Create FormData for multipart/form-data submission
            const submitData = new FormData()

            // Append form fields
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key])
            })

            // Append photos
            photos.forEach(photo => {
                submitData.append('photos', photo)
            })

            const response = await fetch('http://localhost:5000/api/sell-requests', {
                method: 'POST',
                body: submitData
            })

            const data = await response.json()

            if (response.ok) {
                console.log('Sell request submitted:', data)
                setSubmitted(true)
            } else {
                setError(data.message || 'Failed to submit request')
            }
        } catch (err) {
            console.error('Error submitting form:', err)
            setError('Failed to connect to server. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

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

    const conditionOptions = [
        'Excellent - Like new',
        'Good - Minor wear',
        'Fair - Needs minor repairs',
        'Poor - Needs major repairs'
    ]

    if (submitted) {
        return (
            <div className="sell-page">
                <div className="page-header">
                    <h1>Sell Your Machine</h1>
                    <p>Thank you for your submission!</p>
                </div>
                <section className="section">
                    <div className="container">
                        <div className="success-card card">
                            <div className="success-icon">✅</div>
                            <h2>Request Submitted Successfully!</h2>
                            <p>
                                Thank you for your interest in selling your machine. Our team will review
                                your submission and contact you within 24-48 hours with an offer.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSubmitted(false)
                                    setFormData({
                                        name: '',
                                        email: '',
                                        phone: '',
                                        machineType: '',
                                        brand: '',
                                        model: '',
                                        age: '',
                                        condition: '',
                                        description: '',
                                        expectedPrice: ''
                                    })
                                    setPhotos([])
                                    photoPreviews.forEach(url => URL.revokeObjectURL(url))
                                    setPhotoPreviews([])
                                }}
                            >
                                Submit Another Request
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="sell-page">
            <div className="page-header">
                <h1>Sell Your Machine</h1>
                <p>Get the best value for your used tailoring machines</p>
            </div>

            <section className="section">
                <div className="container">
                    <div className="sell-layout">
                        {/* Info Section */}
                        <div className="sell-info">
                            <h2>Why Sell to Us?</h2>
                            <div className="info-cards">
                                <div className="info-card">
                                    <span className="info-icon">💰</span>
                                    <h3>Best Prices</h3>
                                    <p>Get competitive offers for your used machines.</p>
                                </div>
                                <div className="info-card">
                                    <span className="info-icon">🚚</span>
                                    <h3>Free Pickup</h3>
                                    <p>We handle the transportation at no extra cost.</p>
                                </div>
                                <div className="info-card">
                                    <span className="info-icon">⚡</span>
                                    <h3>Quick Process</h3>
                                    <p>Get your payment within 48 hours of pickup.</p>
                                </div>
                                <div className="info-card">
                                    <span className="info-icon">🤝</span>
                                    <h3>Hassle Free</h3>
                                    <p>Simple paperwork and transparent dealings.</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="sell-form-container">
                            <h2>Submit Your Machine Details</h2>
                            <form className="sell-form" onSubmit={handleSubmit}>
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
                                        <label className="form-label">Brand</label>
                                        <input
                                            type="text"
                                            name="brand"
                                            className="form-input"
                                            placeholder="e.g., Singer, Juki, Brother"
                                            value={formData.brand}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Model Number</label>
                                        <input
                                            type="text"
                                            name="model"
                                            className="form-input"
                                            value={formData.model}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Machine Age (Years)</label>
                                        <input
                                            type="number"
                                            name="age"
                                            className="form-input"
                                            min="0"
                                            value={formData.age}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Condition *</label>
                                    <select
                                        name="condition"
                                        className="form-select"
                                        value={formData.condition}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select condition</option>
                                        {conditionOptions.map((condition, index) => (
                                            <option key={index} value={condition}>{condition}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-textarea"
                                        placeholder="Any additional details about the machine..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                {/* Photo Upload Section */}
                                <div className="form-group">
                                    <label className="form-label">Machine Photos (Max 5)</label>
                                    <div
                                        className={`photo-upload-zone ${dragActive ? 'drag-active' : ''}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handlePhotoChange}
                                            className="photo-input"
                                        />
                                        <div className="upload-icon">📷</div>
                                        <p className="upload-text">Drag & drop photos here or click to browse</p>
                                        <p className="upload-hint">Supports: JPG, PNG, WEBP (Max 5 photos)</p>
                                    </div>

                                    {photoPreviews.length > 0 && (
                                        <div className="photo-previews">
                                            {photoPreviews.map((preview, index) => (
                                                <div key={index} className="photo-preview-item">
                                                    <img src={preview} alt={`Preview ${index + 1}`} />
                                                    <button
                                                        type="button"
                                                        className="remove-photo-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removePhoto(index)
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expected Price (₹)</label>
                                    <input
                                        type="number"
                                        name="expectedPrice"
                                        className="form-input"
                                        placeholder="Your expected price"
                                        value={formData.expectedPrice}
                                        onChange={handleChange}
                                    />
                                </div>

                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Sell
