import React, { useEffect, useMemo, useState, useCallback } from "react";
import './EmployeeDashboard.css';

// Simple icon components
const IconClock = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconCheckCircle = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconXCircle = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconSearch = () => (
    <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IconCalendar = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const IconRefresh = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const IconDownload = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const IconBell = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const IconChevronLeft = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const IconChevronRight = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const IconTrendingUp = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const IconTrendingDown = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const IconUser = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const daysAgoLabel = (date) => {
    if (!date) return "N/A";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - d) / 86400000);

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
};

const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

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
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [viewMode, setViewMode] = useState("list");
    const [sidebarWidth, setSidebarWidth] = useState(0);

    // Detect sidebar width
    useEffect(() => {
        const updateSidebarWidth = () => {
            const sidebar = document.querySelector('.sidebar, .side-menu, [class*="sidebar"], [class*="side-menu"]');
            if (sidebar) {
                const width = sidebar.offsetWidth;
                setSidebarWidth(width);
            } else {
                setSidebarWidth(0);
            }
        };

        updateSidebarWidth();
        window.addEventListener('resize', updateSidebarWidth);

        const observer = new MutationObserver(updateSidebarWidth);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('resize', updateSidebarWidth);
            observer.disconnect();
        };
    }, []);

    // Get user data
    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            // navigate('/login'); - Add navigation if needed
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }, []);

    const fetchRequisitions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/requisitions", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch requisitions");
            const data = await response.json();
            setRequisitions(Array.isArray(data) ? data : []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Fetch requisitions error:", error);
            setError('Failed to load requisitions. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequisitions();
    }, [fetchRequisitions]);

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = requisitions.filter(r => {
            const date = new Date(r.createdAt);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const lastMonth = requisitions.filter(r => {
            const date = new Date(r.createdAt);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
            return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
        });

        const pending = requisitions.filter(r => r.status === "Pending");
        const approved = requisitions.filter(r => r.status === "Approved");
        const rejected = requisitions.filter(r => r.status === "Rejected");

        return {
            total: requisitions.length,
            pending: pending.length,
            approved: approved.length,
            rejected: rejected.length,
            thisMonth: thisMonth.length,
            lastMonth: lastMonth.length,
            approvalRate: requisitions.length ? ((approved.length / requisitions.length) * 100).toFixed(1) : 0,
        };
    }, [requisitions]);

    const filtered = useMemo(() => {
        let result = requisitions;

        if (filter !== "All") {
            result = result.filter(r => r.status === filter);
        }

        if (searchTerm) {
            result = result.filter(r =>
                (r.title || r.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.requestNumber || r._id || "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        result = [...result].sort((a, b) => {
            if (sortBy === "date") {
                return sortOrder === "desc"
                    ? new Date(b.createdAt) - new Date(a.createdAt)
                    : new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (sortBy === "status") {
                return sortOrder === "desc"
                    ? (b.status || "").localeCompare(a.status || "")
                    : (a.status || "").localeCompare(b.status || "");
            }
            if (sortBy === "priority") {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return sortOrder === "desc"
                    ? (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
                    : (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
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
            const hasEvent = requisitions.some(r => r.createdAt?.slice(0, 10) === ds);
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

    const handleExport = () => {
        const data = JSON.stringify(filtered, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `requisitions_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLogout = () => {
        localStorage.clear();
        // navigate('/login'); - Add navigation if needed
    };

    const handleProfile = () => {
        // navigate('/profile'); - Add navigation if needed
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
            <div className="employee-dashboard" style={{ marginLeft: sidebarWidth }}>
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
            <div className="employee-dashboard" style={{ marginLeft: sidebarWidth }}>
                <div className="flex-center" style={{ minHeight: '100vh' }}>
                    <div className="text-center">
                        <div className="text-danger" style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
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
        <div className="employee-dashboard" style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}>
            <div className="dashboard-header">
                <div className="flex-between">
                    <div>
                        <h1>{getGreeting()}, {user?.fullName?.split(' ')[0] || 'Employee'}!</h1>
                        <p>
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="profile-menu">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex-center gap-3 hover-bg-secondary px-3 py-2 rounded-lg transition-all"
                        >
                            <div className="card-icon" style={{ background: 'rgba(2, 62, 138, 0.1)' }}>
                                <span style={{ fontSize: '1.25rem' }}>
                                    {user?.fullName?.charAt(0) || 'E'}
                                </span>
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="font-medium text-primary">{user?.fullName || 'Employee'}</p>
                                <p className="text-xs text-secondary capitalize">{user?.role || 'employee'}</p>
                            </div>
                            <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <div className="profile-dropdown-header">
                                    <p className="font-semibold">{user?.fullName}</p>
                                    <p className="text-sm text-secondary mt-1">{user?.email}</p>
                                    <p className="text-xs text-secondary mt-1 capitalize">{user?.role}</p>
                                </div>
                                <div className="profile-dropdown-actions">
                                    <button onClick={handleProfile} className="dropdown-item">
                                        My Profile
                                    </button>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="profile-dropdown-actions">
                                    <button onClick={handleLogout} className="dropdown-item text-danger">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="dashboard-cards">
                <div className="card">
                    <div className="card-icon">
                        <span>📋</span>
                    </div>
                    <div className="card-content">
                        <h3>Total Requests</h3>
                        <div className="card-value">{stats.total}</div>
                        <div className="card-change">This month: +{stats.thisMonth}</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-icon" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                        <span>⏳</span>
                    </div>
                    <div className="card-content">
                        <h3>Pending</h3>
                        <div className="card-value" style={{ color: '#eab308' }}>{stats.pending}</div>
                        <div className="card-change">Awaiting approval</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                        <span>✅</span>
                    </div>
                    <div className="card-content">
                        <h3>Approved</h3>
                        <div className="card-value" style={{ color: '#22c55e' }}>{stats.approved}</div>
                        <div className="card-change">{stats.approvalRate}% approval rate</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <span>❌</span>
                    </div>
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
                        <div className="flex gap-2">
                            <button
                                onClick={fetchRequisitions}
                                className="icon-button"
                                title="Refresh"
                            >
                                <IconRefresh />
                            </button>
                            <button
                                onClick={handleExport}
                                className="icon-button"
                                title="Export"
                            >
                                <IconDownload />
                            </button>
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
                    </div>

                    {/* Filters */}
                    <div className="filters-section">
                        <div className="search-wrapper">
                            <IconSearch />
                            <input
                                type="text"
                                placeholder="Search by title or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
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
                                            <th>Title</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((r) => (
                                            <tr
                                                key={r._id}
                                                className="cursor-pointer"
                                                onClick={() => setSelectedRequest(r)}
                                            >
                                                <td>
                                                    <span className="request-id">
                                                        {r.requestNumber || r._id?.slice(-6)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="request-title">
                                                        {r.title || r.itemName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${badgeClass(r.status)}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${priorityClass(r.priority)}`}>
                                                        {r.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-secondary text-sm">{daysAgoLabel(r.createdAt)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid-view">
                                {filtered.map((r) => (
                                    <div
                                        key={r._id}
                                        className="grid-card"
                                        onClick={() => setSelectedRequest(r)}
                                    >
                                        <div className="flex-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-medium">{r.title || r.itemName}</h3>
                                                <p className="text-xs text-secondary mt-1">
                                                    ID: {r.requestNumber || r._id?.slice(-6)}
                                                </p>
                                            </div>
                                            <span className={`badge ${priorityClass(r.priority)}`}>
                                                {r.priority}
                                            </span>
                                        </div>
                                        <div className="flex-between mt-3">
                                            <span className={`badge ${badgeClass(r.status)}`}>
                                                {r.status}
                                            </span>
                                            <span className="text-xs text-secondary">{daysAgoLabel(r.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filtered.length === 0 && (
                            <div className="empty-state">
                                <div className="text-5xl mb-3">📭</div>
                                <p className="text-secondary font-medium">No requests found</p>
                                <p className="text-sm text-secondary mt-1">Try adjusting your search or filters</p>
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
                    {/* Calendar Card */}
                    <div className="dashboard-section">
                        <div className="flex-between mb-4">
                            <div className="flex-center gap-2">
                                <IconCalendar />
                                <h2>Activity Calendar</h2>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                                    className="calendar-nav-btn"
                                >
                                    <IconChevronLeft />
                                </button>
                                <button
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                                    className="calendar-nav-btn"
                                >
                                    <IconChevronRight />
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

                        <div className="calendar-stats">
                            <div className="stat-box primary">
                                <p className="stat-number">
                                    {requisitions.filter(r => {
                                        const date = new Date(r.createdAt);
                                        return date.getMonth() === calDate.getMonth() && date.getFullYear() === calDate.getFullYear();
                                    }).length}
                                </p>
                                <p className="stat-label">This month</p>
                            </div>
                            <div className="stat-box success">
                                <p className="stat-number">{stats.approvalRate}%</p>
                                <p className="stat-label">Approval rate</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="dashboard-section">
                        <h2>Recent Activity</h2>
                        <div className="activity-list">
                            {filtered.slice(0, 5).map((r) => (
                                <div key={r._id} className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{r.title || r.itemName}</p>
                                        <p className="text-xs text-secondary">{daysAgoLabel(r.createdAt)}</p>
                                    </div>
                                    <span className={`badge ${badgeClass(r.status)}`}>
                                        {r.status}
                                    </span>
                                </div>
                            ))}
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
                                ✕
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
                                    <p className={`badge ${badgeClass(selectedRequest.status)}`}>{selectedRequest.status}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Title</label>
                                    <p className="font-medium">{selectedRequest.title || selectedRequest.itemName}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Priority</label>
                                    <p className={`badge ${priorityClass(selectedRequest.priority)}`}>{selectedRequest.priority}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Created</label>
                                    <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="detail-label">Last Updated</label>
                                    <p>{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
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