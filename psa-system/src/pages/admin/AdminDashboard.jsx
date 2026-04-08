import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ user }) => {
    const [stats, setStats] = useState({
        totalInventory: 0,
        totalValue: 0,
        lowStock: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        issuedRequests: 0,
        rejectedRequests: 0
    });
    const [recentRequisitions, setRecentRequisitions] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Fetch inventory
            const inventoryResponse = await fetch(`${API_BASE_URL}/api/inventories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!inventoryResponse.ok) {
                throw new Error('Failed to fetch inventory');
            }

            const inventoryData = await inventoryResponse.json();
            let inventory = [];
            if (Array.isArray(inventoryData)) {
                inventory = inventoryData;
            } else if (inventoryData.data && Array.isArray(inventoryData.data)) {
                inventory = inventoryData.data;
            } else if (inventoryData.inventories && Array.isArray(inventoryData.inventories)) {
                inventory = inventoryData.inventories;
            }

            // Calculate inventory stats
            const totalItems = inventory.length;
            const totalValue = inventory.reduce((sum, item) => sum + ((item.stock || 0) * (item.unitPrice || 0)), 0);
            const lowStock = inventory.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length;
            const lowStockItemsList = inventory.filter(item => (item.stock || 0) <= 10).slice(0, 5);

            // Fetch requisitions
            const requisitionResponse = await fetch(`${API_BASE_URL}/api/requisitions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!requisitionResponse.ok) {
                throw new Error('Failed to fetch requisitions');
            }

            const requisitionData = await requisitionResponse.json();
            let requisitions = [];
            if (Array.isArray(requisitionData)) {
                requisitions = requisitionData;
            } else if (requisitionData.data && Array.isArray(requisitionData.data)) {
                requisitions = requisitionData.data;
            } else if (requisitionData.requests && Array.isArray(requisitionData.requests)) {
                requisitions = requisitionData.requests;
            }

            // Calculate requisition stats
            const pending = requisitions.filter(req => (req.status || '').toLowerCase() === 'pending').length;
            const approved = requisitions.filter(req => (req.status || '').toLowerCase() === 'approved').length;
            const issued = requisitions.filter(req => (req.status || '').toLowerCase() === 'issued').length;
            const rejected = requisitions.filter(req => (req.status || '').toLowerCase() === 'rejected').length;

            // Get recent requisitions (last 5)
            const recent = [...requisitions]
                .sort((a, b) => new Date(b.createdAt || b.dateRequested) - new Date(a.createdAt || a.dateRequested))
                .slice(0, 5);

            setStats({
                totalInventory: totalItems,
                totalValue: totalValue,
                lowStock: lowStock,
                pendingRequests: pending,
                approvedRequests: approved,
                issuedRequests: issued,
                rejectedRequests: rejected
            });
            setRecentRequisitions(recent);
            setLowStockItems(lowStockItemsList);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const getStatusBadge = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        const badges = {
            pending: 'badge-pending',
            approved: 'badge-approved',
            rejected: 'badge-rejected',
            issued: 'badge-issued'
        };
        return <span className={`status-badge ${badges[normalizedStatus] || 'badge-default'}`}>{status || 'Unknown'}</span>;
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <h3>Error Loading Dashboard</h3>
                <p>{error}</p>
                <button onClick={fetchAllData} className="retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Welcome back, {user?.fullName || 'Admin'}</h1>
                    <p className="dashboard-subtitle">Here's what's happening with your inventory today.</p>
                </div>
                <div className="dashboard-date">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Inventory Items</span>
                        <span className="stat-value">{stats.totalInventory}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Inventory Value</span>
                        <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Low Stock Items</span>
                        <span className="stat-value">{stats.lowStock}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Pending Requests</span>
                        <span className="stat-value">{stats.pendingRequests}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Approved</span>
                        <span className="stat-value">{stats.approvedRequests}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Issued</span>
                        <span className="stat-value">{stats.issuedRequests}</span>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="dashboard-grid">
                {/* Recent Requisitions */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Requisitions</h3>
                        <span className="card-subtitle">Latest 5 requests</span>
                    </div>
                    <div className="card-content">
                        {recentRequisitions.length === 0 ? (
                            <div className="empty-state-small">
                                <p>No recent requisitions</p>
                            </div>
                        ) : (
                            <div className="requisitions-list">
                                {recentRequisitions.map(req => (
                                    <div key={req._id} className="requisition-item">
                                        <div className="requisition-info">
                                            <span className="requisition-name">{typeof req.requesterName === 'string' ? req.requesterName : 'Unknown'}</span>
                                            <span className="requisition-dept">{typeof req.department === 'string' ? req.department : 'N/A'}</span>
                                            <span className="requisition-date">{formatDate(req.createdAt || req.dateRequested)}</span>
                                        </div>
                                        <div className="requisition-status">
                                            {getStatusBadge(req.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3 className="card-title">Low Stock Alerts</h3>
                        <span className="card-subtitle">Items needing attention</span>
                    </div>
                    <div className="card-content">
                        {lowStockItems.length === 0 ? (
                            <div className="empty-state-small">
                                <p>All items are well stocked</p>
                            </div>
                        ) : (
                            <div className="lowstock-list">
                                {lowStockItems.map(item => (
                                    <div key={item._id} className="lowstock-item">
                                        <div className="lowstock-info">
                                            <span className="lowstock-name">{typeof item.name === 'string' ? item.name : 'Unknown Item'}</span>
                                            <span className="lowstock-unit">{typeof item.unit === 'string' ? item.unit : 'pcs'}</span>
                                        </div>
                                        <div className="lowstock-stock">
                                            <span className={`stock-badge ${(item.stock || 0) === 0 ? 'out' : (item.stock || 0) <= 5 ? 'low' : 'medium'}`}>
                                                {item.stock || 0} left
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;