import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Spinner from '../components/Spinner'
import AdminLayout from '../components/AdminLayout'
import './SuperAdminRequests.css'

function SuperAdminRequests() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState({
        pending: [],
        approved: [],
        rejected: []
    })
    const [activeTab, setActiveTab] = useState('pending')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [approveReason, setApproveReason] = useState('')
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        fetchAdminRequests()
    }, [])

    const fetchAdminRequests = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/admin/login')
                return
            }

            const response = await axios.get('http://localhost:5000/api/auth/admin/requests', {
                headers: { Authorization: `Bearer ${token}` }
            })

            setRequests(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching requests:', error)
            toast.error(error.response?.data?.message || 'Failed to load requests')
            setLoading(false)
        }
    }

    const handleApproveRequest = async (request) => {
        try {
            const token = localStorage.getItem('token')
            await axios.post(`http://localhost:5000/api/auth/admin/requests/${request._id}/approve`, {
                approvalReason: approveReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            toast.success('Admin request approved successfully!')
            setSelectedRequest(null)
            setApproveReason('')
            fetchAdminRequests()
        } catch (error) {
            console.error('Error approving request:', error)
            toast.error(error.response?.data?.message || 'Failed to approve request')
        }
    }

    const handleRejectRequest = async (request) => {
        try {
            const token = localStorage.getItem('token')
            await axios.post(`http://localhost:5000/api/auth/admin/requests/${request._id}/reject`, {
                rejectionReason: rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            toast.success('Admin request rejected!')
            setSelectedRequest(null)
            setRejectReason('')
            fetchAdminRequests()
        } catch (error) {
            console.error('Error rejecting request:', error)
            toast.error(error.response?.data?.message || 'Failed to reject request')
        }
    }

    if (loading) {
        return (
            <AdminLayout activeTab="admin-requests">
                <div className="loading-container">
                    <Spinner />
                </div>
            </AdminLayout>
        )
    }

    const RequestDetailView = ({ request, type }) => (
        <div className="request-detail-overlay">
            <div className="request-detail-modal">
                <button className="close-detail" onClick={() => setSelectedRequest(null)}>✕</button>
                
                <h2>Admin Request Details</h2>
                
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Name:</label>
                        <span>{request.name}</span>
                    </div>
                    <div className="detail-item">
                        <label>Email:</label>
                        <span>{request.email}</span>
                    </div>
                    <div className="detail-item">
                        <label>Role:</label>
                        <span className="role-tag">{request.role}</span>
                    </div>
                    <div className="detail-item">
                        <label>Status:</label>
                        <span className={`status-tag status-${request.status}`}>{request.status}</span>
                    </div>
                    <div className="detail-item full-width">
                        <label>Requested At:</label>
                        <span>{new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                </div>

                {request.status === 'pending' && (
                    <div className="action-section">
                        <h3>Take Action</h3>
                        
                        <div className="action-form">
                            <div className="approve-section">
                                <h4>✅ Approve Request</h4>
                                <textarea
                                    placeholder="Add approval reason (optional)"
                                    value={approveReason}
                                    onChange={(e) => setApproveReason(e.target.value)}
                                    className="textarea-input"
                                />
                                <button 
                                    onClick={() => handleApproveRequest(request)}
                                    className="btn-approve"
                                >
                                    Approve Admin
                                </button>
                            </div>

                            <div className="divider"></div>

                            <div className="reject-section">
                                <h4>❌ Reject Request</h4>
                                <textarea
                                    placeholder="Add rejection reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="textarea-input"
                                />
                                <button 
                                    onClick={() => handleRejectRequest(request)}
                                    className="btn-reject"
                                >
                                    Reject Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {request.status === 'approved' && (
                    <div className="info-box approved">
                        <p>✅ This request has been approved</p>
                        {request.approvalReason && <p><strong>Reason:</strong> {request.approvalReason}</p>}
                        <p><strong>Approved At:</strong> {new Date(request.updatedAt).toLocaleString()}</p>
                    </div>
                )}

                {request.status === 'rejected' && (
                    <div className="info-box rejected">
                        <p>❌ This request has been rejected</p>
                        {request.rejectionReason && <p><strong>Reason:</strong> {request.rejectionReason}</p>}
                        <p><strong>Rejected At:</strong> {new Date(request.updatedAt).toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <AdminLayout activeTab="admin-requests">
            <div className="super-admin-requests-container">
                <div className="requests-header">
                    <h1>👑 Admin Requests</h1>
                    <p>Manage admin registration requests</p>
                </div>

                <div className="stats-cards">
                    <div className="stat-card pending">
                        <div className="stat-number">{requests.pending.length}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card approved">
                        <div className="stat-number">{requests.approved.length}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card rejected">
                        <div className="stat-number">{requests.rejected.length}</div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>

                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        📋 Pending ({requests.pending.length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approved')}
                    >
                        ✅ Approved ({requests.approved.length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rejected')}
                    >
                        ❌ Rejected ({requests.rejected.length})
                    </button>
                </div>

                <div className="requests-list">
                    {requests[activeTab].length > 0 ? (
                        requests[activeTab].map(request => (
                            <div 
                                key={request._id}
                                className={`request-card status-${request.status}`}
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="request-card-header">
                                    <h3>{request.name}</h3>
                                    <span className={`status-badge status-${request.status}`}>
                                        {request.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="request-card-body">
                                    <p><strong>Email:</strong> {request.email}</p>
                                    <p><strong>Role:</strong> {request.role}</p>
                                    <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="request-card-footer">
                                    <button className="view-btn">View Details →</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No {activeTab} requests</p>
                        </div>
                    )}
                </div>

                {selectedRequest && (
                    <RequestDetailView request={selectedRequest} type={activeTab} />
                )}
            </div>
        </AdminLayout>
    )
}

export default SuperAdminRequests
