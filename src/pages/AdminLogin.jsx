import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

function AdminLogin() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        adminCode: ''
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
            const response = await fetch('http://localhost:5000/api/auth/admin/login', {
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
                navigate('/admin/dashboard')
            } else {
                setError(data.message || 'Login failed')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page admin-auth">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-icon admin-icon">🔐</div>
                    <h1>Admin Login</h1>
                    <p>Access the admin dashboard</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Admin Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter admin email"
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
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Admin Access Code</label>
                        <input
                            type="password"
                            name="adminCode"
                            className="form-input"
                            placeholder="Enter admin access code"
                            value={formData.adminCode}
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
                        className="btn btn-primary btn-full admin-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Need admin access? <Link to="/admin/signup">Request Admin Account</Link></p>
                    <div className="auth-divider">
                        <span>or</span>
                    </div>
                    <p className="customer-link">Are you a customer? <Link to="/customer/login">Customer Login</Link></p>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin
