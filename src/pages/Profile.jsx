import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Profile() {
    const [user, setUser] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    })
    const navigate = useNavigate()

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || ''
            })
        } else {
            navigate('/customer/login')
        }
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/')
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading...</div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar-large">
                        {user.role === 'admin' ? '🔐' : '👤'}
                    </div>
                    <h1>My Profile</h1>
                    <p className="profile-subtitle">Manage your account information</p>
                </div>

                <div className="profile-card">
                    <div className="profile-section">
                        <h2>Account Information</h2>

                        <div className="profile-details">
                            <div className="profile-field">
                                <label>Full Name</label>
                                <div className="profile-value">{user.name}</div>
                            </div>

                            <div className="profile-field">
                                <label>Email Address</label>
                                <div className="profile-value">{user.email}</div>
                            </div>

                            <div className="profile-field">
                                <label>Account Type</label>
                                <div className="profile-value">
                                    <span className={`role-badge ${user.role}`}>
                                        {user.role === 'admin' ? '🔐 Administrator' : '👤 Customer'}
                                    </span>
                                </div>
                            </div>

                            <div className="profile-field">
                                <label>Account ID</label>
                                <div className="profile-value profile-id">{user.id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>
                            ← Back to Home
                        </button>
                        <button className="btn btn-danger" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
