import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Data states
  const [inventory, setInventory] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalSupplies: 0,
    totalValue: 0,
    activeUsers: 0,
    pendingRequests: 0,
    lowStockAlerts: 0
  });

  // Chart data
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

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
      fetchAllData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchAllData = async (token) => {
    setLoading(true);
    setError(null);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const results = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/inventories`, { headers }),
        fetch(`${API_BASE_URL}/api/requisitions`, { headers }),
        fetch(`${API_BASE_URL}/api/users`, { headers })
      ]);

      // Process inventory data
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const inventoryData = await results[0].value.json();
        const inventoryArray = Array.isArray(inventoryData) ? inventoryData : inventoryData.data || [];
        setInventory(inventoryArray);
        processInventoryData(inventoryArray);
      }

      // Process requisitions data
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const requisitionsData = await results[1].value.json();
        const requisitionsArray = Array.isArray(requisitionsData) ? requisitionsData : requisitionsData.data || [];
        setRequisitions(requisitionsArray);
        processRequisitionsData(requisitionsArray);
      }

      // Process users data
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const usersData = await results[2].value.json();
        const usersArray = Array.isArray(usersData) ? usersData : usersData.data || [];
        setUsers(usersArray);
        setStats(prev => ({ ...prev, activeUsers: usersArray.length }));
      }

      generateRecentActivities();
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processInventoryData = (inventoryArray) => {
    const totalSupplies = inventoryArray.length;
    const totalValue = inventoryArray.reduce((sum, item) =>
      sum + ((item.stock || 0) * (item.unitPrice || 0)), 0);
    const lowStock = inventoryArray
      .filter(item => (item.stock || 0) <= (item.threshold || 5))
      .length;

    setStats(prev => ({
      ...prev,
      totalSupplies,
      totalValue,
      lowStockAlerts: lowStock
    }));
  };

  const processRequisitionsData = (requisitionsArray) => {
    const pending = requisitionsArray.filter(req =>
      req.status?.toLowerCase() === 'pending'
    ).length;

    setStats(prev => ({ ...prev, pendingRequests: pending }));

    const pendingReqs = requisitionsArray
      .filter(req => req.status?.toLowerCase() === 'pending')
      .map(req => ({
        id: req._id,
        requester: req.requesterName || req.requestedByDetails?.fullName || 'Unknown',
        item: req.items?.map(item => `${item.itemName} (${item.quantity})`).join(', ') || 'No items',
        priority: calculatePriority(req),
        date: req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : 'N/A'
      }))
      .slice(0, 5);

    setPendingRequests(pendingReqs);

    // Process weekly data
    const last7Days = getLast7Days();
    const weeklyStats = last7Days.map(day => {
      const dayReqs = requisitionsArray.filter(req => {
        if (!req.createdAt) return false;
        const reqDate = new Date(req.createdAt).toDateString();
        return reqDate === day.date;
      });

      const daySupplies = dayReqs.reduce((sum, req) =>
        sum + req.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0
      );

      return {
        day: day.shortName,
        supplies: daySupplies,
        requests: dayReqs.length,
        approvals: dayReqs.filter(req => req.status === 'approved').length
      };
    });

    setWeeklyData(weeklyStats);

    // Process monthly data
    const last6Months = getLast6Months();
    const monthlyStats = last6Months.map(month => {
      const monthReqs = requisitionsArray.filter(req => {
        if (!req.createdAt) return false;
        const reqDate = new Date(req.createdAt);
        return reqDate.getMonth() === month.month && reqDate.getFullYear() === month.year;
      });

      const monthSupplies = monthReqs.reduce((sum, req) =>
        sum + req.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0
      );

      return {
        month: month.shortName,
        supplies: monthSupplies,
        requests: monthReqs.length,
        approvals: monthReqs.filter(req => req.status === 'approved').length
      };
    });

    setMonthlyData(monthlyStats);
  };

  const generateRecentActivities = () => {
    const activities = [];

    requisitions.slice(0, 3).forEach(req => {
      if (req.createdAt) {
        activities.push({
          id: req._id,
          user: req.requesterName || req.requestedByDetails?.fullName || 'Unknown',
          action: 'requested',
          item: `${req.items?.length || 0} item(s)`,
          time: formatTimeAgo(new Date(req.createdAt)),
          type: 'request'
        });
      }
    });

    activities.sort((a, b) => {
      const timeA = new Date(a.time).getTime() || 0;
      const timeB = new Date(b.time).getTime() || 0;
      return timeB - timeA;
    });

    setRecentActivities(activities.slice(0, 5));
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toDateString(),
        shortName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

  const getLast6Months = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        shortName: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return months;
  };

  const calculatePriority = (requisition) => {
    const total = requisition.totalAmount || 0;
    if (total > 10000) return 'high';
    if (total > 5000) return 'medium';
    return 'low';
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getChartData = () => {
    return timeRange === 'week' ? weeklyData : monthlyData;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="flex-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <div className="spinner-lg"></div>
            <p className="mt-4 text-secondary">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="flex-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <div className="text-danger" style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 className="text-xl mb-2">Error Loading Dashboard</h2>
            <p className="text-secondary mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="flex-between">
          <div>
            <h1>{getGreeting()}, {user.fullName?.split(' ')[0] || 'Admin'}!</h1>
            <p>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-cards">
        <div className="card">
          <div className="card-icon">
            <span>📦</span>
          </div>
          <div className="card-content">
            <h3>Total Supplies</h3>
            <div className="card-value">{stats.totalSupplies}</div>
            <div className="card-change">Unique items in inventory</div>
          </div>
        </div>

        <div className="card">
          <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
            <span>💰</span>
          </div>
          <div className="card-content">
            <h3>Total Value</h3>
            <div className="card-value" style={{ color: '#22c55e' }}>{formatCurrency(stats.totalValue)}</div>
            <div className="card-change">Current inventory value</div>
          </div>
        </div>

        <div className="card">
          <div className="card-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
            <span>👥</span>
          </div>
          <div className="card-content">
            <h3>Active Users</h3>
            <div className="card-value" style={{ color: '#a855f7' }}>{stats.activeUsers}</div>
            <div className="card-change">Registered users</div>
          </div>
        </div>

        <div className="card">
          <div className="card-icon" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
            <span>📋</span>
          </div>
          <div className="card-content">
            <h3>Pending Requests</h3>
            <div className="card-value" style={{ color: '#eab308' }}>{stats.pendingRequests}</div>
            <div className="card-change">Awaiting approval</div>
          </div>
        </div>
      </div>

      {/* Supply Trends Chart */}
      <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h2>Supply Trends</h2>
          <div className="flex gap-2" style={{ background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.25rem' }}>
            <button
              onClick={() => setTimeRange('week')}
              className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Month
            </button>
          </div>
        </div>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="colorSupplies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#023e8a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#023e8a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey={timeRange === 'week' ? 'day' : 'month'} stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
              />
              <Area
                type="monotone"
                dataKey="supplies"
                stroke="#023e8a"
                fillOpacity={1}
                fill="url(#colorSupplies)"
                name="Supplies"
              />
              <Line type="monotone" dataKey="requests" stroke="#10B981" name="Requests" />
              <Line type="monotone" dataKey="approvals" stroke="#F59E0B" name="Approvals" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-center" style={{ height: '400px' }}>
            <p className="text-secondary">No data available for the selected period</p>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
        <h2>Recent Activities</h2>
        {recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex-between border-bottom pb-4">
                <div className="flex-center gap-3">
                  <div className={`card-icon`} style={{ width: '32px', height: '32px', background: activity.type === 'request' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}>
                    <span style={{ fontSize: '1rem' }}>
                      {activity.type === 'request' && '📝'}
                      {activity.type === 'approve' && '✅'}
                      {activity.type === 'update' && '🔄'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{activity.user} {activity.action} {activity.item}</p>
                    <p className="text-secondary text-sm mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-center" style={{ height: '200px' }}>
            <p className="text-secondary">No recent activities</p>
          </div>
        )}
      </div>

      {/* Pending Requests Table */}
      <div className="dashboard-section">
        <h2>Pending Requests</h2>
        {pendingRequests.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Item</th>
                  <th>Priority</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(request => (
                  <tr
                    key={request.id}
                    onClick={() => navigate(`/requisitions/${request.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-medium">{request.requester}</td>
                    <td className="text-secondary">{request.item}</td>
                    <td>
                      <span className={`badge badge-${request.priority}`}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </span>
                    </td>
                    <td className="text-secondary">{request.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center" style={{ height: '200px' }}>
            <p className="text-secondary">No pending requests</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;