import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('week');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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
    lowStockAlerts: 0,
    recentActivities: 0
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
      console.log('Fetching from API:', API_BASE_URL);

      // Fetch all data in parallel with error handling for each
      const results = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/inventories`, { headers }),
        fetch(`${API_BASE_URL}/api/requisitions`, { headers }),
        fetch(`${API_BASE_URL}/api/users`, { headers })
      ]);

      // Process inventory data
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const inventoryData = await results[0].value.json();
        console.log('Inventory data:', inventoryData);
        const inventoryArray = Array.isArray(inventoryData) ? inventoryData :
          inventoryData.data ? inventoryData.data : [];
        setInventory(inventoryArray);
        processInventoryData(inventoryArray);
      } else {
        console.error('Failed to fetch inventory:', results[0].reason || 'API error');
      }

      // Process requisitions data
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const requisitionsData = await results[1].value.json();
        console.log('Requisitions data:', requisitionsData);
        const requisitionsArray = Array.isArray(requisitionsData) ? requisitionsData :
          requisitionsData.data ? requisitionsData.data : [];
        setRequisitions(requisitionsArray);
        processRequisitionsData(requisitionsArray);
      } else {
        console.error('Failed to fetch requisitions:', results[1].reason || 'API error');
      }

      // Process users data
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const usersData = await results[2].value.json();
        console.log('Users data:', usersData);
        const usersArray = Array.isArray(usersData) ? usersData :
          usersData.data ? usersData.data : [];
        setUsers(usersArray);
        setStats(prev => ({ ...prev, activeUsers: usersArray.length }));
      } else {
        console.error('Failed to fetch users:', results[2].reason || 'API error');
      }

      // Generate recent activities after we have all data
      generateRecentActivities();

      // Set up real-time notifications
      setupNotifications();

    } catch (error) {
      console.error('Error in fetchAllData:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processInventoryData = (inventoryArray) => {
    // Calculate total supplies and value
    const totalSupplies = inventoryArray.length;
    const totalValue = inventoryArray.reduce((sum, item) =>
      sum + ((item.stock || 0) * (item.unitPrice || 0)), 0);

    // Process low stock items count only
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
    // Calculate pending requests
    const pending = requisitionsArray.filter(req =>
      req.status?.toLowerCase() === 'pending'
    ).length;

    setStats(prev => ({ ...prev, pendingRequests: pending }));

    // Process pending requests for table
    const pendingReqs = requisitionsArray
      .filter(req => req.status?.toLowerCase() === 'pending')
      .map(req => ({
        id: req._id,
        requester: req.requestedByDetails?.fullName || req.requestedBy || 'Unknown',
        item: req.items?.map(item => `${item.productName} (${item.quantity})`).join(', ') || 'No items',
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
        approvals: dayReqs.filter(req => req.status === 'approved').length,
        value: dayReqs.reduce((sum, req) => sum + (req.totalAmount || 0), 0)
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
        approvals: monthReqs.filter(req => req.status === 'approved').length,
        value: monthReqs.reduce((sum, req) => sum + (req.totalAmount || 0), 0)
      };
    });

    setMonthlyData(monthlyStats);
  };

  const generateRecentActivities = () => {
    const activities = [];

    // Add recent requisitions
    requisitions.slice(0, 3).forEach(req => {
      if (req.createdAt) {
        activities.push({
          id: req._id,
          user: req.requestedByDetails?.fullName || 'Unknown',
          action: 'requested',
          item: req.items?.map(item => `${item.productName} (${item.quantity})`).join(', ') || 'items',
          time: formatTimeAgo(new Date(req.createdAt)),
          type: 'request'
        });
      }
    });

    // Add recent inventory updates
    inventory.slice(0, 2).forEach(item => {
      if (item.updatedAt) {
        activities.push({
          id: `inv-${item._id}`,
          user: 'System',
          action: 'updated stock',
          item: `${item.name || 'Item'} - ${item.stock || 0} ${item.unit || 'pcs'}`,
          time: formatTimeAgo(new Date(item.updatedAt)),
          type: 'update'
        });
      }
    });

    // Sort by date (most recent first) and limit to 5
    activities.sort((a, b) => {
      const timeA = new Date(a.time).getTime() || 0;
      const timeB = new Date(b.time).getTime() || 0;
      return timeB - timeA;
    });

    setRecentActivities(activities.slice(0, 5));
  };

  const setupNotifications = () => {
    // Simulate real-time notifications based on actual data
    const interval = setInterval(() => {
      const newNotifications = [];

      // Check for new pending requests
      const newPending = requisitions.filter(r =>
        r.status === 'pending' &&
        r.createdAt &&
        new Date(r.createdAt) > new Date(Date.now() - 60000) // Last minute
      ).length;

      if (newPending > 0) {
        newNotifications.push({
          id: Date.now(),
          message: `${newPending} new pending request${newPending > 1 ? 's' : ''} received`,
          type: 'info',
          time: 'Just now'
        });
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 5));
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  // Helper functions
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
    // Calculate priority based on total amount or other factors
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
      currency: 'USD',
      minimumFractionDigits: 0
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <div className="text-xl text-gray-800 mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Greeting and Date - Simplified */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user.fullName?.split(' ')[0] || 'Admin'}!
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Supplies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSupplies}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <span>📦</span> Unique items in inventory
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
              <p className="text-sm font-medium text-gray-500 uppercase">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-blue-600 mt-2 flex items-center">
                <span></span> Current inventory value
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
              <p className="text-sm font-medium text-gray-500 uppercase">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              <p className="text-sm text-purple-600 mt-2 flex items-center">
                <span>👥</span> Registered users
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
              <p className="text-sm font-medium text-gray-500 uppercase">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</p>
              <p className="text-sm text-yellow-600 mt-2 flex items-center">
                <span>⏳</span> Awaiting approval
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - Only Supply Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        {/* Supply Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Supply Trends</h2>
            {/* Time Range Selector moved here */}
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'month'
                  ? 'bg-blue-500 text-white'
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
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
                  stroke="#3B82F6"
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
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${activity.type === 'add' ? 'bg-green-100 text-green-600' : ''}
                      ${activity.type === 'request' ? 'bg-blue-100 text-blue-600' : ''}
                      ${activity.type === 'approve' ? 'bg-purple-100 text-purple-600' : ''}
                      ${activity.type === 'update' ? 'bg-yellow-100 text-yellow-600' : ''}
                      ${activity.type === 'alert' ? 'bg-red-100 text-red-600' : ''}
                    `}>
                      {activity.type === 'add' && '➕'}
                      {activity.type === 'request' && '📝'}
                      {activity.type === 'approve' && '✅'}
                      {activity.type === 'update' && '🔄'}
                      {activity.type === 'alert' && '⚠️'}
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
      </div>

      {/* Pending Requests Table */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h2>
          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Requester</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(request => (
                    <tr key={request.id} className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/requisitions/${request.id}`)}>
                      <td className="py-3 text-sm text-gray-900">{request.requester}</td>
                      <td className="py-3 text-sm text-gray-600">{request.item}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${request.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                          ${request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${request.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                        `}>
                          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{request.date}</td>
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