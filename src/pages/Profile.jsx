import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Spinner from '../components/Spinner'
import './Profile.css'

function Profile() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    })
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/customer/login')
                return
            }

            try {
                const response = await fetch('http://localhost:5000/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setUser(data.user)
                    setFormData({
                        name: data.user.name,
                        phone: data.user.phone || ''
                    })
                    localStorage.setItem('user', JSON.stringify(data.user))
                } else {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    navigate('/customer/login')
                }
            } catch (error) {
                console.error('Error fetching user data:', error)
                toast.error('Failed to load profile data')
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [navigate])

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        const formData = new FormData()
        formData.append('photo', file)

        setUploading(true)
        const loadingToast = toast.loading('Uploading photo...')

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:5000/api/auth/profile/photo', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server error (${res.status})`);
            }

            if (res.ok) {
                const updatedUser = { ...user, profilePhoto: data.profilePhoto }
                setUser(updatedUser)
                localStorage.setItem('user', JSON.stringify(updatedUser))
                toast.success('Profile photo updated successfully!', { id: loadingToast })
            } else {
                toast.error(data.message || 'Failed to upload photo', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error uploading photo:', error)
            toast.error(error.message || 'An error occurred while uploading', { id: loadingToast })
        } finally {
            setUploading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSaveProfile = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required')
            return
        }

        const loadingToast = toast.loading('Updating profile...')

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:5000/api/auth/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (res.ok) {
                setUser(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
                setIsEditing(false)
                toast.success('Profile updated successfully!', { id: loadingToast })
            } else {
                toast.error(data.message || 'Failed to update profile', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile', { id: loadingToast })
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        toast.success('Logged out successfully')
        navigate('/')
    }

    if (loading) {
        return (
            <div className="profile-page">
                <Spinner size="large" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar-container">
                        <div className="profile-avatar-large">
                            {user.profilePhoto ? (
                                <img
                                    src={`http://localhost:5000${user.profilePhoto}`}
                                    alt="Profile"
                                    className="profile-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <span style={{ display: user.profilePhoto ? 'none' : 'block', fontSize: '2em' }}>
                                {user.role === 'admin' ? '🔐' : '👤'}
                            </span>
                        </div>
                        <input
                            type="file"
                            id="photo-upload"
                            hidden
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="photo-upload"
                            className={`profile-upload-btn ${uploading ? 'uploading' : ''}`}
                            title="Update Profile Photo"
                        >
                            {uploading ? <Spinner size="small" color="white" /> : '📷'}
                        </label>
                    </div>
                    <h1>My Profile</h1>
                    <p className="profile-subtitle">Manage your account information</p>
                </div>

                <div className="profile-card">
                    <div className="profile-section">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>Account Information</h2>
                            {!isEditing && (
                                <button className="btn btn-outline" onClick={() => setIsEditing(true)} style={{ padding: '5px 15px', fontSize: '0.9rem' }}>
                                    ✏️ Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="profile-details">
                            <div className="profile-field">
                                <label>Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                ) : (
                                    <div className="profile-value">{user.name}</div>
                                )}
                            </div>

                            <div className="profile-field">
                                <label>Email Address</label>
                                <div className="profile-value" title="Email cannot be changed">{user.email} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(Read-only)</span></div>
                            </div>

                            <div className="profile-field">
                                <label>Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter phone number"
                                    />
                                ) : (
                                    <div className="profile-value">{user.phone || 'N/A'}</div>
                                )}
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
                                <div className="profile-value profile-id" style={{ fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary-color)' }}>
                                    {user.accountId}
                                </div>
                            </div>

                            <div className="profile-field">
                                <label>Account Verified</label>
                                <div className="profile-value">
                                    <span className="verified-badge">
                                        ✅ Verified
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        {isEditing ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => {
                                    setIsEditing(false)
                                    setFormData({ name: user.name, phone: user.phone })
                                }}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleSaveProfile}>
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                    ← Back to Home
                                </button>
                                <button className="btn btn-danger" onClick={handleLogout}>
                                    🚪 Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
