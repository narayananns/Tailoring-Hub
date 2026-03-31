import React, { useState, useEffect } from 'react';
import './SuperAdminRequests.css';
import axios from 'axios';

function SuperAdminRequests() {
    const [requests, setRequests] = useState({
        pending: [],
        approved: [],
        rejected: []
    });
    const [counts, setCounts] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAdminRequests();
    }, []);

    const fetchAdminRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                setError('No authentication token. Please login.');
                setLoading(false);
                return;
            }

            const response = await axios.get(
                'http://localhost:5000/api/auth/admin/requests',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRequests(response.data.requests);
            setCounts(response.data.counts);
            setError(null);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError(err.response?.data?.message || 'Error loading requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            
            await axios.post(
                `http://localhost:5000/api/admin-management/approve-request/${requestId}`,
                { notes: 'Approved by super-admin' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh requests
            await fetchAdminRequests();
            setSelectedRequest(null);
            alert('✅ Admin request approved successfully!');
        } catch (err) {
            console.error('Error approving request:', err);
            alert('❌ Error approving request: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (requestId, reason) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            
            await axios.post(
                `http://localhost:5000/api/admin-management/reject-request/${requestId}`,
                { rejectionReason: reason || 'Rejected by super-admin' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh requests
            await fetchAdminRequests();
            setSelectedRequest(null);
            alert('✅ Admin request rejected successfully!');
        } catch (err) {
            console.error('Error rejecting request:', err);
            alert('❌ Error rejecting request: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const getRequestsList = () => {
        const list = requests[activeTab] || [];
        return Array.isArray(list) ? list : [];
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="super-admin-requests-container loading">
                <div className="spinner"></div>
                <p>Loading admin requests...</p>
            </div>
        );
    }

    const requestsList = getRequestsList();

    return (
        <div className="super-admin-requests-container">
            {/* Header */}
            <div className="requests-header">
                <h1>👑 Admin Requests Management</h1>
                <p className="subtitle">Review and manage new admin access requests</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className={`stat-card pending ${activeTab === 'pending' ? 'active' : ''}`}
                     onClick={() => setActiveTab('pending')}>
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <div className="stat-number">{counts.pending}</div>
                        <div className="stat-label">Pending Requests</div>
                    </div>
                </div>

                <div className={`stat-card approved ${activeTab === 'approved' ? 'active' : ''}`}
                     onClick={() => setActiveTab('approved')}>
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-number">{counts.approved}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                </div>

                <div className={`stat-card rejected ${activeTab === 'rejected' ? 'active' : ''}`}
                     onClick={() => setActiveTab('rejected')}>
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <div className="stat-number">{counts.rejected}</div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>

                <div className="stat-card total">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-number">{counts.total}</div>
                        <div className="stat-label">Total Requests</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="requests-tabs">
                <button 
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    ⏳ Pending ({counts.pending})
                </button>
                <button 
                    className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    ✅ Approved ({counts.approved})
                </button>
                <button 
                    className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    ❌ Rejected ({counts.rejected})
                </button>
            </div>

            {/* Requests List or Detail View */}
            {selectedRequest ? (
                <RequestDetailView 
                    request={selectedRequest}
                    onBack={() => setSelectedRequest(null)}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                    actionLoading={actionLoading}
                    tab={activeTab}
                />
            ) : (
                <div className="requests-list">
                    {requestsList.length > 0 ? (
                        requestsList.map((request) => (
                            <div 
                                key={request._id} 
                                className="request-card"
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="request-header">
                                    <h3>{request.name}</h3>
                                    <span className={`status-badge ${request.status}`}>
                                        {request.status === 'pending' && '⏳ Pending'}
                                        {request.status === 'approved' && '✅ Approved'}
                                        {request.status === 'rejected' && '❌ Rejected'}
                                    </span>
                                </div>
                                <div className="request-details">
                                    <p><strong>📧 Email:</strong> {request.email}</p>
                                    <p><strong>🏢 Department:</strong> {request.department || 'Not specified'}</p>
                                    <p><strong>📝 Reason:</strong> {request.reason || 'Not provided'}</p>
                                    {request.requestedAt && (
                                        <p><strong>📅 Requested:</strong> {formatDate(request.requestedAt)}</p>
                                    )}
                                </div>
                                <div className="request-footer">
                                    <span className="click-hint">Click to view details →</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-requests">
                            <p>No {activeTab} requests</p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>❌ {error}</p>
                </div>
            )}
        </div>
    );
}

// Detail View Component
function RequestDetailView({ request, onBack, onApprove, onReject, actionLoading, tab }) {
    const [rejectReason, setRejectReason] = useState('');

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="request-detail-view">
            <div className="detail-header">
                <button className="btn-back" onClick={onBack}>← Back to List</button>
                <h2>{request.name}</h2>
                <span className={`status-badge ${request.status}`}>
                    {request.status === 'pending' && '⏳ Pending'}
                    {request.status === 'approved' && '✅ Approved'}
                    {request.status === 'rejected' && '❌ Rejected'}
                </span>
            </div>

            <div className="detail-grid">
                {/* Left Column */}
                <div className="detail-column">
                    <div className="detail-section">
                        <h3>📋 Request Information</h3>
                        <div className="detail-field">
                            <label>Name:</label>
                            <p>{request.name}</p>
                        </div>
                        <div className="detail-field">
                            <label>Email:</label>
                            <p>{request.email}</p>
                        </div>
                        <div className="detail-field">
                            <label>Department:</label>
                            <p>{request.department || 'Not specified'}</p>
                        </div>
                        <div className="detail-field">
                            <label>Role Requested:</label>
                            <p>{request.role || 'admin'}</p>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>📝 Reason for Request</h3>
                        <p className="reason-text">{request.reason || 'No reason provided'}</p>
                    </div>
                </div>

                {/* Right Column */}
                <div className="detail-column">
                    <div className="detail-section">
                        <h3>⏰ Timeline</h3>
                        <div className="timeline">
                            {request.requestedAt && (
                                <div className="timeline-item">
                                    <span className="timeline-icon">📤</span>
                                    <div className="timeline-content">
                                        <strong>Requested:</strong>
                                        <p>{formatDate(request.requestedAt)}</p>
                                    </div>
                                </div>
                            )}
                            {request.approvedAt && (
                                <div className="timeline-item approved">
                                    <span className="timeline-icon">✅</span>
                                    <div className="timeline-content">
                                        <strong>Approved:</strong>
                                        <p>{formatDate(request.approvedAt)}</p>
                                        <p className="by-text">By: {request.approvedBy?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                            )}
                            {request.rejectedAt && (
                                <div className="timeline-item rejected">
                                    <span className="timeline-icon">❌</span>
                                    <div className="timeline-content">
                                        <strong>Rejected:</strong>
                                        <p>{formatDate(request.rejectedAt)}</p>
                                        {request.rejectionReason && (
                                            <p className="reason-text">Reason: {request.rejectionReason}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Permissions Preview */}
                    {request.permissions && request.permissions.length > 0 && (
                        <div className="detail-section">
                            <h3>🔑 Permissions</h3>
                            <div className="permissions-preview">
                                {request.permissions.map((perm, idx) => (
                                    <div key={idx} className="perm-item">✓ {perm}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {tab === 'pending' && request.status === 'pending' && (
                <div className="action-section">
                    <div className="approve-section">
                        <h3>✅ Approve Request</h3>
                        <p>This admin will be able to access the dashboard immediately after approval.</p>
                        <button 
                            className="btn btn-approve"
                            onClick={() => {
                                if (window.confirm(`Approve admin access for ${request.name}?`)) {
                                    onApprove(request._id);
                                }
                            }}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Processing...' : '✅ Approve Admin'}
                        </button>
                    </div>

                    <div className="reject-section">
                        <h3>❌ Reject Request</h3>
                        <p>Provide a reason for rejecting (optional):</p>
                        <textarea 
                            className="reject-reason"
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button 
                            className="btn btn-reject"
                            onClick={() => {
                                if (window.confirm(`Reject admin request for ${request.name}?`)) {
                                    onReject(request._id, rejectReason);
                                }
                            }}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Processing...' : '❌ Reject Request'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuperAdminRequests;
