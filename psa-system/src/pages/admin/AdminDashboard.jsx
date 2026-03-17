import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [requisitions, setRequisitions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [users, setUsers] = useState([]);
    const [inventoryError, setInventoryError] = useState(null);
    const [requisitionError, setRequisitionError] = useState(null);
    const [stats, setStats] = useState({
        totalSupplies: 0,
        lowStockCount: 0,
        pendingCount: 0,
        approvedCount: 0,
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
        const token = localStorage.getItem('token');

        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);
                setInventoryError(null);
                setRequisitionError(null);

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch all data in parallel
                const [inventoryRes, requisitionsRes, usersRes] = await Promise.allSettled([
                    fetch(`${API_BASE_URL}/api/inventories`, { headers }),
                    fetch(`${API_BASE_URL}/api/requisitions`, { headers }),
                    fetch(`${API_BASE_URL}/api/users`, { headers })
                ]);

                // Process inventory data
                if (inventoryRes.status === 'fulfilled' && inventoryRes.value.ok) {
                    const inventoryData = await inventoryRes.value.json();
                    console.log('Inventory data received:', inventoryData);

                    let inventoryArray = [];
                    if (Array.isArray(inventoryData)) {
                        inventoryArray = inventoryData;
                    } else if (inventoryData.data && Array.isArray(inventoryData.data)) {
                        inventoryArray = inventoryData.data;
                    } else if (inventoryData.inventories && Array.isArray(inventoryData.inventories)) {
                        inventoryArray = inventoryData.inventories;
                    }

                    setInventory(inventoryArray);
                } else {
                    console.error('Failed to fetch inventory:', inventoryRes.reason || 'API error');
                    setInventoryError('Failed to load inventory data');
                }

                // Process requisitions data
                if (requisitionsRes.status === 'fulfilled' && requisitionsRes.value.ok) {
                    const requisitionsData = await requisitionsRes.value.json();
                    console.log('Requisitions data received:', requisitionsData);

                    let requisitionsArray = [];
                    if (requisitionsData.data && Array.isArray(requisitionsData.data)) {
                        requisitionsArray = requisitionsData.data;
                    } else if (requisitionsData.requests && Array.isArray(requisitionsData.requests)) {
                        requisitionsArray = requisitionsData.requests;
                    } else if (Array.isArray(requisitionsData)) {
                        requisitionsArray = requisitionsData;
                    }

                    setRequisitions(requisitionsArray);
                } else {
                    console.error('Failed to fetch requisitions:', requisitionsRes.reason || 'API error');
                    setRequisitionError('Failed to load requisition data');
                }

                // Process users data
                if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
                    const usersData = await usersRes.value.json();
                    console.log('Users data received:', usersData);

                    let usersArray = [];
                    if (Array.isArray(usersData)) {
                        usersArray = usersData;
                    } else if (usersData.data && Array.isArray(usersData.data)) {
                        usersArray = usersData.data;
                    } else if (usersData.users && Array.isArray(usersData.users)) {
                        usersArray = usersData.users;
                    }

                    setUsers(usersArray);
                }

            } catch (error) {
                console.error('Error in fetchAllData:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAllData();
        }
    }, []);

    // Calculate stats whenever data changes
    useEffect(() => {
        const totalSupplies = inventory?.length || 0;

        // Calculate total inventory value
        const totalValue = inventory?.reduce((sum, item) => {
            return sum + ((item.stock || 0) * (item.unitPrice || 0));
        }, 0) || 0;

        // Low stock items (stock <= 5)
        const lowStockCount = (inventory || []).filter(item => {
            const stockLevel = item.stock ?? 0;
            return stockLevel <= 5 && stockLevel > 0;
        }).length;

        // Pending requisitions (waiting for admin approval after superadmin)
        const pendingCount = (requisitions || []).filter(req => {
            const status = req.status?.toLowerCase();
            return status === 'approved_by_superadmin';
        }).length;

        // Approved by admin (ready to issue)
        const approvedCount = (requisitions || []).filter(req => {
            const status = req.status?.toLowerCase();
            return status === 'approved_by_admin';
        }).length;

        // Issued today
        const today = new Date().toISOString().split('T')[0];
        const issuedToday = (requisitions || []).filter(req => {
            if (!req.issuedDate) return false;
            try {
                const issuedDate = new Date(req.issuedDate).toISOString().split('T')[0];
                return issuedDate === today && req.status?.toLowerCase() === 'issued';
            } catch {
                return false;
            }
        }).length;

        // Total requisitions
        const totalRequisitions = requisitions?.length || 0;

        // Total users
        const totalUsers = users?.length || 0;

        setStats({
            totalSupplies,
            lowStockCount,
            pendingCount,
            approvedCount,
            issuedToday,
            totalValue,
            totalUsers,
            totalRequisitions
        });
    }, [inventory, requisitions, users]);

    // Calendar helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const days = [];

        // Add empty spaces for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        // Add actual dates
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

            // Check if this date has any requisitions
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            // Count events on this date
            const eventsOnDate = requisitions.filter(r => {
                if (!r.createdAt && !r.issuedDate) return false;
                try {
                    const eventDate = r.issuedDate || r.createdAt;
                    const eventDateStr = new Date(eventDate).toISOString().split('T')[0];
                    return eventDateStr === dateStr;
                } catch {
                    return false;
                }
            }).length;

            days.push(
                <div
                    key={d}
                    className={`h-10 w-10 flex items-center justify-center rounded-full cursor-pointer relative
                        ${isToday ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}
                        ${eventsOnDate > 0 ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                    `}
                    title={`${eventsOnDate} event(s) on this day`}
                >
                    {d}
                    {eventsOnDate > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></span>
                    )}
                </div>
            );
        }

        return { days, monthName: monthNames[month], year };
    };

    const { days, monthName, year } = renderCalendar();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Format date
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

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get pending requisitions (approved by superadmin, waiting for admin)
    const pendingRequisitions = (requisitions || []).filter(req =>
        req.status?.toLowerCase() === 'approved_by_superadmin'
    );

    // Get approved requisitions (ready to issue)
    const approvedRequisitions = (requisitions || []).filter(req =>
        req.status?.toLowerCase() === 'approved_by_admin'
    );

    // Get low stock items
    const lowStockItems = (inventory || [])
        .filter(item => {
            const stockLevel = item.stock ?? 0;
            return stockLevel <= 5 && stockLevel > 0;
        })
        .sort((a, b) => (a.stock || 0) - (b.stock || 0))
        .slice(0, 5);

    // Get recent activities
    const recentActivities = (requisitions || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(req => ({
            id: req._id,
            type: req.status,
            description: `${req.requestedByDetails?.fullName || 'Someone'} requested ${req.items?.length || 0} item(s)`,
            time: formatDate(req.createdAt),
            amount: req.totalAmount
        }));

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header with Greeting */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {getGreeting()}, {user?.fullName || 'Admin'}!
                </h1>
                <p className="text-gray-600 mt-1">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            {/* Warning Banners */}
            {inventoryError && (
                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex">
                        <div className="shrink-0">
                            <span className="text-yellow-400 text-xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Inventory data unavailable: {inventoryError}. Showing limited dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {requisitionError && (
                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex">
                        <div className="shrink-0">
                            <span className="text-yellow-400 text-xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Requisition data unavailable: {requisitionError}. Showing limited dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards - Enhanced with real data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Total Supplies</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSupplies}</p>
                            <p className="text-sm text-blue-600 mt-2 flex items-center">
                                <span>📦</span> Across {inventory.length} categories
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Inventory Value</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalValue)}</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center">
                                <span>💰</span> Total stock value
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                            <p className="text-sm text-purple-600 mt-2 flex items-center">
                                <span>👥</span> Active in system
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Total Requisitions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequisitions}</p>
                            <p className="text-sm text-orange-600 mt-2 flex items-center">
                                <span>📋</span> All time requests
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Ready to Issue</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approvedCount}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Issued Today</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.issuedToday}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Pending Requisitions */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Requisitions</h2>
                        <button
                            onClick={() => navigate('/requisitions')}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            View All →
                        </button>
                    </div>

                    {pendingRequisitions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No pending requisitions awaiting admin approval
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingRequisitions.slice(0, 5).map(req => (
                                <div
                                    key={req._id}
                                    onClick={() => navigate(`/requisitions/${req._id}`)}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500">
                                                {req.requisitionNumber || 'N/A'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                                Pending Admin
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {req.requestedByDetails?.fullName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {req.items?.length || 0} item(s) • {formatDate(req.createdAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-600">
                                            {formatCurrency(req.totalAmount || 0)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {req.requestedByDetails?.department || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>

                    {inventoryError ? (
                        <p className="text-center py-8 text-red-600">Unable to load inventory data</p>
                    ) : lowStockItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No low stock items found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lowStockItems.map(item => (
                                <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-600">{item.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${item.stock <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                                            {item.stock} {item.unit || 'pcs'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Min: 5
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/inventory')}
                        className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        Manage Inventory
                    </button>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ready to Issue */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to Issue</h2>

                    {approvedRequisitions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No requisitions ready for issuance
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {approvedRequisitions.slice(0, 3).map(req => (
                                <div
                                    key={req._id}
                                    onClick={() => navigate(`/requisitions/${req._id}`)}
                                    className="p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-mono text-gray-500">
                                            {req.requisitionNumber || 'N/A'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                            Approved
                                        </span>
                                    </div>
                                    <p className="font-medium text-gray-900">{req.requestedByDetails?.fullName}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">
                                            {req.items?.length || 0} items
                                        </span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(req.totalAmount || 0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

                    {recentActivities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No recent activity
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivities.map(activity => (
                                <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                        ${activity.type === 'issued' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {activity.type === 'issued' ? '✅' : '📝'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Calendar</h2>

                    <div className="calendar">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                ←
                            </button>
                            <span className="font-medium text-gray-900">{monthName} {year}</span>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                →
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {days}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            <span className="text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">Activity</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;