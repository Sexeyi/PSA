import React, { useEffect, useMemo, useState, useCallback } from "react";
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
    const [user, setUser] = useState(null);
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("All");
    const [calDate, setCalDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [viewMode, setViewMode] = useState("list");

    // Get user data
    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            window.location.href = '/login';
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }, []);

    // Fetch only current user's requisitions
    const fetchRequisitions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch(`http://localhost:5000/api/requisitions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized. Please login again.");
                }
                throw new Error(`Failed to fetch requisitions: ${response.status}`);
            }

            const data = await response.json();

            let requisitionsArray = [];
            if (Array.isArray(data)) {
                requisitionsArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                requisitionsArray = data.data;
            } else if (data.requisitions && Array.isArray(data.requisitions)) {
                requisitionsArray = data.requisitions;
            }

            // Filter requisitions for the current user
            const userId = user?.id || user?._id;
            const userRequisitions = requisitionsArray.filter(req => {
                const reqUserId = req.userId || req.user_id || req.user?.id || req.user?._id;
                return reqUserId === userId;
            });

            setRequisitions(userRequisitions);
        } catch (error) {
            console.error("Fetch requisitions error:", error);
            setError(error.message || 'Failed to load your requisitions. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchRequisitions();
        }
    }, [fetchRequisitions, user]);

    const safeParseDate = (dateValue) => {
        if (!dateValue) return null;
        try {
            const parsedDate = new Date(dateValue);
            if (isNaN(parsedDate.getTime())) return null;
            return parsedDate;
        } catch (error) {
            return null;
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = requisitions.filter(r => {
            const date = safeParseDate(r.createdAt);
            return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const pending = requisitions.filter(r => r.status === "Pending" || r.status === "pending");
        const approved = requisitions.filter(r => r.status === "Approved" || r.status === "approved");
        const rejected = requisitions.filter(r => r.status === "Rejected" || r.status === "rejected");

        return {
            total: requisitions.length,
            pending: pending.length,
            approved: approved.length,
            rejected: rejected.length,
            thisMonth: thisMonth.length,
            approvalRate: requisitions.length ? ((approved.length / requisitions.length) * 100).toFixed(1) : 0,
        };
    }, [requisitions]);

    const filtered = useMemo(() => {
        let result = [...requisitions];

        if (filter !== "All") {
            result = result.filter(r => r.status?.toLowerCase() === filter.toLowerCase());
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(r =>
                (r.title || r.itemName || "").toLowerCase().includes(term) ||
                (r.requestNumber || r._id || "").toLowerCase().includes(term) ||
                (r.category || "").toLowerCase().includes(term)
            );
        }

        result.sort((a, b) => {
            if (sortBy === "date") {
                const dateA = safeParseDate(a.createdAt);
                const dateB = safeParseDate(b.createdAt);
                const timeA = dateA ? dateA.getTime() : 0;
                const timeB = dateB ? dateB.getTime() : 0;
                return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
            }
            if (sortBy === "status") {
                const statusA = a.status || "";
                const statusB = b.status || "";
                return sortOrder === "desc"
                    ? statusB.localeCompare(statusA)
                    : statusA.localeCompare(statusB);
            }
            if (sortBy === "priority") {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityA = priorityOrder[a.priority?.toLowerCase()] || 0;
                const priorityB = priorityOrder[b.priority?.toLowerCase()] || 0;
                return sortOrder === "desc" ? priorityB - priorityA : priorityA - priorityB;
            }
            return 0;
        });

        return result;
    }, [filter, requisitions, searchTerm, sortBy, sortOrder]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const getFirstDay = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

    const renderCal = () => {
        const daysInMonth = getDaysInMonth(calDate);
        const firstDay = getFirstDay(calDate);
        const days = [];
        const today = new Date();
        const prevDays = new Date(calDate.getFullYear(), calDate.getMonth(), 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(
                <div key={`p${i}`} className="date empty">
                    {prevDays - i}
                </div>
            );
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
            const hasEvent = requisitions.some(r => {
                const date = safeParseDate(r.createdAt);
                return date && date.toISOString().slice(0, 10) === ds;
            });
            const isToday = today.getDate() === i && today.getMonth() === calDate.getMonth() && today.getFullYear() === calDate.getFullYear();

            let dayClass = "date";
            if (isToday) dayClass += " today";
            if (hasEvent && !isToday) dayClass += " has-event";

            days.push(
                <div key={i} className={dayClass}>
                    {i}
                </div>
            );
        }

        const rem = 42 - days.length;
        for (let i = 1; i <= rem; i++) {
            days.push(
                <div key={`n${i}`} className="date empty">
                    {i}
                </div>
            );
        }

        return days;
    };

    const badgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'badge-pending';
            case 'approved':
                return 'badge-approved';
            case 'rejected':
                return 'badge-rejected';
            default:
                return 'badge';
        }
    };

    const priorityClass = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'priority-high';
            case 'medium':
                return 'priority-medium';
            case 'low':
                return 'priority-low';
            default:
                return '';
        }
    };

    const getTotalAmount = (request) => {
        if (request.totalPrice) return request.totalPrice;
        if (request.total_amount) return request.total_amount;
        if (request.overallTotal) return request.overallTotal;
        if (request.items && request.items.length) {
            return request.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        }
        return 0;
    };

    const getItemCount = (request) => {
        if (request.items) return request.items.length;
        if (request.itemName) return 1;
        return 0;
    };

    const daysAgoLabel = (date) => {
        const parsedDate = safeParseDate(date);
        if (!parsedDate) return "N/A";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(parsedDate);
        d.setHours(0, 0, 0, 0);
        const diff = Math.floor((today - d) / 86400000);

        if (diff === 0) return "Today";
        if (diff === 1) return "Yesterday";
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
        if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
        return `${Math.floor(diff / 365)} years ago`;
    };

    const formatTotalAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="employee-dashboard">
                <div className="flex-center" style={{ minHeight: '100vh' }}>
                    <div className="text-center">
                        <div className="spinner-lg"></div>
                        <p className="mt-4 text-secondary">Loading your requests...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="employee-dashboard">
                <div className="flex-center" style={{ minHeight: '100vh' }}>
                    <div className="text-center">
                        <h2 className="text-xl mb-2">Error Loading Dashboard</h2>
                        <p className="text-secondary mb-4">{error}</p>
                        <button onClick={fetchRequisitions} className="btn btn-primary">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="employee-dashboard">
            <div className="dashboard-header">
                <div className="flex-between">
                    <div>
                        <h1>{getGreeting()}, {user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Employee'}!</h1>
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
                    <div className="card-content">
                        <h3>My Requests</h3>
                        <div className="card-value">{stats.total}</div>
                        <div className="card-change">This month: +{stats.thisMonth}</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-content">
                        <h3>Pending</h3>
                        <div className="card-value" style={{ color: '#eab308' }}>{stats.pending}</div>
                        <div className="card-change">Awaiting approval</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-content">
                        <h3>Approved</h3>
                        <div className="card-value" style={{ color: '#22c55e' }}>{stats.approved}</div>
                        <div className="card-change">{stats.approvalRate}% approval rate</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-content">
                        <h3>Rejected</h3>
                        <div className="card-value" style={{ color: '#ef4444' }}>{stats.rejected}</div>
                        <div className="card-change">Need review</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Requests Section */}
                <div className="dashboard-section">
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h2>My Requests</h2>
                        <div className="view-toggle">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                            >
                                Grid
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters-section">
                        <div className="search-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search my requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button
                                    className="clear-search"
                                    onClick={() => setSearchTerm("")}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="sort-controls">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="status">Sort by Status</option>
                                <option value="priority">Sort by Priority</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                                className="sort-order-btn"
                            >
                                {sortOrder === "desc" ? "↓" : "↑"}
                            </button>
                        </div>
                    </div>

                    <div className="status-filters">
                        {["All", "Pending", "Approved", "Rejected"].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`status-filter-btn ${filter === s ? 'active' : ''}`}
                            >
                                {s}
                                {s !== "All" && (
                                    <span className="filter-count">
                                        ({s === "Pending" ? stats.pending : s === "Approved" ? stats.approved : stats.rejected})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Requests List */}
                    <div className="requests-list">
                        {viewMode === "list" ? (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title / Items</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8">
                                                    <div className="empty-state-small">
                                                        <p>No requests found</p>
                                                        <p className="text-sm text-secondary">Create your first requisition</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((r) => (
                                                <tr
                                                    key={r._id}
                                                    className="cursor-pointer"
                                                    onClick={() => setSelectedRequest(r)}
                                                >
                                                    <td>
                                                        <span className="request-id">
                                                            {r.requestNumber || r._id?.slice(-8)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="request-title">
                                                            {r.title || r.itemName || "Untitled"}
                                                        </div>
                                                        {r.items && r.items.length > 0 && (
                                                            <div className="request-subtitle">
                                                                {r.items.length} item(s) • {formatTotalAmount(getTotalAmount(r))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${badgeClass(r.status)}`}>
                                                            {r.status || "Pending"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {r.priority && (
                                                            <span className={`badge ${priorityClass(r.priority)}`}>
                                                                {r.priority}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="text-secondary text-sm">{daysAgoLabel(r.createdAt)}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid-view">
                                {filtered.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <p className="text-secondary font-medium">No requests found</p>
                                        <p className="text-sm text-secondary mt-1">Create your first requisition</p>
                                    </div>
                                ) : (
                                    filtered.map((r) => (
                                        <div
                                            key={r._id}
                                            className="grid-card"
                                            onClick={() => setSelectedRequest(r)}
                                        >
                                            <div className="flex-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{r.title || r.itemName || "Untitled"}</h3>
                                                    <p className="text-xs text-secondary mt-1">
                                                        ID: {r.requestNumber || r._id?.slice(-8)}
                                                    </p>
                                                </div>
                                                {r.priority && (
                                                    <span className={`badge ${priorityClass(r.priority)}`}>
                                                        {r.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid-card-details">
                                                <div className="detail-item">
                                                    <span>Items:</span>
                                                    <strong>{getItemCount(r)}</strong>
                                                </div>
                                                <div className="detail-item">
                                                    <span>Amount:</span>
                                                    <strong>{formatTotalAmount(getTotalAmount(r))}</strong>
                                                </div>
                                            </div>
                                            <div className="flex-between mt-3">
                                                <span className={`badge ${badgeClass(r.status)}`}>
                                                    {r.status || "Pending"}
                                                </span>
                                                <span className="text-xs text-secondary">
                                                    {daysAgoLabel(r.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {filtered.length > 0 && (
                        <div className="table-footer">
                            <span>Showing {filtered.length} of {requisitions.length} requests</span>
                            <div className="flex-center gap-2">
                                <span className="text-primary font-medium">{stats.approvalRate}%</span>
                                <span className="text-secondary">approval rate</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="dashboard-sidebar">
                    {/* Summary Card */}
                    <div className="dashboard-section">
                        <h2>My Summary</h2>
                        <div className="summary-stats">
                            <div className="summary-item">
                                <span>Total Spent</span>
                                <strong>{formatTotalAmount(requisitions.reduce((sum, r) => sum + getTotalAmount(r), 0))}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Average Request</span>
                                <strong>{formatTotalAmount(requisitions.reduce((sum, r) => sum + getTotalAmount(r), 0) / (requisitions.length || 1))}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Pending Value</span>
                                <strong>{formatTotalAmount(requisitions.filter(r => r.status === "Pending").reduce((sum, r) => sum + getTotalAmount(r), 0))}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Card */}
                    <div className="dashboard-section">
                        <div className="flex-between mb-4">
                            <h2>My Activity</h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                                    className="calendar-nav-btn"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                                    className="calendar-nav-btn"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div className="calendar-month">
                            <h3>
                                {calDate.toLocaleString("default", { month: "long", year: "numeric" })}
                            </h3>
                        </div>

                        <div className="calendar-grid">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                                <div key={i} className="calendar-weekday">
                                    {d}
                                </div>
                            ))}
                            {renderCal()}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="dashboard-section">
                        <h2>Recent Activity</h2>
                        <div className="activity-list">
                            {filtered.slice(0, 5).map((r) => (
                                <div key={r._id} className="activity-item">
                                    <div className={`activity-dot status-${r.status?.toLowerCase() || 'pending'}`}></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{r.title || r.itemName || "Untitled"}</p>
                                        <p className="text-xs text-secondary">{daysAgoLabel(r.createdAt)}</p>
                                    </div>
                                    <span className={`badge ${badgeClass(r.status)}`}>
                                        {r.status || "Pending"}
                                    </span>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <p className="text-secondary text-sm text-center">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Details Modal */}
            {selectedRequest && (
                <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold">Request Details</h3>
                            <button onClick={() => setSelectedRequest(null)} className="modal-close">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="details-grid">
                                <div>
                                    <label className="detail-label">Request ID</label>
                                    <p className="font-mono text-sm">{selectedRequest.requestNumber || selectedRequest._id}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Status</label>
                                    <p><span className={`badge ${badgeClass(selectedRequest.status)}`}>{selectedRequest.status || "Pending"}</span></p>
                                </div>
                                <div>
                                    <label className="detail-label">Title</label>
                                    <p className="font-medium">{selectedRequest.title || selectedRequest.itemName || "Untitled"}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Priority</label>
                                    <p>{selectedRequest.priority ? (
                                        <span className={`badge ${priorityClass(selectedRequest.priority)}`}>
                                            {selectedRequest.priority}
                                        </span>
                                    ) : "Not set"}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Total Amount</label>
                                    <p className="font-medium text-primary">{formatTotalAmount(getTotalAmount(selectedRequest))}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Items Count</label>
                                    <p>{getItemCount(selectedRequest)}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Created</label>
                                    <p>{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : "N/A"}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Last Updated</label>
                                    <p>{selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : "N/A"}</p>
                                </div>
                            </div>

                            {/* Items List */}
                            {selectedRequest.items && selectedRequest.items.length > 0 && (
                                <div className="mt-4">
                                    <label className="detail-label">Items Requested</label>
                                    <div className="items-list">
                                        <table className="items-table-modal">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Quantity</th>
                                                    <th>Unit</th>
                                                    <th>Unit Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedRequest.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.itemName}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td>{item.unit}</td>
                                                        <td className="text-right">{formatTotalAmount(item.unitPrice)}</td>
                                                        <td className="text-right">{formatTotalAmount(item.totalPrice)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.notes && (
                                <div className="mt-4">
                                    <label className="detail-label">Notes</label>
                                    <p className="text-secondary mt-1">{selectedRequest.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedRequest(null)} className="btn btn-primary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}