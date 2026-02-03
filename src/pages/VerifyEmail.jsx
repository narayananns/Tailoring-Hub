import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Auth.css'

function VerifyEmail() {
    const navigate = useNavigate()
    const location = useLocation()
    const emailFromSignup = location.state?.email || ''
    
    const [formData, setFormData] = useState({
        email: emailFromSignup,
        otp: ''
    })
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)

    useEffect(() => {
        let interval
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [resendTimer])

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
        if (!formData.email || !formData.otp) {
            setError('Please fill in all fields')
            return
        }

        setIsLoading(true)
        setError('')
        setMessage('')

        try {
            const response = await fetch('http://localhost:5000/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                // Login the user immediately after verification
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
                setMessage('Email verified successfully! Redirecting...')
                setTimeout(() => {
                    navigate('/')
                }, 2000)
            } else {
                setError(data.message || 'Verification failed')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOTP = async () => {
        if (!formData.email) {
            setError('Please enter your email to resend OTP')
            return
        }
        
        if (resendTimer > 0) return

        setIsLoading(true)
        setError('')
        setMessage('')
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: formData.email })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage('Authentication code sent successfully')
                setResendTimer(60) // 60 seconds cooldown
            } else {
                setError(data.message || 'Failed to resend OTP')
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
                    <div className="auth-icon">🔐</div>
                    <h1>Verify Your Email</h1>
                    <p>We've sent a 6-digit code to your email</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    {message && <div className="auth-success" style={{color: 'green', marginBottom: '1rem', textAlign: 'center', fontWeight: '500'}}>{message}</div>}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                        <div className="form-group">
                             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                                <label className="form-label" style={{marginBottom: 0}}>Verification Code</label>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input
                                    type="text"
                                    name="otp"
                                    className="form-input"
                                    placeholder="Enter 6-digit code"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    required
                                    maxLength="6"
                                    style={{flex: 1, letterSpacing: '5px', fontSize: '1.2rem', textAlign: 'center'}}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleResendOTP}
                                    className="btn-secondary"
                                    style={{
                                        width: 'auto',
                                        padding: '0 15px',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        height: 'auto'
                                    }}
                                    disabled={resendTimer > 0 || isLoading}
                                >
                                    {resendTimer > 0 ? `${resendTimer}s` : 'Get Code'}
                                </button>
                            </div>
                        </div>

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isLoading}
                        style={{marginTop: '1rem'}}
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    
                    <div className="auth-footer" style={{marginTop: '20px'}}>
                        <p style={{fontSize: '0.9rem', color: '#666'}}>
                            Didn't check your email? Wait for the code to arrive.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default VerifyEmail
