import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Profile() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
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
                    localStorage.setItem('user', JSON.stringify(data.user))
                } else {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    navigate('/customer/login')
                }
            } catch (error) {
                console.error('Error fetching user data:', error)
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
            alert('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        const formData = new FormData()
        formData.append('photo', file)

        setUploading(true)
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
                // Should not happen if backend is behaving, but good for debugging
                const text = await res.text();
                console.error('Server returned non-JSON:', text);
                throw new Error(`Server error (${res.status}). Check console for details.`);
            }

            if (res.ok) {
                const updatedUser = { ...user, profilePhoto: data.profilePhoto }
                setUser(updatedUser)
                localStorage.setItem('user', JSON.stringify(updatedUser))
                alert('Profile photo updated successfully!')
            } else {
                alert(data.message || 'Failed to upload photo')
            }
        } catch (error) {
            console.error('Error uploading photo:', error)
            alert(error.message || 'An error occurred while uploading. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/')
    }

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading...</div>
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
                            {uploading ? '⏳' : '📷'}
                        </label>
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

                            {user.phone && (
                                <div className="profile-field">
                                    <label>Phone Number</label>
                                    <div className="profile-value">{user.phone}</div>
                                </div>
                            )}

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
                                <div className="profile-value profile-id" style={{ fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary)' }}>
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
