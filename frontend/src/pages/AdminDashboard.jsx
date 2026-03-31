import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import './AdminDashboard.css'
import './AdminDashboardTable.css' // Import table styles
import Skeleton from 'react-loading-skeleton'
import AdminLayout from '../components/AdminLayout'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { format, subDays, isSameDay, parseISO, startOfWeek, startOfMonth, isAfter, subHours, eachDayOfInterval } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const HighlightText = ({ text = '', highlight = '' }) => {
    if (!highlight.trim()) {
      return <span>{text}</span>
    }
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = (text || '').toString().split(regex)
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} style={{ backgroundColor: '#fde047', fontWeight: 'bold' }}>{part}</span> : part
        )}
      </span>
    )
}

const SearchBar = ({ placeholder, searchTerm, onSearchChange }) => (
    <div className="search-container">
        <span className="search-icon">🔍</span>
        <input 
            type="text" 
            className="search-input" 
            placeholder={placeholder}
            value={searchTerm}
            onChange={onSearchChange}
        />
    </div>
);

function AdminDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // --- DATE FILTER & VIEW LOGIC ---
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [serviceViewMode, setServiceViewMode] = useState('list'); // 'list' | 'board'

    // Reset search when active tab changes
    useEffect(() => {
        setSearchTerm('')
    }, [activeTab])

    // Handle initial tab from URL query params or navigation state
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tabParam = params.get('tab')
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [location.search])

    // Data states
    const [stats, setStats] = useState({
        totalMachines: 0,
        pendingSellRequests: 0,
        pendingServiceBookings: 0,
        pendingOrders: 0
    })
    const [machines, setMachines] = useState([])
    const [sellRequests, setSellRequests] = useState([])
    const [serviceBookings, setServiceBookings] = useState([])
    const [orders, setOrders] = useState([])
    const [contacts, setContacts] = useState([])

    // Machine Form State
    const [isAddMachineOpen, setIsAddMachineOpen] = useState(false)
    const [viewData, setViewData] = useState(null)
    const [expandedImage, setExpandedImage] = useState(null)
    const [editingMachine, setEditingMachine] = useState(null)
    const [machineForm, setMachineForm] = useState({
        name: '', brand: '', type: 'Domestic', price: '', originalPrice: '',
        description: '', stock: 0, status: 'Available', features: '', specifications: '{}'
    })
    const [machineImages, setMachineImages] = useState([])

    useEffect(() => {
        checkAdminAuth()
        fetchAllData()
    }, [])

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (expandedImage) {
                    setExpandedImage(null)
                    return
                }
                if (viewData) {
                    setViewData(null)
                    return
                }
                if (isAddMachineOpen) {
                    setIsAddMachineOpen(false)
                    return
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [expandedImage, viewData, isAddMachineOpen])

    const checkAdminAuth = () => {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        
        if (!token || (user.role !== 'admin' && user.role !== 'super-admin')) {
            toast.error('Access denied. Admin only.')
            navigate('/admin/login')
        }
    }

    const fetchAllData = async (skipLoading = false) => {
        if (!skipLoading) setLoading(true)
        try {
            const [machinesRes, sellRes, serviceRes, ordersRes, contactRes] = await Promise.all([
                axios.get('/api/machines'),
                axios.get('/api/sell-requests'),
                axios.get('/api/service-bookings'),
                axios.get('/api/orders'),
                axios.get('/api/contacts')
            ])

            setMachines(machinesRes.data)
            setSellRequests(sellRes.data)
            setServiceBookings(serviceRes.data)
            setOrders(ordersRes.data.orders || [])
            setContacts(contactRes.data)

            // Calculate Stats
            const allOrders = ordersRes.data.orders || [];
            const revenue = allOrders
                .filter(o => o.status === 'delivered')
                .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
            
            const lowStock = machinesRes.data.filter(m => m.stock < 3);

            setStats({
                totalMachines: machinesRes.data.length,
                pendingSellRequests: sellRes.data.filter(r => r.status === 'Pending').length,
                pendingServiceBookings: serviceRes.data.filter(b => b.status === 'Pending').length,
                pendingOrders: allOrders.filter(o => o.status === 'pending').length,
                totalContacts: contactRes.data.filter(c => c.status === 'new').length,
                totalRevenue: revenue,
                lowStockCount: lowStock.length,
                lowStockItems: lowStock,
                recentOrders: allOrders.slice(0, 5) // Assuming API returns sorted, otherwise sort here
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            if (!skipLoading) setLoading(false)
        }
    }

    // --- ANALYTICS & PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [filterStatus, setFilterStatus] = useState('All');
    
    // --- BULK ACTIONS ---
    const [selectedOrders, setSelectedOrders] = useState([]);

    // Reset pagination and filter when tab/search changes
    useEffect(() => {
        setCurrentPage(1);
        setFilterStatus('All');
        setSelectedOrders([]); // Reset selections on tab switch
    }, [activeTab]);

    const toggleOrderSelection = (orderId) => {
        if (selectedOrders.includes(orderId)) {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        } else {
            setSelectedOrders([...selectedOrders, orderId]);
        }
    };

    const toggleSelectAll = (filteredData) => {
        const visibleIds = filteredData.map(o => o._id);
        const allSelected = visibleIds.every(id => selectedOrders.includes(id));
        
        if (allSelected) {
            // Unselect visible only
            setSelectedOrders(selectedOrders.filter(id => !visibleIds.includes(id)));
        } else {
            // Select all visible
            const newSelection = [...selectedOrders];
            visibleIds.forEach(id => {
                if (!newSelection.includes(id)) newSelection.push(id);
            });
            setSelectedOrders(newSelection);
        }
    };

    const handleBulkUpdate = async (newStatus) => {
        if (selectedOrders.length === 0) return;
        if (!window.confirm(`Are you sure you want to mark ${selectedOrders.length} orders as ${newStatus}?`)) return;
        
        const toastId = toast.loading('Processing bulk update...');
        try {
            await Promise.all(selectedOrders.map(id => 
                axios.put(`/api/orders/${id}/status`, { status: newStatus }).catch(e => console.error(e))
            ));
            
            toast.success(`Updated ${selectedOrders.length} orders successfully`, { id: toastId });
            setSelectedOrders([]);
            fetchAllData(true);
        } catch (error) {
            toast.error('Bulk update failed', { id: toastId });
        }
    };

    // Reset pagination when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const orderStatusData = useMemo(() => {
        const statuses = orders.reduce((acc, order) => {
            const status = order.status || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(statuses).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: statuses[key]
        }));
    }, [orders]);

    const revenueData = useMemo(() => {
        const data = [];
        const today = new Date();
        
        let interval = { start: subDays(today, 6), end: today }; // Default last 7 days

        if (dateFilter === 'today') {
            // Provide hourly data points for today if needed, or just one point
            interval = { start: subHours(today, 23), end: today }; 
        } else if (dateFilter === 'thisWeek') {
            interval = { start: subDays(today, 6), end: today };
        } else if (dateFilter === 'thisMonth') {
            interval = { start: subDays(today, 29), end: today };
        } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
            interval = { start: new Date(customDateRange.start), end: new Date(customDateRange.end) };
        } else if (dateFilter === 'all') {
            // For 'All Time', maybe show last 6 months or 30 days default
             interval = { start: subDays(today, 29), end: today };
        }

        try {
             // Handle case where start > end (invalid range)
            if (interval.start > interval.end) {
                 interval = { start: subDays(today, 6), end: today };
            }
            
            const days = eachDayOfInterval(interval);
            days.forEach(day => {
                const dateStr = format(day, 'MMM dd');
                const dayRevenue = orders
                    .filter(o => o.status === 'delivered' && isSameDay(new Date(o.createdAt), day))
                    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
                data.push({ name: dateStr, revenue: dayRevenue });
            });
        } catch (e) {
            console.error("Date interval error", e);
        }
        
        return data;
    }, [orders, dateFilter, customDateRange]);

    const recentActivity = useMemo(() => {
        const all = [
            ...orders.map(o => ({ 
                id: o._id, type: 'Order', 
                desc: `New order from ${o.shippingDetails?.name || 'Guest'}`, 
                date: new Date(o.createdAt), 
                amount: o.totalAmount,
                status: o.status 
            })),
            ...sellRequests.map(s => ({ 
                id: s._id, type: 'Sell Request', 
                desc: `Request to sell ${s.brand || 'Machine'}`, 
                date: new Date(s.createdAt),
                status: s.status 
            })),
            ...serviceBookings.map(s => ({ 
                id: s._id, type: 'Service', 
                desc: `Service booked for ${s.brand || 'Machine'}`, 
                date: new Date(s.createdAt),
                status: s.status 
            })),
             ...contacts.map(c => ({ 
                id: c._id, type: 'Message', 
                desc: `New message from ${c.name}`, 
                date: new Date(c.createdAt || Date.now()),
                status: c.status 
            }))
        ];
        return all.sort((a, b) => b.date - a.date).slice(0, 8);
    }, [orders, sellRequests, serviceBookings, contacts]);

    const downloadOrdersCSV = () => {
        const headers = ['Order ID,Customer Name,Date,Amount,Status'];
        const rows = orders.map(o => {
            const date = new Date(o.createdAt).toLocaleDateString();
            const customer = (o.shippingDetails?.name || 'Guest').replace(/,/g, ''); // Escape commas
            return `${o.orderId || o._id},${customer},${date},${o.totalAmount},${o.status}`;
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadSellRequestsCSV = () => {
        const headers = ['Request ID,User Name,Phone,Email,Machine,Model,Year,Condition,Expected Price,Status,Date'];
        const rows = sellRequests.map(req => {
            const date = new Date(req.createdAt).toLocaleDateString();
            const name = (req.name || 'Guest').replace(/,/g, '');
            const machine = (req.brand || '').replace(/,/g, '');
            const model = (req.model || '').replace(/,/g, '');
            const condition = (req.condition || '').replace(/,/g, '');
            return `${req._id},${name},${req.phone},${req.email},${machine},${model},${req.yearOfPurchase},${condition},${req.expectedPrice},${req.status},${date}`;
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sell_requests_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadServiceBookingsCSV = () => {
        const headers = ['Booking ID,Customer Name,Phone,Email,Machine Brand,Issue Description,Preferred Date,Address,Status,Created At'];
        const rows = serviceBookings.map(s => {
            const date = new Date(s.createdAt).toLocaleDateString();
            const preferredDate = new Date(s.preferredDate).toLocaleDateString();
            const name = (s.name || 'Guest').replace(/,/g, '');
            const brand = (s.brand || '').replace(/,/g, '');
            const issue = (s.issue || '').replace(/,/g, ' ');
            const address = (s.address || '').replace(/,/g, ' ');
            return `${s._id},${name},${s.phone},${s.email},${brand},${issue},${preferredDate},${address},${s.status},${date}`;
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `service_bookings_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- MACHINE HANDLERS ---
    const handleMachineSubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData()
        Object.keys(machineForm).forEach(key => formData.append(key, machineForm[key]))
        
        Array.from(machineImages).forEach(file => {
            formData.append('images', file)
        })

        try {
            if (editingMachine) {
                await axios.put(`/api/machines/${editingMachine._id}`, formData)
                toast.success('Machine updated successfully')
            } else {
                await axios.post('/api/machines', formData)
                toast.success('Machine added successfully')
            }
            setIsAddMachineOpen(false)
            setEditingMachine(null)
            setMachineForm({
                name: '', brand: '', type: 'Domestic', price: '', originalPrice: '',
                description: '', stock: 0, status: 'Available', features: '', specifications: '{}'
            })
            setMachineImages([])
            fetchAllData()
        } catch (error) {
            toast.error('Failed to save machine')
        }
    }

    const deleteMachine = async (id) => {
        if (!window.confirm('Are you sure you want to delete this machine?')) return;
        try {
            await axios.delete(`/api/machines/${id}`)
            toast.success('Machine deleted')
            fetchAllData()
        } catch (error) {
            toast.error('Failed to delete machine')
        }
    }

    // --- STATUS UPDATES ---
    const updateSellStatus = async (id, status) => {
        let rejectionReason = '';

        if (status === 'Rejected') {
            rejectionReason = window.prompt("Enter the reason for rejection (optional):");
            if (rejectionReason === null) {
                // User cancelled the prompt, so cancel the status update
                return;
            }
        }

        try {
            await axios.put(`/api/sell-requests/${id}/status`, { status, rejectionReason })
            toast.success(`Request ${status}`)
            fetchAllData(true)
        } catch (error) {
            toast.error('Update failed')
            console.error(error);
        }
    }

    const updateServiceStatus = async (id, status) => {
        try {
            await axios.put(`/api/service-bookings/${id}/status`, { status })
            toast.success(`Booking ${status}`)
            fetchAllData(true)
        } catch (error) {
            toast.error('Update failed')
        }
    }

    const deleteContact = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await axios.delete(`/api/contacts/${id}`)
            toast.success('Message deleted')
            fetchAllData()
        } catch (error) {
            toast.error('Failed to delete message')
        }
    }

    const updateContactStatus = async (id, status) => {
        try {
            await axios.put(`/api/contacts/${id}`, { status })
            toast.success('Message status updated')
            fetchAllData(true)
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    // --- ORDER HANDLERS ---
    const updateOrderStatus = async (id, status) => {
        let cancellationReason = '';
        if (status === 'cancelled') {
             cancellationReason = window.prompt("Reason for cancellation (Optional):");
             if (cancellationReason === null) return; // Cancel update
        }

        try {
            await axios.put(`/api/orders/${id}/status`, { status, cancellationReason })
            toast.success('Order status updated')
            fetchAllData(true)
        } catch (error) {
            toast.error('Failed to update order')
        }
    }

    // --- DATE FILTER & VIEW LOGIC ---

    const isWithinDateRange = (dateString, filter = dateFilter) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        
        switch (filter) {
            case 'today':
                return isSameDay(date, today);
            case 'thisWeek':
                return isAfter(date, subDays(today, 7));
            case 'thisMonth':
                return isAfter(date, subDays(today, 30));
            case 'custom':
                if (customDateRange.start && customDateRange.end) {
                    const start = new Date(customDateRange.start);
                    const end = new Date(customDateRange.end);
                    end.setHours(23, 59, 59);
                    return date >= start && date <= end;
                }
                return true;
            default:
                return true;
        }
    };

    const DateFilterControl = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="thisWeek">Last 7 Days</option>
                <option value="thisMonth">Last 30 Days</option>
                <option value="custom">Custom Range</option>
            </select>
            {dateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="date" 
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ alignSelf: 'center' }}>-</span>
                    <input 
                        type="date" 
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                </div>
            )}
        </div>
    );

    // --- CUSTOMER INSIGHTS ---
    const customerInsights = useMemo(() => {
        const uniqueCustomers = {};
        orders.forEach(order => {
            // Use email as unique identifier, fallback to name+phone combo if needed
            const id = order.shippingDetails?.email || (order.shippingDetails?.phone ? `${order.shippingDetails.name}-${order.shippingDetails.phone}` : 'Unknown');
            
            if (!uniqueCustomers[id]) {
                uniqueCustomers[id] = {
                    id: id,
                    name: order.shippingDetails?.name || 'Guest',
                    email: order.shippingDetails?.email || 'N/A',
                    phone: order.shippingDetails?.phone || 'N/A',
                    totalSpent: 0,
                    orderCount: 0,
                    lastOrderDate: order.createdAt
                };
            }
            
            uniqueCustomers[id].totalSpent += (order.totalAmount || 0);
            uniqueCustomers[id].orderCount += 1;
            
            if (new Date(order.createdAt) > new Date(uniqueCustomers[id].lastOrderDate)) {
                uniqueCustomers[id].lastOrderDate = order.createdAt;
            }
        });
        
        return Object.values(uniqueCustomers).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [orders]);

    if (loading) {
        return (
            <AdminLayout activeTab={activeTab} stats={{}}>
                <div className="admin-dashboard-container">
                    {activeTab === 'overview' ? (
                        <div className="overview-tab">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <Skeleton width={200} height={32} />
                                <Skeleton width={150} height={32} />
                            </div>
                            <div className="stats-grid">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="stat-card" style={{ height: '120px', display: 'block' }}>
                                        <Skeleton count={2} height={20} style={{ marginBottom: '10px' }} />
                                        <Skeleton height={40} width="60%" />
                                    </div>
                                ))}
                            </div>
                            <div className="charts-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                                <div style={{ height: '400px', backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem' }}>
                                    <Skeleton height={30} width={200} style={{ marginBottom: '1rem' }} />
                                    <Skeleton height={300} />
                                </div>
                                <div style={{ height: '400px', backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem' }}>
                                    <Skeleton height={30} width={200} style={{ marginBottom: '1rem' }} />
                                    <Skeleton circle height={200} width={200} style={{ margin: '0 auto', display: 'block' }} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <Skeleton width={200} height={32} />
                                <Skeleton width={300} height={32} />
                            </div>
                            <div className="table-wrapper" style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <th key={i} style={{ padding: '10px' }}><Skeleton height={20} /></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
                                            <tr key={row}>
                                                {[1, 2, 3, 4, 5].map(col => (
                                                    <td key={col} style={{ padding: '10px' }}><Skeleton height={20} /></td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        )
    }

    // Apply filters
    const filteredMachines = machines.filter(m => {
        const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
        const matchesSearch = 
            (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.status || '').toLowerCase().includes(searchTerm.toLowerCase());
        // Machines don't typically have a date filter (they are inventory), but could filter by updated/created if added
        return matchesStatus && matchesSearch;
    });

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'All' || (o.status || 'pending').toLowerCase() === filterStatus.toLowerCase();
        const matchesDate = isWithinDateRange(o.createdAt);
        const matchesSearch = 
            (o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.shippingDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.shippingDetails?.phone || '').includes(searchTerm) ||
            (o.status || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch && matchesDate;
    });

    const filteredSellRequests = sellRequests.filter(r => {
        const matchesStatus = filterStatus === 'All' || (r.status || 'Pending') === filterStatus;
        const matchesDate = isWithinDateRange(r.createdAt);
        const matchesSearch = 
            (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.phone || '').includes(searchTerm) ||
            (r.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.status || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch && matchesDate;
    });

    const filteredServiceBookings = serviceBookings.filter(b => {
        const matchesStatus = filterStatus === 'All' || (b.status || 'Pending') === filterStatus;
        const matchesDate = isWithinDateRange(b.createdAt || b.preferredDate); // Use created or preferred date
        const matchesSearch = 
            (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.phone || '').includes(searchTerm) ||
            (b.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.issue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.status || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch && matchesDate;
    });
    
    const filteredContacts = contacts.filter(c => {
        const matchesStatus = filterStatus === 'All' || (c.status || 'new') === filterStatus;
        const matchesDate = isWithinDateRange(c.createdAt);
        const matchesSearch = 
            (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.message || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch && matchesDate;
    });

    return (
        <AdminLayout activeTab={activeTab} stats={stats}>
            <div className="admin-dashboard-container">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ margin: 0 }}>System Overview</h2>
                            {DateFilterControl()}
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>💰</div>
                                <div className="stat-info">
                                    <h3 style={{ color: 'white' }}>{dateFilter === 'all' ? 'Total Revenue' : 'Period Revenue'}</h3>
                                    <p style={{ color: 'white' }}>₹{
                                        orders
                                        .filter(o => o.status === 'delivered' && isWithinDateRange(o.createdAt))
                                        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
                                        .toLocaleString()
                                    }</p>
                                </div>
                            </div>
                            
                            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <div className="stat-icon" style={{ color: '#ef4444', background: '#fee2e2' }}>⚠️</div>
                                <div className="stat-info">
                                    <h3>Low Stock</h3>
                                    <p style={{ color: '#ef4444' }}>{stats.lowStockCount || 0}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">🔧</div>
                                <div className="stat-info">
                                    <h3>Total Machines</h3>
                                    <p>{stats.totalMachines}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📥</div>
                                <div className="stat-info">
                                    <h3>Pending Sell Req.</h3>
                                    <p>{stats.pendingSellRequests}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-info">
                                    <h3>Pending Orders</h3>
                                    <p>{stats.pendingOrders}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">�🛠️</div>
                                <div className="stat-info">
                                    <h3>Pending Services</h3>
                                    <p>{stats.pendingServiceBookings}</p>
                                </div>
                            </div>
                             <div className="stat-card">
                                <div className="stat-icon">✉️</div>
                                <div className="stat-info">
                                    <h3>New Messages</h3>
                                    <p>{stats.totalContacts}</p>
                                </div>
                            </div>
                        </div>

                        {/* CHARTS SECTION */}
                        <div className="charts-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                            <div className="chart-container" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: 0 }}>
                                <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                                    Revenue Trend ({dateFilter === 'all' ? 'Last 30 Days' : dateFilter === 'thisWeek' ? 'Last 7 Days' : dateFilter === 'today' ? 'Today' : dateFilter === 'thisMonth' ? 'Last 30 Days' : 'Selected Range'})
                                </h3>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{fill: '#64748b', fontSize: 12}} 
                                                axisLine={false} 
                                                tickLine={false} 
                                                interval={revenueData.length > 7 ? Math.floor(revenueData.length / 7) : 0}
                                            />
                                            <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={val => `₹${val}`} />
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                                formatter={(value) => [`₹${value}`, 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="chart-container" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: 0 }}>
                                <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Order Status Distribution</h3>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={orderStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {orderStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="overview-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem', paddingBottom: '2rem' }}>
                            {/* Recent Activity Panel */}
                            <div className="dashboard-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>🔔 Recent Activity</h3>
                                </div>
                                {recentActivity.length > 0 ? (
                                    <div className="activity-list">
                                        {recentActivity.map((act, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem' }}>
                                                <div style={{ 
                                                    width: '40px', height: '40px', borderRadius: '50%', 
                                                    background: act.type === 'Order' ? '#dbeafe' : act.type === 'Sell Request' ? '#fce7f3' : '#f3f4f6',
                                                    color: act.type === 'Order' ? '#1e40af' : act.type === 'Sell Request' ? '#be185d' : '#4b5563',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                                }}>
                                                    {act.type === 'Order' ? '🛒' : act.type === 'Sell Request' ? '🏷️' : act.type === 'Service' ? '🔧' : '✉️'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '500', color: '#334155', fontSize: '0.95rem' }}>{act.desc}</div>
                                                    <small style={{ color: '#94a3b8' }}>{format(act.date, 'MMM dd, HH:mm')}</small>
                                                </div>
                                                {act.amount && <div style={{ fontWeight: 'bold', color: '#059669' }}>₹{act.amount}</div>}
                                                {act.status && <span className={`status-badge ${typeof act.status === 'string' ? act.status.toLowerCase().replace(' ', '-') : ''}`} style={{ transform: 'scale(0.8)' }}>{act.status}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No recent activity.</p>}
                            </div>

                            {/* Low Stock Panel */}
                            <div className="dashboard-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1e293b' }}>⚠️ Low Stock Alerts</h3>
                                {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
                                    <div className="alert-list">
                                        {stats.lowStockItems.map(m => (
                                            <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '8px', background: '#fff1f2', border: '1px solid #fecdd3', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {m.images?.[0] ? 
                                                        <img src={m.images[0]} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /> :
                                                        <div style={{ width: '40px', height: '40px', background: '#cbd5e1', borderRadius: '6px' }}></div>
                                                    }
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#881337' }}>{m.name}</div>
                                                        <small style={{ color: '#be123c' }}>Only {m.stock} left!</small>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigate('/admin/dashboard?tab=inventory');
                                                    }} 
                                                    style={{ 
                                                        background: 'white', 
                                                        border: '1px solid #fda4af', 
                                                        color: '#e11d48', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '500' 
                                                    }}
                                                >
                                                    Restock
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#059669', background: '#ecfdf5', borderRadius: '8px', border: '1px dashed #6ee7b7' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                                        <p style={{ margin: 0, fontWeight: '500' }}>Inventory levels are healthy!</p>
                                        <small style={{ color: '#34d399' }}>No items below 3 units stock.</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="inventory-tab">
                        <div className="tab-header">
                            <h2>Inventory Management</h2>
                            <button className="btn btn-primary" onClick={() => setIsAddMachineOpen(true)}>
                                + Add Machine
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <SearchBar 
                                placeholder="Search machines by name, brand, type..." 
                                searchTerm={searchTerm} 
                                onSearchChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                            >
                                <option value="All">All Status</option>
                                <option value="Available">Available</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                        
                        {isAddMachineOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <h3>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</h3>
                                    <form onSubmit={handleMachineSubmit} className="machine-form">
                                        <div className="form-group">
                                            <input type="text" placeholder="Machine Name" required 
                                                value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} />
                                        </div>
                                        <div className="form-row">
                                            <input type="text" placeholder="Brand" required 
                                                value={machineForm.brand} onChange={e => setMachineForm({...machineForm, brand: e.target.value})} />
                                            <select value={machineForm.type} onChange={e => setMachineForm({...machineForm, type: e.target.value})}>
                                                <option value="Industrial">Industrial</option>
                                                <option value="Domestic">Domestic</option>
                                                <option value="Embroidery">Embroidery</option>
                                                <option value="Overlock">Overlock</option>
                                            </select>
                                        </div>
                                        <div className="form-row">
                                            <input type="number" placeholder="Price" required 
                                                value={machineForm.price} onChange={e => setMachineForm({...machineForm, price: e.target.value})} />
                                            <input type="number" placeholder="Original Price" 
                                                value={machineForm.originalPrice} onChange={e => setMachineForm({...machineForm, originalPrice: e.target.value})} />
                                        </div>
                                        <div className="form-row">
                                            <input type="number" placeholder="Stock" required 
                                                value={machineForm.stock} onChange={e => setMachineForm({...machineForm, stock: e.target.value})} />
                                            <select value={machineForm.status} onChange={e => setMachineForm({...machineForm, status: e.target.value})}>
                                                <option value="Available">Available</option>
                                                <option value="Out of Stock">Out of Stock</option>
                                            </select>
                                        </div>
                                        <textarea placeholder="Description" rows="3" required 
                                            value={machineForm.description} onChange={e => setMachineForm({...machineForm, description: e.target.value})}></textarea>
                                        
                                        <input type="file" multiple onChange={e => setMachineImages(e.target.files)} />
                                        
                                        <div className="modal-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => setIsAddMachineOpen(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary">Save Machine</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMachines.map(machine => (
                                    <tr key={machine._id}>
                                        <td>
                                            {machine.images && machine.images[0] ? 
                                                <img src={machine.images[0]} alt={machine.name} className="table-img" /> : 
                                                '🔹'
                                            }
                                        </td>
                                        <td><HighlightText text={machine.name} highlight={searchTerm} /></td>
                                        <td>₹{machine.price}</td>
                                        <td>{machine.stock}</td>
                                        <td><span className={`status-badge ${machine.status.toLowerCase().replace(/ /g, '-')}`}>{machine.status}</span></td>
                                        <td>
                                            <button className="btn-sm btn-info" onClick={() => setViewData({ type: 'machine', data: machine })}>View Details</button>
                                        </td>
                                        <td>
                                            <button className="btn-icon" onClick={() => {
                                                setEditingMachine(machine);
                                                setMachineForm(machine);
                                                setIsAddMachineOpen(true);
                                            }}>✏️</button>
                                            <button className="btn-icon delete" onClick={() => deleteMachine(machine._id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}                
                {activeTab === 'orders' && (
                    <div className="orders-tab">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Orders</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {selectedOrders.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginRight: '1rem', background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 'bold' }}>{selectedOrders.length} Selected</span>
                                        <select 
                                            onChange={(e) => {
                                                if(e.target.value) handleBulkUpdate(e.target.value);
                                                e.target.value = '';
                                            }}
                                            style={{ fontSize: '0.85rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid #93c5fd' }}
                                        >
                                            <option value="">Bulk Actions...</option>
                                            <option value="confirmed">Mark Confirmed</option>
                                            <option value="shipped">Mark Shipped</option>
                                            <option value="delivered">Mark Delivered</option>
                                            <option value="cancelled">Cancel Orders</option>
                                        </select>
                                    </div>
                                )}
                                <button onClick={downloadOrdersCSV} className="btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                    📥 Export CSV
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <SearchBar 
                                placeholder="Search by Order ID, name or phone..." 
                                searchTerm={searchTerm} 
                                onSearchChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                            >
                                <option value="All">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {DateFilterControl()}
                        </div>
                        <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input 
                                            type="checkbox" 
                                            onChange={() => toggleSelectAll(filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))}
                                            checked={
                                                filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length > 0 &&
                                                filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(o => selectedOrders.includes(o._id))
                                            }
                                        />
                                    </th>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(order => {
                                    return (
                                        <tr key={order._id} style={selectedOrders.includes(order._id) ? { background: '#f0f9ff' } : {}}>
                                            <td>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedOrders.includes(order._id)} 
                                                    onChange={() => toggleOrderSelection(order._id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td><HighlightText text={order.orderId} highlight={searchTerm} /></td>
                                            <td>
                                                <strong><HighlightText text={order.shippingDetails?.name} highlight={searchTerm} /></strong><br/>
                                                <small><HighlightText text={order.shippingDetails?.phone} highlight={searchTerm} /></small>
                                            </td>
                                            <td>
                                                {order.items.map(i => (
                                                    <div key={i._id} style={{ fontSize: '0.85rem' }}>
                                                        {i.quantity}x {i.name}
                                                    </div>
                                                ))}
                                            </td>
                                            <td>₹{order.totalAmount}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${order.status}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-sm btn-info" onClick={() => setViewData({ type: 'order', data: order })}>View Details</button>
                                            </td>
                                            <td>
                                                <select 
                                                    value={order.status} 
                                                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                        
                        {/* Pagination */}
                        {filteredOrders.length > itemsPerPage && (
                            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ 
                                        padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', 
                                        background: currentPage === 1 ? '#f8fafc' : 'white', 
                                        color: currentPage === 1 ? '#94a3b8' : '#334155',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                                    Page {currentPage} of {Math.ceil(filteredOrders.length / itemsPerPage)}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), p + 1))}
                                    disabled={currentPage >= Math.ceil(filteredOrders.length / itemsPerPage)}
                                    style={{ 
                                        padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', 
                                        background: currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) ? '#f8fafc' : 'white',
                                        color: currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) ? '#94a3b8' : '#334155',
                                        cursor: currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) ? 'not-allowed' : 'pointer' 
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {/* SELL REQUESTS TAB */}
                {activeTab === 'sell-requests' && (
                    <div className="sell-requests-tab">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Sell Requests</h2>
                            <button onClick={downloadSellRequestsCSV} className="btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                📥 Export CSV
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <SearchBar 
                                placeholder="Search by name, phone, model or status..." 
                                searchTerm={searchTerm} 
                                onSearchChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Completed">Completed</option>
                            </select>
                            {DateFilterControl()}
                        </div>
                        <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Machine</th>
                                    <th>Expected Price</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSellRequests.map(req => (
                                    <tr key={req._id}>
                                        <td>
                                            <div><HighlightText text={req.name} highlight={searchTerm} /></div>
                                            <small><HighlightText text={req.phone} highlight={searchTerm} /></small>
                                        </td>
                                        <td>
                                            <div><HighlightText text={req.brand} highlight={searchTerm} /> <HighlightText text={req.model} highlight={searchTerm} /></div>
                                            <small>{req.condition}</small>
                                        </td>
                                        <td>₹{req.expectedPrice}</td>
                                        <td><span className={`status-badge ${req.status ? req.status.toLowerCase() : 'pending'}`}>{req.status || 'Pending'}</span></td>
                                        <td>
                                            <button className="btn-sm btn-info" onClick={() => setViewData({ type: 'sell', data: req })}>View Details</button>
                                        </td>
                                        <td>
                                            <select 
                                                value={req.status || 'Pending'} 
                                                onChange={(e) => updateSellStatus(req._id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}

                {/* SERVICE BOOKINGS TAB */}
                {activeTab === 'service-bookings' && (
                    <div className="service-tab">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Service Bookings</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={downloadServiceBookingsCSV} className="btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                    📥 Export CSV
                                </button>
                                <button 
                                    className={`btn ${serviceViewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setServiceViewMode('list')}
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    List View
                                </button>
                                <button 
                                    className={`btn ${serviceViewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setServiceViewMode('board')}
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    Kanban Board
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <SearchBar 
                                placeholder="Search by name, phone or status..." 
                                searchTerm={searchTerm} 
                                onSearchChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            {DateFilterControl()}
                        </div>
                        
                        {serviceViewMode === 'list' ? (
                        <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Machine</th>
                                    <th>Issue</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServiceBookings.map(booking => (
                                    <tr key={booking._id}>
                                        <td>
                                            <div><HighlightText text={booking.name} highlight={searchTerm} /></div>
                                            <small><HighlightText text={booking.phone} highlight={searchTerm} /></small>
                                        </td>
                                        <td><HighlightText text={booking.brand} highlight={searchTerm} /></td>
                                        <td><HighlightText text={booking.issue} highlight={searchTerm} /></td>
                                        <td>{new Date(booking.preferredDate).toLocaleDateString()}</td>
                                        <td><span className={`status-badge ${booking.status ? booking.status.toLowerCase().replace(' ', '-') : 'pending'}`}>{booking.status || 'Pending'}</span></td>
                                        <td>
                                            <button className="btn-sm btn-info" onClick={() => setViewData({ type: 'service', data: booking })}>View Details</button>
                                        </td>
                                        <td>
                                            <select 
                                                value={booking.status || 'Pending'} 
                                                onChange={(e) => updateServiceStatus(booking._id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                        ) : (
                            <div className="kanban-board" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                {['Pending', 'Confirmed', 'In Progress', 'Completed'].map(status => (
                                    <div key={status} style={{ minWidth: '300px', flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                                            {status}
                                            <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                                                {filteredServiceBookings.filter(b => (b.status || 'Pending') === status).length}
                                            </span>
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {filteredServiceBookings.filter(b => (b.status || 'Pending') === status).map(booking => (
                                                <div key={booking._id} style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{booking.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>{booking.brand} - {booking.issue}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📅 {new Date(booking.preferredDate).toLocaleDateString()}</div>
                                                    <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <button className="btn-sm btn-info" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setViewData({ type: 'service', data: booking })}>Details</button>
                                                        <select 
                                                            value={booking.status || 'Pending'} 
                                                            onChange={(e) => updateServiceStatus(booking._id, e.target.value)}
                                                            style={{ fontSize: '0.8rem', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', maxWidth: '100px' }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Confirmed">Confirm</option>
                                                            <option value="In Progress">In Prog.</option>
                                                            <option value="Completed">Done</option>
                                                            <option value="Cancelled">Cancel</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredServiceBookings.filter(b => (b.status || 'Pending') === status).length === 0 && (
                                                <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '1rem', fontStyle: 'italic', fontSize: '0.9rem' }}>No bookings</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* CONTACTS TAB */}
                {activeTab === 'contacts' && (
                    <div className="contacts-tab">
                        <h2>Messages</h2>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <SearchBar 
                                placeholder="Search by name, email or message..." 
                                searchTerm={searchTerm} 
                                onSearchChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                            >
                                <option value="All">All Status</option>
                                <option value="new">New</option>
                                <option value="read">Read</option>
                            </select>
                        </div>
                        <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Subject</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map(contact => (
                                    <tr key={contact._id}>
                                        <td>
                                            <div><HighlightText text={contact.name} highlight={searchTerm} /></div>
                                            <small><HighlightText text={contact.email} highlight={searchTerm} /></small> <br/>
                                            <small><HighlightText text={contact.phone} highlight={searchTerm} /></small>
                                        </td>
                                        <td><HighlightText text={contact.subject} highlight={searchTerm} /></td>
                                        <td>
                                            <div className="message-content">
                                                <HighlightText text={(contact.message || '').substring(0, 50)} highlight={searchTerm} />
                                                {(contact.message || '').length > 50 ? '...' : ''}
                                            </div>
                                        </td>
                                        <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <select 
                                                value={contact.status || 'new'} 
                                                onChange={(e) => updateContactStatus(contact._id, e.target.value)}
                                                className="status-select"
                                                style={{
                                                    padding: '0.3rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #cbd5e1',
                                                    backgroundColor: contact.status === 'read' ? '#f1f5f9' : '#fffbeb',
                                                    color: contact.status === 'read' ? '#64748b' : '#b45309',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                <option value="new">New</option>
                                                <option value="read">Read</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button className="btn-sm btn-info" onClick={() => {
                                                if (contact.status === 'new') updateContactStatus(contact._id, 'read');
                                                setViewData({ type: 'contact', data: contact });
                                            }}>View Details</button>
                                        </td>
                                        <td>
                                            <button className="btn-sm btn-danger" onClick={() => deleteContact(contact._id)}>Delete</button>
                                        </td>
                        </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}

                {/* CUSTOMERS TAB */}
                {activeTab === 'customers' && (
                    <div className="customers-tab">
                        <h2>Customer Insights</h2>
                        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '2rem' }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Customers</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{customerInsights.length}</div>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Top Spender</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                                    {customerInsights.length > 0 ? customerInsights[0].name : '-'}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Avg. Order Value</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    ₹{customerInsights.length > 0 ? Math.round(customerInsights.reduce((a,c) => a + c.totalSpent, 0) / customerInsights.reduce((a,c) => a + c.orderCount, 0)).toLocaleString() : 0}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                             <SearchBar 
                                placeholder="Search customers by name, email or phone..." 
                                searchTerm={searchTerm} 
                                onSearchChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>

                        <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Contact</th>
                                    <th>Total Spend</th>
                                    <th>Orders Placed</th>
                                    <th>Last Order Date</th>
                                    <th>Ranking</th> 
                                </tr>
                            </thead>
                            <tbody>
                                {customerInsights
                                    .filter(c => 
                                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (c.phone && c.phone.includes(searchTerm))
                                    )
                                    .map((customer, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{customer.name}</div>
                                        </td>
                                        <td>
                                            <div>{customer.email}</div>
                                            {customer.phone && <small>{customer.phone}</small>}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold', color: '#059669' }}>₹{customer.totalSpent.toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                                                {customer.orderCount} Orders
                                            </span>
                                        </td>
                                        <td>{new Date(customer.lastOrderDate).toLocaleDateString()}</td>
                                        <td>
                                            {idx < 3 ? (
                                                <span className="status-badge" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' }}>🏆 VIP</span>
                                            ) : customer.totalSpent > 10000 ? (
                                                 <span className="status-badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>Loyal</span>
                                            ) : (
                                                <span className="status-badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>Regular</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {customerInsights.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No customer data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}

                {/* VIEW DETAILS MODAL */}
                {viewData && (
                    <div className="modal-overlay" onClick={() => setViewData(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="modal-title">
                                    {viewData.type === 'machine' && 'Machine Details'}
                                    {viewData.type === 'sell' && 'Sell Request Details'}
                                    {viewData.type === 'service' && 'Service Booking Details'}
                                    {viewData.type === 'contact' && 'Message Details'}
                                </h3>
                                <button className="btn-icon" onClick={() => setViewData(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            
                            <div className="modal-body">
                                {viewData.type === 'machine' && (
                                    <div className="detail-grid">
                                        {viewData.data.images && viewData.data.images.length > 0 && (
                                            <div className="detail-images">
                                                <img src={viewData.data.images[0]} alt={viewData.data.name} style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div className="detail-info">
                                            <p><strong>Name:</strong> {viewData.data.name}</p>
                                            <p><strong>Brand:</strong> {viewData.data.brand}</p>
                                            <p><strong>Type:</strong> {viewData.data.type}</p>
                                            <p><strong>Price:</strong> ₹{viewData.data.price}</p>
                                            <p><strong>Stock:</strong> {viewData.data.stock}</p>
                                            <p><strong>Status:</strong> <span className={`status-badge ${viewData.data.status.toLowerCase().replace(/ /g, '-')}`}>{viewData.data.status}</span></p>
                                            <div className="detail-desc">
                                                <strong>Description:</strong>
                                                <p>{viewData.data.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {viewData.type === 'order' && (
                                    <div className="detail-grid">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Order #{viewData.data.orderId}</h3>
                                                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                                                    Placed on {new Date(viewData.data.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => {
                                                        const text = `Order ID: ${viewData.data.orderId || viewData.data._id}\nAmount: ₹${viewData.data.totalAmount}`;
                                                        navigator.clipboard.writeText(text);
                                                        toast.success('Order summary copied!');
                                                    }}
                                                    style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b', marginRight: '0.5rem' }}
                                                    title="Copy Summary"
                                                >
                                                    📋 Copy
                                                </button>
                                                <span className={`status-badge ${viewData.data.status ? viewData.data.status.toLowerCase() : ''}`}>{viewData.data.status}</span>
                                                <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>
                                                    Total: ₹{viewData.data.totalAmount}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Stepper */}
                                        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                                {['pending', 'confirmed', 'shipped', 'delivered'].map((step, index) => {
                                                    const currentStatus = (viewData.data.status || 'pending').toLowerCase();
                                                    const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
                                                    const currentIndex = steps.indexOf(currentStatus);
                                                    const isCompleted = index <= currentIndex;
                                                    const isCurrent = index === currentIndex;
                                                    
                                                    // Handle cancelled/completed separately if needed, but for linear flow:
                                                    if (currentStatus === 'cancelled') return null;

                                                    return (
                                                        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '25%' }}>
                                                            <div style={{ 
                                                                width: '30px', height: '30px', borderRadius: '50%', 
                                                                background: isCompleted ? '#10b981' : '#e2e8f0',
                                                                color: isCompleted ? 'white' : '#94a3b8',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem',
                                                                border: isCurrent ? '3px solid #d1fae5' : 'none'
                                                            }}>
                                                                {isCompleted ? '✓' : index + 1}
                                                            </div>
                                                            <span style={{ fontSize: '0.8rem', color: isCompleted ? '#0f172a' : '#94a3b8', fontWeight: isCompleted ? '600' : '400', textTransform: 'capitalize' }}>
                                                                {step}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {/* Progress Line */}
                                                {(viewData.data.status || '').toLowerCase() !== 'cancelled' && (
                                                    <div style={{ 
                                                        position: 'absolute', top: '15px', left: '12%', right: '12%', height: '2px', background: '#e2e8f0', zIndex: 0 
                                                    }}>
                                                        <div style={{ 
                                                            height: '100%', background: '#10b981', transition: 'width 0.3s ease',
                                                            width: `${(['pending', 'confirmed', 'shipped', 'delivered'].indexOf((viewData.data.status || 'pending').toLowerCase()) / 3) * 100}%`
                                                        }}></div>
                                                    </div>
                                                )}
                                                {(viewData.data.status || '').toLowerCase() === 'cancelled' && (
                                                    <div style={{ width: '100%', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>
                                                        🚫 Order Cancelled
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                            <div>
                                                <h5 style={{ color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Customer Details</h5>
                                                <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                                    <p style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>👤</span> <strong>{viewData.data.shippingDetails?.name}</strong>
                                                    </p>
                                                    <p style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>📧</span> 
                                                        <a href={`mailto:${viewData.data.shippingDetails?.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                                            {viewData.data.shippingDetails?.email}
                                                        </a>
                                                    </p>
                                                    <p style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>📱</span> 
                                                        <span>{viewData.data.shippingDetails?.phone}</span>
                                                        <a href={`https://wa.me/91${viewData.data.shippingDetails?.phone}`} target="_blank" rel="noreferrer" title="Chat on WhatsApp" style={{ textDecoration: 'none' }}>
                                                            <span style={{ background: '#25D366', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>WA</span>
                                                        </a>
                                                        <a href={`tel:${viewData.data.shippingDetails?.phone}`} title="Call Customer" style={{ textDecoration: 'none' }}>
                                                            <span style={{ background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Call</span>
                                                        </a>
                                                    </p>
                                                    <div style={{ margin: '0.5rem 0 0', display: 'flex', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>📍</span>
                                                        <p style={{ margin: 0 }}>
                                                            {viewData.data.shippingDetails?.address},<br/>
                                                            {viewData.data.shippingDetails?.city} - {viewData.data.shippingDetails?.pincode},<br/>
                                                            {viewData.data.shippingDetails?.state}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 style={{ color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Payment Information</h5>
                                                <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                                    <p style={{ margin: 0 }}><strong>Method:</strong> {viewData.data.paymentMethod?.toUpperCase()}</p>
                                                    <p style={{ margin: 0 }}><strong>Status:</strong> <span className={`status-badge ${viewData.data.paymentStatus || 'pending'}`} style={{ transform: 'scale(0.9)', transformOrigin: 'left center' }}>{viewData.data.paymentStatus || 'Pending'}</span></p>
                                                    <p style={{ margin: '0.5rem 0 0', wordBreak: 'break-all' }}>
                                                        <strong>Transaction ID:</strong><br/>
                                                        <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                            {viewData.data.transactionId || viewData.data.paymentId || 'N/A'}
                                                        </span>
                                                        {(viewData.data.transactionId || viewData.data.paymentId) && (
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(viewData.data.transactionId || viewData.data.paymentId);
                                                                    toast.success('Transaction ID copied');
                                                                }}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: '5px' }}
                                                                title="Copy ID"
                                                            >
                                                                📋
                                                            </button>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <h5 style={{ color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Order Items</h5>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="admin-table" style={{ marginTop: '0', minWidth: 'auto', width: '100%' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ textAlign: 'left' }}>Item</th>
                                                        <th style={{ textAlign: 'center' }}>Unit Price</th>
                                                        <th style={{ textAlign: 'center' }}>Qty</th>
                                                        <th style={{ textAlign: 'right' }}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {viewData.data.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                                <small style={{ color: '#64748b' }}>{item.brand}</small>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>₹{item.price}</td>
                                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{item.price * item.quantity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr style={{ background: '#f8fafc' }}>
                                                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '1rem' }}>Grand Total:</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>₹{viewData.data.totalAmount}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {viewData.type === 'sell' && (
                                    <div className="detail-grid">
                                        <h4>User Information</h4>
                                        <p><strong>Name:</strong> {viewData.data.name}</p>
                                        <p><strong>Email:</strong> {viewData.data.email}</p>
                                        <p style={{ display: 'flex', alignItems: 'center' }}>
                                            <strong>Phone:</strong> <span style={{ marginLeft: '5px' }}>{viewData.data.phone}</span>
                                            <a href={`https://wa.me/91${viewData.data.phone}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', marginLeft: '10px' }}>
                                                <span style={{ background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>💬 WhatsApp</span>
                                            </a>
                                            <a href={`tel:${viewData.data.phone}`} style={{ textDecoration: 'none', marginLeft: '8px' }}>
                                                <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>📞 Call</span>
                                            </a>
                                        </p>
                                        
                                        <h4 style={{ marginTop: '1rem' }}>Machine Details</h4>
                                        <p><strong>Type:</strong> {viewData.data.machineType}</p>
                                        <p><strong>Brand:</strong> {viewData.data.brand}</p>
                                        <p><strong>Model:</strong> {viewData.data.model}</p>
                                        <p><strong>Age:</strong> {viewData.data.age}</p>
                                        <p><strong>Condition:</strong> {viewData.data.condition}</p>
                                        <p><strong>Expected Price:</strong> ₹{viewData.data.expectedPrice}</p>
                                        <div className="detail-desc">
                                            <strong>Description:</strong>
                                            <p>{viewData.data.description}</p>
                                        </div>
                                        {viewData.data.photos && viewData.data.photos.length > 0 && (
                                            <div className="detail-images-grid" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                                {viewData.data.photos.map((img, idx) => (
                                                    <img 
                                                        key={idx} 
                                                        src={img} 
                                                        alt="Sell Request" 
                                                        style={{  
                                                            width: '100%', 
                                                            borderRadius: '4px', 
                                                            cursor: 'zoom-in', 
                                                            maxHeight: '150px', 
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                        onClick={() => setExpandedImage(img)}
                                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {viewData.type === 'service' && (
                                    <div className="detail-grid">
                                        <h4>Customer Information</h4>
                                        <p><strong>Name:</strong> {viewData.data.name}</p>
                                        <p><strong>Email:</strong> {viewData.data.email}</p>
                                        <p style={{ display: 'flex', alignItems: 'center' }}>
                                            <strong>Phone:</strong> <span style={{ marginLeft: '5px' }}>{viewData.data.phone}</span>
                                            <a href={`https://wa.me/91${viewData.data.phone}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', marginLeft: '10px' }}>
                                                <span style={{ background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>💬 WhatsApp</span>
                                            </a>
                                            <a href={`tel:${viewData.data.phone}`} style={{ textDecoration: 'none', marginLeft: '8px' }}>
                                                <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>📞 Call</span>
                                            </a>
                                        </p>
                                        <p><strong>Address:</strong> {viewData.data.address}</p>

                                        <h4 style={{ marginTop: '1rem' }}>Service Details</h4>
                                        <p><strong>Machine:</strong> {viewData.data.brand} {viewData.data.model} ({viewData.data.machineType})</p>
                                        <p><strong>Preferred Date:</strong> {new Date(viewData.data.preferredDate).toLocaleDateString()}</p>
                                        <div className="detail-desc">
                                            <strong>Issue Description:</strong>
                                            <p>{viewData.data.issue}</p>
                                        </div>
                                    </div>
                                )}

                                {viewData.type === 'contact' && (
                                    <div className="detail-grid">
                                        <p><strong>Name:</strong> {viewData.data.name}</p>
                                        <p><strong>Email:</strong> {viewData.data.email}</p>
                                        <p><strong>Phone:</strong> {viewData.data.phone}</p>
                                        <p><strong>Date:</strong> {new Date(viewData.data.createdAt).toLocaleString()}</p>
                                        <h4 style={{ marginTop: '1rem' }}>Message</h4>
                                        <p><strong>Subject:</strong> {viewData.data.subject}</p>
                                        <div className="detail-desc" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                                            {viewData.data.message}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer" style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {viewData.type === 'order' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: '600', color: '#475569' }}>Update Order Status:</span>
                                        <select 
                                            value={viewData.data.status} 
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                updateOrderStatus(viewData.data._id, newStatus);
                                                setViewData({ ...viewData, data: { ...viewData.data, status: newStatus } });
                                            }}
                                            style={{ 
                                                padding: '0.6rem 1rem', 
                                                borderRadius: '6px', 
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.95rem',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                minWidth: '150px'
                                            }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div></div>
                                )}
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setViewData(null)}
                                    style={{
                                        padding: '0.6rem 1.5rem',
                                        background: '#334155',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Zoom Overlay */}
                {expandedImage && (
                    <div className="image-zoom-overlay" onClick={() => setExpandedImage(null)}>
                        <img 
                            src={expandedImage} 
                            alt="Expanded View" 
                            className="image-zoom-img"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                            className="btn-icon" 
                            onClick={() => setExpandedImage(null)} 
                            style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', fontSize: '2rem', background: 'none', border: 'none' }}
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default AdminDashboard