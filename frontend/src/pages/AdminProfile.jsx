import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Spinner from '../components/Spinner'
import AdminLayout from '../components/AdminLayout'
import './AdminProfile.css'

function AdminProfile() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        status: '',
        permissions: [],
        createdAt: '',
        lastLogin: ''
    })
    const [editForm, setEditForm] = useState({
        name: ''
    })

    useEffect(() => {
        fetchAdminProfile()
    }, [])

    const fetchAdminProfile = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/admin/login')
                return
            }

            const response = await axios.get('http://localhost:5000/api/auth/admin/profile', {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Backend returns data nested under 'admin' key
            const adminData = response.data.admin || response.data
            setProfile({
                name: adminData.name || '',
                email: adminData.email || '',
                role: adminData.role || '',
                status: adminData.status || '',
                permissions: adminData.permissions || [],
                createdAt: adminData.createdAt || '',
                lastLogin: adminData.lastLogin || ''
            })
            setEditForm({ name: adminData.name || '' })
            setLoading(false)
        } catch (error) {
            console.error('Error fetching profile:', error)
            console.error('Response data:', error.response?.data)
            toast.error(error.response?.data?.message || 'Failed to load profile')
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setEditForm({ ...editForm, [name]: value })
    }

    const handleSaveProfile = async () => {
        try {
            if (!editForm.name.trim()) {
                toast.error('Name cannot be empty')
                return
            }

            const token = localStorage.getItem('token')
            const response = await axios.put('http://localhost:5000/api/auth/admin/profile', editForm, {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Backend returns updated data nested under 'admin' key
            const updatedData = response.data.admin || response.data
            setProfile({
                ...profile,
                name: updatedData.name || profile.name
            })
            setEditing(false)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.error(error.response?.data?.message || 'Failed to update profile')
        }
    }

    if (loading) {
        return (
            <AdminLayout activeTab="profile">
                <div className="profile-loading">
                    <Spinner />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout activeTab="profile">
            <div className="admin-profile-container">
                <div className="profile-header">
                    <h1>👤 Admin Profile</h1>
                    <p>View and manage your profile information</p>
                </div>

                <div className="profile-card">
                    <div className="profile-top">
                        <div className="profile-avatar">
                            <span>{profile.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="profile-header-info">
                            <h2>{profile.name}</h2>
                            <p className="role-badge">{profile.role}</p>
                            <span className={`status-badge status-${profile.status?.toLowerCase()}`}>
                                {profile.status}
                            </span>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="detail-section">
                            <h3>Contact Information</h3>
                            <div className="detail-row">
                                <label>Email:</label>
                                <span>{profile.email}</span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Account Details</h3>
                            <div className="detail-row">
                                <label>Role:</label>
                                <span className="role-tag">{profile.role}</span>
                            </div>
                            <div className="detail-row">
                                <label>Status:</label>
                                <span className={`status-tag status-${profile.status?.toLowerCase()}`}>
                                    {profile.status}
                                </span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Permissions</h3>
                            <div className="permissions-grid">
                                {profile.permissions && profile.permissions.length > 0 ? (
                                    profile.permissions.map((perm, idx) => (
                                        <span key={idx} className="permission-badge">
                                            ✓ {perm}
                                        </span>
                                    ))
                                ) : (
                                    <p>No permissions assigned</p>
                                )}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Dates</h3>
                            <div className="detail-row">
                                <label>Created:</label>
                                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-row">
                                <label>Last Login:</label>
                                <span>{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}</span>
                            </div>
                        </div>

                        <div className="detail-section edit-section">
                            <h3>Edit Profile</h3>
                            {!editing ? (
                                <button className="btn-edit" onClick={() => setEditing(true)}>
                                    ✏️ Edit Name
                                </button>
                            ) : (
                                <div className="edit-form">
                                    <input
                                        type="text"
                                        name="name"
                                        value={editForm.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter new name"
                                        className="edit-input"
                                    />
                                    <div className="edit-buttons">
                                        <button onClick={handleSaveProfile} className="btn-save">
                                            💾 Save
                                        </button>
                                        <button onClick={() => setEditing(false)} className="btn-cancel">
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminProfile
