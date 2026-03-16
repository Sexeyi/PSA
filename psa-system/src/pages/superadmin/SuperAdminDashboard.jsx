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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalSupplies: 2456,
    recentActivities: 18,
    pendingRequests: 7,
    lowStockAlerts: 4,
    totalValue: 158420,
    activeUsers: 24
  });

  // Real data for charts
  const weeklyData = [
    { day: 'Mon', supplies: 65, requests: 28, approvals: 15, value: 4200 },
    { day: 'Tue', supplies: 72, requests: 35, approvals: 22, value: 5800 },
    { day: 'Wed', supplies: 68, requests: 42, approvals: 28, value: 5100 },
    { day: 'Thu', supplies: 85, requests: 38, approvals: 25, value: 6300 },
    { day: 'Fri', supplies: 78, requests: 45, approvals: 32, value: 5900 },
    { day: 'Sat', supplies: 45, requests: 20, approvals: 12, value: 2800 },
    { day: 'Sun', supplies: 38, requests: 15, approvals: 8, value: 2100 }
  ];

  const monthlyData = [
    { month: 'Jan', supplies: 450, requests: 180, approvals: 145, value: 28500 },
    { month: 'Feb', supplies: 520, requests: 210, approvals: 168, value: 32400 },
    { month: 'Mar', supplies: 480, requests: 195, approvals: 156, value: 29800 },
    { month: 'Apr', supplies: 610, requests: 245, approvals: 198, value: 38600 },
    { month: 'May', supplies: 585, requests: 228, approvals: 182, value: 36500 },
    { month: 'Jun', supplies: 630, requests: 260, approvals: 215, value: 41200 }
  ];

  const categoryData = [
    { name: 'Electronics', value: 850, color: '#3B82F6' },
    { name: 'Furniture', value: 620, color: '#10B981' },
    { name: 'Stationery', value: 430, color: '#F59E0B' },
    { name: 'Equipment', value: 380, color: '#EF4444' },
    { name: 'Others', value: 176, color: '#8B5CF6' }
  ];

  const stockStatusData = [
    { name: 'In Stock', value: 65, color: '#10B981' },
    { name: 'Low Stock', value: 20, color: '#F59E0B' },
    { name: 'Critical', value: 10, color: '#EF4444' },
    { name: 'Out of Stock', value: 5, color: '#6B7280' }
  ];

  const recentActivities = [
    { id: 1, user: 'John Doe', action: 'added new supplies', item: 'Laptops (5 units)', time: '5 minutes ago', type: 'add' },
    { id: 2, user: 'Jane Smith', action: 'requested', item: 'Office chairs (3 units)', time: '15 minutes ago', type: 'request' },
    { id: 3, user: 'Mike Johnson', action: 'approved', item: 'Stationery order', time: '1 hour ago', type: 'approve' },
    { id: 4, user: 'Sarah Wilson', action: 'updated stock', item: 'Printer cartridges', time: '2 hours ago', type: 'update' },
    { id: 5, user: 'Tom Brown', action: 'reported low stock', item: 'A4 Paper packs', time: '3 hours ago', type: 'alert' }
  ];

  const lowStockItems = [
    { id: 1, name: 'A4 Paper', current: 15, threshold: 50, unit: 'packs', status: 'critical' },
    { id: 2, name: 'Printer Cartridges', current: 8, threshold: 20, unit: 'units', status: 'low' },
    { id: 3, name: 'Notebooks', current: 25, threshold: 40, unit: 'pcs', status: 'low' },
    { id: 4, name: 'Pens', current: 45, threshold: 100, unit: 'boxes', status: 'critical' }
  ];

  const pendingRequests = [
    { id: 1, requester: 'Marketing Dept', item: 'Laptops (10)', priority: 'high', date: '2024-01-15' },
    { id: 2, requester: 'HR Dept', item: 'Office chairs (5)', priority: 'medium', date: '2024-01-15' },
    { id: 3, requester: 'IT Dept', item: 'Monitors (8)', priority: 'high', date: '2024-01-14' },
    { id: 4, requester: 'Sales Dept', item: 'Tablets (6)', priority: 'low', date: '2024-01-14' }
  ];

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

      // Simulate real-time notifications
      const interval = setInterval(() => {
        const newNotifications = [
          { id: Date.now(), message: 'New supply request received', type: 'info', time: 'Just now' },
          { id: Date.now() + 1, message: 'Stock alert: A4 Paper running low', type: 'warning', time: 'Just now' }
        ];
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 5));
      }, 30000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const getChartData = () => {
    return timeRange === 'week' ? weeklyData : monthlyData;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">SupplyChain Pro</h1>
              <div className="hidden md:flex space-x-4">
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Inventory</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Requests</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Reports</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Settings</a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <span className="text-xl">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <p className="text-sm text-gray-800">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-500">No new notifications</p>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.fullName?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Greeting and Date */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {user.fullName.split(' ')[0]}!
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

          {/* Time Range Selector */}
          <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'week'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'month'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Total Supplies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSupplies}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <span>↑</span> 12% from last month
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
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <span>↑</span> 8.2% from last month
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
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
                <p className="text-sm text-blue-600 mt-2 flex items-center">
                  <span>↗</span> 4 online now
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Supply Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supply Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
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
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stock Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                innerRadius="20%"
                outerRadius="90%"
                data={stockStatusData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise={true}
                  dataKey="value"
                  cornerRadius={10}
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ lineHeight: '24px' }}
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
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
                  <span className="text-xs text-gray-400">#{activity.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Third Row - Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Current</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Threshold</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="py-3 text-sm text-gray-600">{item.current} {item.unit}</td>
                      <td className="py-3 text-sm text-gray-600">{item.threshold} {item.unit}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${item.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                        `}>
                          {item.status === 'critical' ? 'Critical' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h2>
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
                    <tr key={request.id} className="border-b border-gray-100 last:border-0">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;