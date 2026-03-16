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
    const [inventoryError, setInventoryError] = useState(null);
    const [stats, setStats] = useState({
        totalSupplies: 0,
        lowStockCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        issuedToday: 0,
        totalValue: 0
    });

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
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Fetch requisitions and inventory
    useEffect(() => {
        const token = localStorage.getItem('token');

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                setInventoryError(null);

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

                // Fetch requisitions
                try {
                    const reqResponse = await fetch(`${API_BASE_URL}/api/requisitions`, { headers });

                    if (!reqResponse.ok) {
                        console.error('Requisitions fetch failed:', reqResponse.status);
                    } else {
                        const requisitionsData = await reqResponse.json();

                        // Extract requisitions array
                        let requisitionsArray = [];
                        if (requisitionsData.data && Array.isArray(requisitionsData.data)) {
                            requisitionsArray = requisitionsData.data;
                        } else if (requisitionsData.requests && Array.isArray(requisitionsData.requests)) {
                            requisitionsArray = requisitionsData.requests;
                        } else if (Array.isArray(requisitionsData)) {
                            requisitionsArray = requisitionsData;
                        }

                        setRequisitions(requisitionsArray);
                    }
                } catch (reqError) {
                    console.error('Error fetching requisitions:', reqError);
                }

                // Fetch inventory
                try {
                    console.log('Fetching inventory from:', `${API_BASE_URL}/api/inventories`);

                    const invResponse = await fetch(`${API_BASE_URL}/api/inventories`, { headers });

                    if (!invResponse.ok) {
                        console.error('Inventory fetch failed with status:', invResponse.status);
                        setInventoryError(`Inventory API returned ${invResponse.status}`);
                        setInventory([]);
                    } else {
                        const inventoryData = await invResponse.json();
                        console.log('Inventory data received:', inventoryData);

                        let inventoryArray = [];

                        if (Array.isArray(inventoryData)) {
                            inventoryArray = inventoryData;
                            console.log('✅ Inventory is a direct array with', inventoryArray.length, 'items');
                        } else if (inventoryData.data && Array.isArray(inventoryData.data)) {
                            inventoryArray = inventoryData.data;
                        } else if (inventoryData.inventories && Array.isArray(inventoryData.inventories)) {
                            inventoryArray = inventoryData.inventories;
                        }

                        setInventory(inventoryArray);

                        // Log sample item structure to help with field names
                        if (inventoryArray.length > 0) {
                            console.log('Sample inventory item structure:', inventoryArray[0]);
                        }
                    }
                } catch (invError) {
                    console.error('Error fetching inventory:', invError);
                    setInventoryError(invError.message);
                    setInventory([]);
                }

            } catch (error) {
                console.error('Error in fetchData:', error);
                setError('Failed to load some dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
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
            const issuedDate = new Date(req.issuedDate).toISOString().split('T')[0];
            return issuedDate === today && req.status?.toLowerCase() === 'issued';
        }).length;

        setStats({
            totalSupplies,
            lowStockCount,
            pendingCount,
            approvedCount,
            issuedToday,
            totalValue
        });
    }, [inventory, requisitions]);

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

            // Check if this date has any requisitions issued
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasEvents = requisitions.some(r => {
                if (!r.issuedDate) return false;
                try {
                    const issuedDate = new Date(r.issuedDate).toISOString().split('T')[0];
                    return issuedDate === dateStr;
                } catch {
                    return false;
                }
            });

            days.push(
                <div
                    key={d}
                    className={`h-10 w-10 flex items-center justify-center rounded-full cursor-pointer relative
                        ${isToday ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}
                        ${hasEvents ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                    `}
                >
                    {d}
                    {hasEvents && (
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

            {/* Warning Banner */}
            {inventoryError && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Total Supplies</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSupplies}</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center">
                                <span>📦</span> Unique items
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
                            <p className="text-sm text-blue-600 mt-2 flex items-center">
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
                            <p className="text-sm font-medium text-gray-500 uppercase">Pending Approval</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingCount}</p>
                            <p className="text-sm text-yellow-600 mt-2 flex items-center">
                                <span>⏳</span> Ready for admin approval
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⏳</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Ready to Issue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approvedCount}</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center">
                                <span>✅</span> Approved by admin
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
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
                                                {req.requisitionNumber}
                                            </span>
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                                Pending Admin
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {req.requestedByDetails?.fullName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {req.items?.length} item(s) • {formatDate(req.createdAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-600">
                                            {formatCurrency(req.totalAmount)}
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
                                            {req.requisitionNumber}
                                        </span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                            Approved
                                        </span>
                                    </div>
                                    <p className="font-medium text-gray-900">{req.requestedByDetails?.fullName}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">
                                            {req.items?.length} items
                                        </span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(req.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Today's Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Items Issued Today</span>
                            <span className="text-2xl font-bold text-blue-600">{stats.issuedToday}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Pending Approvals</span>
                            <span className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Low Stock Items</span>
                            <span className="text-2xl font-bold text-red-600">{stats.lowStockCount}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => navigate('/requisitions?status=approved_by_admin')}
                            className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Process Issuance
                        </button>
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar</h2>

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
                            <span className="text-gray-600">Issuance</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;