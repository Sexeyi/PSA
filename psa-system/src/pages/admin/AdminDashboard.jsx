import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [requisitions, setRequisitions] = useState([]);
    const [inventory, setInventory] = useState([]);

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

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch requisitions
                const reqResponse = await fetch('/api/requisitions', { headers });
                const invResponse = await fetch('/api/inventory', { headers });

                if (!reqResponse.ok || !invResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const requisitionsData = await reqResponse.json();
                const inventoryData = await invResponse.json();

                // Extract requisitions array - your backend sends { requests: [...] }
                let requisitionsArray = [];
                if (requisitionsData.requests && Array.isArray(requisitionsData.requests)) {
                    requisitionsArray = requisitionsData.requests;
                }

                // Extract inventory array
                let inventoryArray = [];
                if (Array.isArray(inventoryData)) {
                    inventoryArray = inventoryData;
                } else if (inventoryData.data && Array.isArray(inventoryData.data)) {
                    inventoryArray = inventoryData.data;
                }

                setRequisitions(requisitionsArray);
                setInventory(inventoryArray);

            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, []);

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
            days.push(<span key={`empty-${i}`} className="date empty"></span>);
        }

        // Add actual dates
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

            // Check if this date has any requisitions
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasEvents = requisitions.some(r => {
                if (!r.dateRequested) return false;
                const reqDate = new Date(r.dateRequested).toISOString().split('T')[0];
                return reqDate === dateStr;
            });

            days.push(
                <span
                    key={d}
                    className={`date ${isToday ? 'today' : ''} ${hasEvents ? 'has-event' : ''}`}
                >
                    {d}
                    {hasEvents && <span className="event-dot"></span>}
                </span>
            );
        }

        return { days, monthName: monthNames[month], year };
    };

    const { days, monthName, year } = renderCalendar();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h3>Error Loading Dashboard</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    if (!user) return null;

    // Calculate stats
    const totalSupplies = inventory?.length || 0;

    // Low stock items
    const lowStockItems = (inventory || []).filter(item => {
        const quantity = item.quantity || item.stock || 0;
        return quantity <= 5;
    });

    // Pending requisitions
    const pendingRequisitions = (requisitions || []).filter(req => {
        const status = req.status?.toLowerCase();
        return status === 'pending';
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Format date from your dateRequested field
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

    // Extract items from the requisition
    const getItemNames = (req) => {
        if (!req.items || req.items.length === 0) return 'No items';
        return req.items.map(item =>
            item.description || item.itemName || item.name || 'Item'
        ).join(', ');
    };

    // Get total quantity from items
    const getTotalQuantity = (req) => {
        if (!req.items || req.items.length === 0) return 0;
        return req.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{getGreeting()}, {user?.fullName || user?.name || 'Admin'}!</h1>
                <p>Here's your system overview today.</p>
            </div>

            <div className="dashboard-cards">
                <div className="card card-supplies">
                    <div className="card-icon">📦</div>
                    <div className="card-content">
                        <h3>Total Supplies</h3>
                        <div className="card-value">{totalSupplies}</div>
                    </div>
                </div>

                <div className="card card-alerts">
                    <div className="card-icon">⚠️</div>
                    <div className="card-content">
                        <h3>Low Stock Items</h3>
                        <div className="card-value">{lowStockItems.length}</div>
                    </div>
                </div>

                <div className="card card-pending">
                    <div className="card-icon">⏳</div>
                    <div className="card-content">
                        <h3>Pending Requests</h3>
                        <div className="card-value">{pendingRequisitions.length}</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Low Stock Table */}
                <div className="dashboard-section">
                    <h2>Low Stock Details</h2>
                    {lowStockItems.length === 0 ? (
                        <p className="no-data">All items have sufficient stock.</p>
                    ) : (
                        <table className="pending-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockItems.map(item => (
                                    <tr key={item._id} className="low-stock">
                                        <td>{item.itemName || item.name || 'Unknown'}</td>
                                        <td>{item.quantity || item.stock || 0}</td>
                                        <td>{item.user || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pending Requisitions Table */}
                <div className="dashboard-section">
                    <h2>Pending Requisitions</h2>
                    {pendingRequisitions.length === 0 ? (
                        <p className="no-data">No pending requisitions.</p>
                    ) : (
                        <table className="pending-table">
                            <thead>
                                <tr>
                                    <th>Items</th>
                                    <th>Quantity</th>
                                    <th>Requested By</th>
                                    <th>Department</th>
                                    <th>Date Requested</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRequisitions.map(req => (
                                    <tr
                                        key={req._id}
                                        className="pending-row"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate('/requisitions')}
                                    >
                                        <td>{getItemNames(req)}</td>
                                        <td>{getTotalQuantity(req)}</td>
                                        <td>{req.requesterName || 'Unknown'}</td>
                                        <td>{req.department || 'N/A'}</td>
                                        <td>{formatDate(req.dateRequested)}</td>
                                        <td>
                                            <span className="status-badge pending">
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Calendar */}
                <div className="dashboard-section">
                    <h2>Calendar</h2>
                    <div className="calendar-placeholder">
                        <div className="calendar-header">
                            <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                                &lt;
                            </button>
                            <span className="calendar-month">{monthName} {year}</span>
                            <button className="calendar-nav-btn" onClick={handleNextMonth}>
                                &gt;
                            </button>
                        </div>
                        <div className="calendar-days">
                            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
                            <span>Thu</span><span>Fri</span><span>Sat</span>
                        </div>
                        <div className="calendar-dates">{days}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;