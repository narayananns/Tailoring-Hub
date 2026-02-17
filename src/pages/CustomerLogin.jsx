import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

function CustomerLogin() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('http://localhost:5000/api/auth/customer/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
                navigate('/')
            } else {
                if (data.isVerified === false) {
                    setError(
                        <div>
                            {data.message} <br />
                            <Link to="/verify-email" state={{ email: formData.email }} style={{ color: 'white', textDecoration: 'underline' }}>Verify Now</Link>
                        </div>
                    )
                } else {
                    setError(data.message || 'Login failed')
                }
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
                    <div className="auth-icon">👤</div>
                    <h1>Customer Login</h1>
                    <p>Welcome back! Sign in to your account</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
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
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
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
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <Link to="/forgot-password" style={{ color: '#666' }}>Forgot Password?</Link>
                    </div>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/customer/signup">Sign Up</Link></p>
                    <div className="auth-divider">
                        <span>or</span>
                    </div>
                    <p className="admin-link">Are you an admin? <Link to="/admin/login">Admin Login</Link></p>
                </div>
            </div>
        </div>
    )
}

export default CustomerLogin
