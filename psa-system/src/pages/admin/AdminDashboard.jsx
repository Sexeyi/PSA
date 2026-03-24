import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const [requisitions, setRequisitions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalSupplies: 0,
        lowStockCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        issuedCount: 0,
        issuedToday: 0,
        totalValue: 0,
        totalUsers: 0,
        totalRequisitions: 0
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/login');
        }
    }, [navigate]);

    // Fetch all data from database
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch all data in parallel
                const [inventoryRes, requisitionsRes, usersRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/inventory`, { headers }).catch(err => ({ ok: false, error: err })),
                    fetch(`${API_BASE_URL}/api/requisitions`, { headers }).catch(err => ({ ok: false, error: err })),
                    fetch(`${API_BASE_URL}/api/users`, { headers }).catch(err => ({ ok: false, error: err }))
                ]);

                // Process inventory data
                if (inventoryRes.ok) {
                    const data = await inventoryRes.json();
                    const inventoryArray = Array.isArray(data) ? data : data.data || data.inventory || [];
                    setInventory(inventoryArray);
                } else {
                    console.error('Failed to fetch inventory');
                }

                // Process requisitions data
                if (requisitionsRes.ok) {
                    const data = await requisitionsRes.json();
                    let requisitionsArray = [];
                    if (data.data && Array.isArray(data.data)) {
                        requisitionsArray = data.data;
                    } else if (data.requests && Array.isArray(data.requests)) {
                        requisitionsArray = data.requests;
                    } else if (Array.isArray(data)) {
                        requisitionsArray = data;
                    }
                    setRequisitions(requisitionsArray);
                } else {
                    console.error('Failed to fetch requisitions');
                }

                // Process users data
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    const usersArray = Array.isArray(data) ? data : data.data || data.users || [];
                    setUsers(usersArray);
                } else {
                    console.error('Failed to fetch users');
                }

            } catch (error) {
                console.error('Error in fetchAllData:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [navigate]);

    // Calculate stats whenever data changes
    useEffect(() => {
        const normalizeStatus = (status) => (status || '').toLowerCase();

        // Inventory stats
        const totalSupplies = inventory?.length || 0;
        const totalValue = inventory?.reduce((sum, item) => {
            const stock = item.stock || item.quantity || 0;
            const price = item.unitPrice || item.price || 0;
            return sum + (stock * price);
        }, 0) || 0;

        const lowStockCount = (inventory || []).filter(item => {
            const stock = item.stock || item.quantity || 0;
            return stock <= 5 && stock > 0;
        }).length;

        // Requisition stats
        const totalRequisitions = requisitions?.length || 0;

        const pendingCount = (requisitions || []).filter(req => {
            const status = normalizeStatus(req.status);
            return status === 'approved_by_superadmin' || status === 'pending_admin';
        }).length;

        const approvedCount = (requisitions || []).filter(req => {
            const status = normalizeStatus(req.status);
            return status === 'approved_by_admin' || status === 'approved';
        }).length;

        const issuedCount = (requisitions || []).filter(req => {
            const status = normalizeStatus(req.status);
            return status === 'issued';
        }).length;

        // Issued today
        const today = new Date().toISOString().split('T')[0];
        const issuedToday = (requisitions || []).filter(req => {
            const status = normalizeStatus(req.status);
            if (status !== 'issued') return false;
            const issuedDate = req.issuedDate || req.updatedAt;
            if (!issuedDate) return false;
            try {
                const dateStr = new Date(issuedDate).toISOString().split('T')[0];
                return dateStr === today;
            } catch {
                return false;
            }
        }).length;

        // User stats
        const totalUsers = users?.length || 0;

        setStats({
            totalSupplies,
            lowStockCount,
            pendingCount,
            approvedCount,
            issuedCount,
            issuedToday,
            totalValue,
            totalUsers,
            totalRequisitions
        });
    }, [inventory, requisitions, users]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const normalizeStatus = (status) => (status || '').toLowerCase();

    // Get pending requisitions
    const pendingRequisitions = (requisitions || []).filter(req => {
        const status = normalizeStatus(req.status);
        return status === 'approved_by_superadmin' || status === 'pending_admin';
    }).slice(0, 5);

    // Get approved requisitions (ready to issue)
    const approvedRequisitions = (requisitions || []).filter(req => {
        const status = normalizeStatus(req.status);
        return status === 'approved_by_admin' || status === 'approved';
    }).slice(0, 5);

    // Get low stock items
    const lowStockItems = (inventory || [])
        .filter(item => {
            const stock = item.stock || item.quantity || 0;
            return stock <= 5 && stock > 0;
        })
        .sort((a, b) => (a.stock || a.quantity || 0) - (b.stock || b.quantity || 0))
        .slice(0, 5);

    // Get recent activities
    const recentActivities = (requisitions || [])
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5)
        .map(req => ({
            id: req._id,
            type: normalizeStatus(req.status),
            description: `${req.requesterName || req.requestedByDetails?.fullName || 'Someone'} requested ${req.items?.length || 0} item(s)`,
            time: formatDateTime(req.updatedAt || req.createdAt),
            amount: req.totalAmount
        }));

    // Get recent issuances
    const recentIssuances = (requisitions || [])
        .filter(req => normalizeStatus(req.status) === 'issued')
        .sort((a, b) => new Date(b.issuedDate || b.updatedAt) - new Date(a.issuedDate || a.updatedAt))
        .slice(0, 5);

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-lg"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
            <div className="container-custom py-8">
                {/* Header with Greeting */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="gradient-text text-3xl font-bold">
                                {getGreeting()}, {user?.fullName || 'Admin'}!
                            </h1>
                            <p className="text-gray-600 mt-2">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="tooltip">
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-lg">
                                        {user?.fullName?.charAt(0) || 'A'}
                                    </span>
                                </div>
                                <span className="tooltip-text">{user?.fullName} - {user?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 animate-fade-in">
                        ⚠️ {error}
                    </div>
                )}

                {/* Stats Cards - Primary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <div className="card p-5 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Supplies</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalSupplies}</p>
                                <p className="text-xs text-primary-600 mt-2 flex items-center gap-1">
                                    <span>📦</span> Inventory items
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Inventory Value</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
                                <p className="text-xs text-gray-500 mt-2">Total stock value</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">💰</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
                                <p className="text-xs text-gray-500 mt-2">Active accounts</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Requisitions</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.totalRequisitions}</p>
                                <p className="text-xs text-gray-500 mt-2">All time requests</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Secondary Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="card p-4 text-center">
                        <p className="text-sm text-gray-500">Pending Approval</p>
                        <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingCount}</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-sm text-gray-500">Ready to Issue</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.approvedCount}</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-sm text-gray-500">Issued Today</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.issuedToday}</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-sm text-gray-500">Low Stock Items</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{stats.lowStockCount}</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Pending Requisitions */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Pending Requisitions</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Waiting for admin approval</p>
                                </div>
                                <button
                                    onClick={() => navigate('/ApproveRequests')}
                                    className="btn btn-secondary text-sm"
                                >
                                    View All →
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            {pendingRequisitions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">✅</div>
                                    <p className="text-gray-500">No pending requisitions</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRequisitions.map(req => (
                                        <div
                                            key={req._id}
                                            onClick={() => navigate(`/requisitions/${req._id}`)}
                                            className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition-all border border-yellow-200"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded">
                                                            {req.requestNumber || req._id?.slice(-6)}
                                                        </span>
                                                        <span className="badge badge-pending">Pending Admin</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        {req.requesterName || req.requester?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {req.items?.length || 0} item(s) • {formatDate(req.createdAt)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-yellow-600">
                                                        {formatCurrency(req.totalAmount || 0)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {req.department || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            {req.notes && (
                                                <p className="text-xs text-gray-500 mt-2 truncate">
                                                    📝 {req.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ready to Issue */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Ready to Issue</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Approved and ready for issuance</p>
                                </div>
                                <button
                                    onClick={() => navigate('/requisitions?status=approved')}
                                    className="btn btn-secondary text-sm"
                                >
                                    View All →
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            {approvedRequisitions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">📋</div>
                                    <p className="text-gray-500">No requisitions ready to issue</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {approvedRequisitions.map(req => (
                                        <div
                                            key={req._id}
                                            onClick={() => navigate(`/requisitions/${req._id}`)}
                                            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-all border border-green-200"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded">
                                                            {req.requestNumber || req._id?.slice(-6)}
                                                        </span>
                                                        <span className="badge badge-approved">Approved</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        {req.requesterName || req.requester?.name || 'Unknown'}
                                                    </p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-xs text-gray-600">
                                                            {req.items?.length || 0} items
                                                        </span>
                                                        <span className="text-sm font-bold text-green-600">
                                                            {formatCurrency(req.totalAmount || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Third Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Low Stock Alerts */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Items needing replenishment</p>
                        </div>

                        <div className="p-5">
                            {lowStockItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">📦</div>
                                    <p className="text-gray-500">All items have sufficient stock</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lowStockItems.map(item => (
                                        <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name || item.itemName}</p>
                                                <p className="text-xs text-gray-600 mt-0.5">{item.category || 'General'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${(item.stock || item.quantity) <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                                                    {(item.stock || item.quantity)} {item.unit || 'pcs'}
                                                </p>
                                                <p className="text-xs text-gray-500">Min: 5</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => navigate('/inventory')}
                                className="w-full btn btn-secondary"
                            >
                                Manage Inventory
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Latest updates and actions</p>
                        </div>

                        <div className="p-5 max-h-96 overflow-y-auto">
                            {recentActivities.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">📭</div>
                                    <p className="text-gray-500">No recent activity</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivities.map(activity => (
                                        <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                                ${activity.type === 'issued' ? 'bg-green-100' :
                                                    activity.type === 'approved' ? 'bg-blue-100' :
                                                        activity.type === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                                <span className="text-sm">
                                                    {activity.type === 'issued' ? '✅' :
                                                        activity.type === 'approved' ? '✓' :
                                                            activity.type === 'rejected' ? '❌' : '⏳'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">{activity.description}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                                    {activity.amount && (
                                                        <span className="text-xs font-medium text-primary-600">
                                                            {formatCurrency(activity.amount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Issuances */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Issuances</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Items issued to employees</p>
                        </div>

                        <div className="p-5 max-h-96 overflow-y-auto">
                            {recentIssuances.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">📦</div>
                                    <p className="text-gray-500">No items issued yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentIssuances.map(req => (
                                        <div key={req._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {req.requesterName || req.requester?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {req.department || 'N/A'}
                                                    </p>
                                                </div>
                                                <span className="badge badge-issued">Issued</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-xs text-gray-600">
                                                    {req.items?.length || 0} items
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(req.issuedDate || req.updatedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => navigate('/requisitions?status=issued')}
                                className="w-full btn btn-secondary"
                            >
                                View All Issuances
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;