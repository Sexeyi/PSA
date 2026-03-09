import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [requisitions, setRequisitions] = useState([]);
    const [inventory, setInventory] = useState([]);

    // Fetch logged-in user info
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
                const [reqRes, invRes] = await Promise.all([
                    fetch('/api/requisitions', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('/api/inventory', { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                const requisitionsData = await reqRes.json();
                const inventoryData = await invRes.json();

                // Ensure arrays
                setRequisitions(Array.isArray(requisitionsData) ? requisitionsData : requisitionsData.data || []);
                setInventory(Array.isArray(inventoryData) ? inventoryData : inventoryData.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
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
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<span key={`empty-${i}`} className="date empty"></span>);
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            days.push(<span key={d} className={`date ${isToday ? 'today' : ''}`}>{d}</span>);
        }

        return { days, monthName: monthNames[month], year };
    };

    const { days, monthName, year } = renderCalendar();

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (!user) return null;

    const totalSupplies = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= 5);

    // Pending includes both 'Pending' and 'pending'
    const pendingRequisitions = requisitions.filter(
        r => r.status === 'Pending' || r.status === 'pending'
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{getGreeting()}, {user.fullName}!</h1>
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
                    {lowStockItems.length === 0 ? <p>All items have sufficient stock.</p> : (
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
                                        <td>{item.itemName}</td>
                                        <td>{item.quantity}</td>
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
                    {pendingRequisitions.length === 0 ? <p>No pending requisitions.</p> : (
                        <table className="pending-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Requested By</th>
                                    <th>Date</th>
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
                                        <td>{req.itemName}</td>
                                        <td>{req.quantity}</td>
                                        <td>{req.requestedBy}</td>
                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td>{req.status}</td>
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
                            <button className="calendar-nav-btn" onClick={handlePrevMonth}>{'<'}</button>
                            <span className="calendar-month">{monthName} {year}</span>
                            <button className="calendar-nav-btn" onClick={handleNextMonth}>{'>'}</button>
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