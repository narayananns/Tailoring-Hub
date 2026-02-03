import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Auth.css'

function ResetPassword() {
    const navigate = useNavigate()
    const location = useLocation()
    const emailFromForgot = location.state?.email || ''

    const [formData, setFormData] = useState({
        email: emailFromForgot,
        otp: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setMessage('')

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage('Password reset successful! Redirecting to login...')
                setTimeout(() => {
                    navigate('/customer/login')
                }, 2000)
            } else {
                setError(data.message || 'Failed to reset password')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-icon">🔒</div>
                    <h1>Reset Password</h1>
                    <p>Enter OTP and your new password</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    {message && <div className="auth-success" style={{color: 'green', marginBottom: '1rem', textAlign: 'center'}}>{message}</div>}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">OTP</label>
                        <input
                            type="text"
                            name="otp"
                            className="form-input"
                            placeholder="Enter OTP"
                            value={formData.otp}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            className="form-input"
                            placeholder="Enter new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword
