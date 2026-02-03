import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setMessage('')

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage('OTP sent to your email')
                setTimeout(() => {
                    navigate('/reset-password', { state: { email } })
                }, 2000)
            } else {
                setError(data.message || 'Failed to send OTP')
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
                    <div className="auth-icon">🔑</div>
                    <h1>Forgot Password</h1>
                    <p>Enter your email to receive an OTP</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    {message && <div className="auth-success" style={{color: 'green', marginBottom: '1rem', textAlign: 'center'}}>{message}</div>}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    <div className="auth-footer">
                        Remember your password? <Link to="/customer/login">Login</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ForgotPassword
