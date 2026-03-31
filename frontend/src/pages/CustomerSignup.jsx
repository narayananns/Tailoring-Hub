import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../utils/api'
import './Auth.css'

function CustomerSignup() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1: Details, 2: Verification
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
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

    const handleSignupSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        if (!/^\d{10}$/.test(formData.phone)) {
            setError('Phone number must be exactly 10 digits')
            setIsLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            setIsLoading(false)
            return
        }

        try {
            // First check if email already exists
            const checkResponse = await apiClient.post('/api/auth/check-email', {
                email: formData.email
            })

            const emailStatus = checkResponse.data

            if (!emailStatus.available) {
                // Email already registered
                if (emailStatus.isVerified) {
                    setError(
                        <div>
                            <p>📧 This email is already registered and verified.</p>
                            <p style={{ marginTop: '10px' }}>
                                <Link to="/customer/login" style={{ color: '#FFC107', textDecoration: 'underline', fontWeight: 'bold' }}>
                                    → Login to your account
                                </Link>
                            </p>
                        </div>
                    )
                } else {
                    setError(
                        <div>
                            <p>📧 This email is registered but not verified yet.</p>
                            <p style={{ marginTop: '10px' }}>
                                <Link to="/verify-email" state={{ email: formData.email }} style={{ color: '#FFC107', textDecoration: 'underline', fontWeight: 'bold' }}>
                                    → Verify your email to login
                                </Link>
                            </p>
                        </div>
                    )
                }
                setIsLoading(false)
                return
            }

            // Email is available, proceed with registration
            console.log('📝 Registering new account:', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });

            const response = await apiClient.post('/api/auth/customer/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            })

            const data = response.data

            if (response.status === 201) {
                setStep(2)
                setSuccessMessage('✅ Account created! Check your email for the verification code.')
                setResendTimer(60)
            } else {
                setError(data.message || 'Registration failed')
            }
        } catch (err) {
            console.error('Registration error:', err);
            const errorData = err.response?.data
            
            // Better error messages
            if (errorData?.message?.includes('already')) {
                setError(
                    <div>
                        <p>📧 This email is already registered.</p>
                        <p style={{ marginTop: '10px' }}>
                            <Link to="/customer/login" style={{ color: '#FFC107', textDecoration: 'underline', fontWeight: 'bold' }}>
                                → Try logging in instead
                            </Link>
                        </p>
                    </div>
                )
            } else {
                setError(errorData?.message || err.message || 'Failed to register. Please try again.');
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifySubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const response = await apiClient.post('/api/auth/verify-email', {
                email: formData.email,
                otp
            })

            const data = response.data

            if (response.status === 200) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
                setSuccessMessage('Verification Successful! Logging in...')
                setTimeout(() => {
                    navigate('/')
                }, 1500)
            } else {
                setError(data.message || 'Verification failed')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOTP = async () => {
        if (resendTimer > 0) return

        setIsLoading(true)
        try {
            const response = await apiClient.post('/api/auth/resend-otp', { email: formData.email })

            if (response.status === 200) {
                setSuccessMessage('Code resent successfully')
                setResendTimer(60)
            } else {
                setError('Failed to resend code')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-icon">{step === 1 ? '🧵' : '✉️'}</div>
                    <h1>{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
                    <p>{step === 1 ? 'Join us and start exploring our machines' : `Enter the code sent to ${formData.email}`}</p>
                </div>

                {step === 1 ? (
                    <form className="auth-form" onSubmit={handleSignupSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

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
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                placeholder="Enter your phone number"
                                value={formData.phone}
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
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
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
                            {isLoading ? 'Creating Account...' : 'Sign Up & Verify'}
                        </button>

                        <div className="auth-footer">
                            <p>Already have an account? <Link to="/customer/login">Sign In</Link></p>
                        </div>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleVerifySubmit}>
                        <div className="form-group">
                            <label className="form-label">Verification Code</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength="6"
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '1.5rem',
                                        letterSpacing: '0.5rem',
                                        flex: 1
                                    }}
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
                                    {resendTimer > 0 ? `${resendTimer}s` : 'Resend Code'}
                                </button>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {successMessage && <div className="success-message" style={{ color: 'green', textAlign: 'center', marginBottom: '1rem' }}>{successMessage}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary btn-full"
                            style={{ marginTop: '1rem', background: '#f8f9fa', color: '#333', border: '1px solid #ddd' }}
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                        >
                            Change Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default CustomerSignup
