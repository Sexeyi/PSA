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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-danger-500 text-5xl mb-4">⚠️</div>
          <div className="text-xl text-gray-800 mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header with Profile */}
        <div className="flex justify-between items-start mb-8 animate-fade-in">
          <div>
            <h1 className="gradient-text text-3xl font-bold">
              {getGreeting()}, {user.fullName?.split(' ')[0] || 'Admin'}!
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

          {/* Profile Dropdown */}
          <div className="relative profile-menu">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">
                  {user.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-slide-up">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{user.role}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleProfile}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    My Profile
                  </button>
                </div>
                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Total Supplies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSupplies}</p>
                <p className="text-sm text-primary-600 mt-2">Unique items in inventory</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Total Value</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-green-600 mt-2">Current inventory value</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Active Users</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.activeUsers}</p>
                <p className="text-sm text-purple-600 mt-2">Registered users</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingRequests}</p>
                <p className="text-sm text-yellow-600 mt-2">Awaiting approval</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supply Trends Chart */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Supply Trends</h2>
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'week'
                  ? 'btn-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'month'
                  ? 'btn-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
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
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${activity.type === 'request' ? 'bg-blue-100 text-blue-600' : ''}
                      ${activity.type === 'approve' ? 'bg-green-100 text-green-600' : ''}
                      ${activity.type === 'update' ? 'bg-yellow-100 text-yellow-600' : ''}
                    `}>
                      {activity.type === 'request' && '📝'}
                      {activity.type === 'approve' && '✅'}
                      {activity.type === 'update' && '🔄'}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action} {activity.item}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No recent activities
            </div>
          )}
        </div>

        {/* Pending Requests Table */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h2>
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
                    >
                      <td className="font-medium text-gray-900">{request.requester}</td>
                      <td className="text-gray-600">{request.item}</td>
                      <td>
                        <span className={`priority-${request.priority}`}>
                          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                        </span>
                      </td>
                      <td className="text-gray-600">{request.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No pending requests</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;