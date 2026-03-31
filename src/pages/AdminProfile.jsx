import React, { useState, useEffect } from 'react';
import './AdminProfile.css';
import axios from 'axios';

function AdminProfile() {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        fetchAdminProfile();
    }, []);

    const fetchAdminProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                setError('No authentication token. Please login.');
                setLoading(false);
                return;
            }

            const response = await axios.get(
                'http://localhost:5000/api/auth/admin/profile',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAdmin(response.data.admin);
            setFormData({ name: response.data.admin.name });
            setError(null);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.response?.data?.message || 'Error loading profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            
            await axios.put(
                'http://localhost:5000/api/auth/admin/profile',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAdmin(prev => ({
                ...prev,
                name: formData.name
            }));
            setEditing(false);
            setError(null);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Error updating profile');
        }
    };

    const getRoleDisplay = (role) => {
        return role === 'super-admin' ? '👑 Super Admin' : '👤 Admin';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#4caf50';
            case 'inactive':
                return '#ff9800';
            case 'suspended':
                return '#f44336';
            default:
                return '#999';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'active':
                return '✅ Active';
            case 'inactive':
                return '⏸️ Inactive';
            case 'suspended':
                return '🚫 Suspended';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className="admin-profile-container loading">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error || !admin) {
        return (
            <div className="admin-profile-container error">
                <h2>❌ Error</h2>
                <p>{error || 'Failed to load profile'}</p>
                <button onClick={fetchAdminProfile} className="btn-retry">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="admin-profile-container">
            {/* Header */}
            <div className="profile-header">
                <h1>👤 Admin Profile</h1>
                <p className="subtitle">Your Account Details & Information</p>
            </div>

            {/* Main Profile Card */}
            <div className="profile-card">
                {/* Profile Photo Section */}
                <div className="profile-photo-section">
                    <div className="profile-photo">
                        {admin.profilePhoto ? (
                            <img src={admin.profilePhoto} alt={admin.name} />
                        ) : (
                            <div className="profile-photo-placeholder">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Information Grid */}
                <div className="profile-grid">
                    {/* Name Section */}
                    <div className="profile-section">
                        <div className="section-title">📝 Name</div>
                        <div className="section-content">
                            {editing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="edit-input"
                                />
                            ) : (
                                <p className="field-value">{admin.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="profile-section">
                        <div className="section-title">📧 Email Address</div>
                        <div className="section-content">
                            <p className="field-value">{admin.email}</p>
                        </div>
                    </div>

                    {/* Role Section */}
                    <div className="profile-section">
                        <div className="section-title">👑 Role</div>
                        <div className="section-content">
                            <p className="field-value role-badge">
                                {getRoleDisplay(admin.role)}
                            </p>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="profile-section">
                        <div className="section-title">🔐 Account Status</div>
                        <div className="section-content">
                            <p className="field-value" style={{ color: getStatusColor(admin.status) }}>
                                {getStatusDisplay(admin.status)}
                            </p>
                        </div>
                    </div>

                    {/* Created Date */}
                    <div className="profile-section">
                        <div className="section-title">📅 Member Since</div>
                        <div className="section-content">
                            <p className="field-value">
                                {new Date(admin.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Last Login */}
                    <div className="profile-section">
                        <div className="section-title">🕐 Last Login</div>
                        <div className="section-content">
                            <p className="field-value">
                                {admin.lastLogin 
                                    ? new Date(admin.lastLogin).toLocaleString()
                                    : 'Never logged in'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="permissions-section">
                    <div className="section-title">🔑 Permissions</div>
                    <div className="permissions-grid">
                        {admin.permissions && admin.permissions.length > 0 ? (
                            admin.permissions.map((permission, index) => (
                                <div key={index} className="permission-badge">
                                    ✅ {permission.replace(/_/g, ' ')}
                                </div>
                            ))
                        ) : (
                            <p className="no-permissions">No permissions assigned</p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="profile-actions">
                    {!editing ? (
                        <button 
                            onClick={() => setEditing(true)}
                            className="btn btn-edit"
                        >
                            ✏️ Edit Profile
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handleSaveProfile}
                                className="btn btn-save"
                            >
                                ✅ Save Changes
                            </button>
                            <button 
                                onClick={() => {
                                    setEditing(false);
                                    setFormData({ name: admin.name });
                                }}
                                className="btn btn-cancel"
                            >
                                ❌ Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Additional Info Card */}
            <div className="info-card">
                <h3>💡 Account Information</h3>
                <ul className="info-list">
                    <li>✅ Your account status is: <strong>{admin.status}</strong></li>
                    <li>👑 Your role is: <strong>{admin.role}</strong></li>
                    <li>🔑 You have <strong>{admin.permissions?.length || 0}</strong> permissions</li>
                    <li>📧 Your email: <strong>{admin.email}</strong></li>
                </ul>
            </div>
        </div>
    );
}

export default AdminProfile;
