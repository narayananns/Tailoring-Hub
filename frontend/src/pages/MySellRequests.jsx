import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import './MySellRequests.css'

function MySellRequests() {
    const [user, setUser] = useState(null)
    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedIds, setExpandedIds] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')

        if (!storedUser || !token) {
            navigate('/customer/login')
            return
        }

        setUser(JSON.parse(storedUser))
        fetchRequests(token)
    }, [navigate])

    const fetchRequests = async (token) => {
        try {
            const response = await fetch('/api/sell-requests/my-requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                setRequests(data || [])
            } else {
                setError(data.message || 'Failed to fetch sell requests')
            }
        } catch (err) {
            setError('Failed to connect to server')
            console.error('Fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleExpand = (id) => {
        setExpandedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to withdraw this sell request? This action cannot be undone.")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/sell-requests/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Sell request withdrawn successfully');
                setRequests(prev => prev.filter(req => req._id !== id));
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete request');
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to connect to server');
        }
    };

    if (isLoading) return (
        <div className="my-sell-page">
            <div className="container">
                <div className="page-header">
                    <h1><Skeleton width={300} baseColor="#202020" highlightColor="#444" /></h1>
                    <Skeleton width={180} height={40} baseColor="#202020" highlightColor="#444" />
                </div>
                <div className="requests-grid">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="request-card">
                            <div className="request-header" style={{ display: 'block' }}>
                                <Skeleton width="60%" height={24} baseColor="#202020" highlightColor="#444" />
                                <Skeleton width="40%" height={16} baseColor="#202020" highlightColor="#444" style={{ marginTop: '0.5rem' }} />
                            </div>
                            <div className="request-body">
                                <Skeleton count={3} height={20} style={{ marginBottom: '1rem' }} baseColor="#202020" highlightColor="#444" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    if (error) return (
        <div className="my-sell-page">
            <div className="error-message">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-secondary">Retry</button>
            </div>
        </div>
    )

    return (
        <div className="my-sell-page">
            <div className="container">
                <div className="page-header">
                    <h1>My Sell Requests</h1>
                    <Link to="/sell" className="btn btn-primary">Submit New Request</Link>
                </div>

                {requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No Sell Requests Found</h3>
                        <p>You haven't submitted any requests to sell machines yet.</p>
                        <Link to="/sell" className="btn btn-primary mt-4">Start Selling</Link>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {requests.map(req => (
                            <div key={req._id} className="request-card">
                                <div className="request-header">
                                    <div className="machine-info">
                                        <h3>{req.brand} {req.model}</h3>
                                        <span className="machine-type">{req.machineType}</span>
                                    </div>
                                    <span className={`status-badge ${req.status ? req.status.toLowerCase() : 'pending'}`}>
                                        {req.status || 'Pending'}
                                    </span>
                                </div>
                                
                                <div className="request-body">
                                    <div className="info-row">
                                        <span className="label">Expected Price:</span>
                                        <span className="value">₹{req.expectedPrice}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Date Submitted:</span>
                                        <span className="value">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Condition:</span>
                                        <span className="value">{req.condition}</span>
                                    </div>

                                    {/* Rejection Reason Display */}
                                    {req.status === 'Rejected' && req.rejectionReason && (
                                        <div className="rejection-reason" style={{ 
                                            marginTop: '1rem', 
                                            padding: '0.75rem', 
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                            border: '1px solid rgba(239, 68, 68, 0.3)', 
                                            borderRadius: '4px' 
                                        }}>
                                            <p style={{ color: '#f87171', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                                                <span style={{ marginRight: '0.5rem' }}>⚠️</span>
                                                <strong>Reason for Rejection:</strong> {req.rejectionReason}
                                            </p>
                                        </div>
                                    )}

                                    {/* Collapsible Details */}
                                    {expandedIds.includes(req._id) && (
                                        <div className="expanded-details">
                                            <div className="detail-block">
                                                <h4>Description</h4>
                                                <p>{req.description}</p>
                                            </div>
                                            
                                            {req.photos && req.photos.length > 0 && (
                                                <div className="detail-block">
                                                    <h4>Photos</h4>
                                                    <div className="photo-grid">
                                                        {req.photos.map((photo, idx) => (
                                                            <img key={idx} src={photo} alt={`Machine ${idx+1}`} className="req-photo"/>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="request-footer">
                                    <button 
                                        className="btn-text" 
                                        onClick={() => toggleExpand(req._id)}
                                    >
                                        {expandedIds.includes(req._id) ? 'Show Less' : 'View Details'}
                                    </button>
                                    
                                    {(req.status === 'Pending' || req.status === 'Rejected') && (
                                        <button 
                                            className="btn-text" 
                                            onClick={() => handleDelete(req._id)}
                                            style={{ color: '#ef4444', marginLeft: '1rem' }}
                                        >
                                            {req.status === 'Rejected' ? 'Remove' : 'Withdraw Request'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MySellRequests
