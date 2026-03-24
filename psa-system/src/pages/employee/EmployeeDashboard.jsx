import React, { useEffect, useMemo, useState, useCallback } from "react";

// Simple icon components without external dependencies
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const IconUser = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [calDate, setCalDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [viewMode, setViewMode] = useState("list");

    // FETCH FROM DATABASE
    const fetchRequisitions = useCallback(async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequisitions();
    }, [fetchRequisitions]);

    // STATS with trends
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
            averageProcessingTime: "2.4 days",
        };
    }, [requisitions]);

    // FILTERED, SORTED, AND SEARCHED
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

        // Sorting
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

    // Notifications
    const notifications = useMemo(() => {
        const pendingRequisitions = requisitions.filter(r => r.status === "Pending");
        const urgentRequisitions = requisitions.filter(r => r.priority === "high" && r.status === "Pending");
        const recentlyApproved = requisitions.filter(r => {
            const date = new Date(r.createdAt);
            const daysDiff = (new Date() - date) / 86400000;
            return r.status === "Approved" && daysDiff <= 1;
        });

        return [
            ...urgentRequisitions.slice(0, 2).map(r => ({
                id: r._id,
                type: "urgent",
                message: `Urgent: ${r.title || r.itemName} requires immediate attention`,
                time: "Just now",
            })),
            ...pendingRequisitions.slice(0, 3).map(r => ({
                id: r._id,
                type: "pending",
                message: `${r.title || r.itemName} is pending approval`,
                time: daysAgoLabel(r.createdAt),
            })),
            ...recentlyApproved.slice(0, 2).map(r => ({
                id: r._id,
                type: "approved",
                message: `${r.title || r.itemName} has been approved`,
                time: "Recently",
            }))
        ];
    }, [requisitions]);

    // CALENDAR FUNCTIONS
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
                <div key={`p${i}`} className="text-gray-400 text-center py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                    {prevDays - i}
                </div>
            );
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
            const hasEvent = requisitions.some(r => r.createdAt?.slice(0, 10) === ds);
            const isToday = today.getDate() === i && today.getMonth() === calDate.getMonth() && today.getFullYear() === calDate.getFullYear();

            let dayClass = "text-center py-2 text-sm relative cursor-pointer hover:scale-105 transition-all duration-200";

            if (isToday) {
                dayClass += " bg-[#023e8a] text-white hover:bg-[#023e8a]/90 font-semibold shadow-lg rounded-lg";
            } else if (hasEvent) {
                dayClass += " bg-[#023e8a]/10 text-[#023e8a] font-medium hover:bg-[#023e8a]/20 rounded-lg";
            } else {
                dayClass += " hover:bg-gray-50 rounded-lg";
            }

            days.push(
                <div key={i} className={dayClass}>
                    {i}
                    {hasEvent && !isToday && (
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#023e8a] rounded-full animate-pulse" />
                    )}
                </div>
            );
        }

        const rem = 42 - days.length;
        for (let i = 1; i <= rem; i++) {
            days.push(
                <div key={`n${i}`} className="text-gray-400 text-center py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                    {i}
                </div>
            );
        }

        return days;
    };

    const badgeClass = (status) => {
        const baseClass = "px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1";
        switch (status?.toLowerCase()) {
            case 'pending':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'approved':
                return `${baseClass} bg-green-100 text-green-800`;
            case 'rejected':
                return `${baseClass} bg-red-100 text-red-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const priorityClass = (priority) => {
        const baseClass = "px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1";
        switch (priority?.toLowerCase()) {
            case 'high':
                return `${baseClass} bg-red-100 text-red-800`;
            case 'medium':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'low':
                return `${baseClass} bg-green-100 text-green-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
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

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-linear-to-br from-gray-50 to-white">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#023e8a]/20 border-t-[#023e8a] rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
                    <p className="text-sm text-gray-400 mt-1">Fetching your latest requests</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 shadow-sm shrink-0">
                <div className="px-6 sm:px-8 lg:px-10 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-linear-to-br from-[#023e8a] to-[#023e8a]/80 rounded-lg flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Request Management</h1>
                                    <p className="text-xs text-gray-500">Track and manage all your requisitions</p>
                                </div>
                            </div>

                            {/* Quick Stats Badges */}
                            <div className="hidden md:flex items-center space-x-2 ml-4">
                                <div className="px-2 py-1 bg-green-50 rounded-md border border-green-200">
                                    <span className="text-xs font-medium text-green-700">
                                        {stats.approvalRate}% Approval Rate
                                    </span>
                                </div>
                                <div className="px-2 py-1 bg-[#023e8a]/10 rounded-md border border-[#023e8a]/20">
                                    <span className="text-xs font-medium text-[#023e8a]">
                                        Avg. {stats.averageProcessingTime}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Last Updated */}
                            <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                                <IconClock />
                                <span>Updated {formatDateTime(lastUpdated)}</span>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={fetchRequisitions}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
                                title="Refresh data"
                            >
                                <IconRefresh />
                            </button>

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
                                title="Export data"
                            >
                                <IconDownload />
                            </button>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                                >
                                    <IconBell />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                        <div className="p-3 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                                            <p className="text-xs text-gray-500 mt-1">{notifications.length} new updates</p>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.map(notification => (
                                                <div key={notification.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors">
                                                    <div className="flex items-start space-x-2">
                                                        <div className={`w-2 h-2 mt-1.5 rounded-full ${notification.type === 'urgent' ? 'bg-red-500' :
                                                            notification.type === 'approved' ? 'bg-green-500' : 'bg-yellow-500'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-700">{notification.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 sm:px-8 lg:px-10 py-6">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">Total Requests</span>
                                <svg className="w-5 h-5 text-[#023e8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">This month: +{stats.thisMonth}</p>
                                <div className={`text-xs flex items-center gap-1 ${stats.thisMonth > stats.lastMonth ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.thisMonth > stats.lastMonth ? <IconTrendingUp /> : <IconTrendingDown />}
                                    {stats.lastMonth ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(0) : 0}%
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">Pending</span>
                                <IconClock />
                            </div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">Approved</span>
                                <IconCheckCircle />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.total ? (stats.approved / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">Rejected</span>
                                <IconXCircle />
                            </div>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${stats.total ? (stats.rejected / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Requests Table */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-150 overflow-hidden">
                            {/* Table Header with Controls */}
                            <div className="p-5 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white shrink-0">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-[#023e8a]/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-[#023e8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">Manage and track your submissions</p>
                                        </div>
                                    </div>

                                    {/* View Toggle */}
                                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-[#023e8a]" : "text-gray-600 hover:bg-gray-200"}`}
                                        >
                                            List
                                        </button>
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-[#023e8a]" : "text-gray-600 hover:bg-gray-200"}`}
                                        >
                                            Grid
                                        </button>
                                    </div>
                                </div>

                                {/* Search and Filters */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex-1 min-w-50 relative">
                                        <IconSearch />
                                        <input
                                            type="text"
                                            placeholder="Search by title or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#023e8a]/20 focus:border-[#023e8a] transition-all"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#023e8a]/20 focus:border-[#023e8a] bg-white"
                                        >
                                            <option value="date">Sort by Date</option>
                                            <option value="status">Sort by Status</option>
                                            <option value="priority">Sort by Priority</option>
                                        </select>

                                        <button
                                            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            {sortOrder === "desc" ? "↓" : "↑"}
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Chips */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {["All", "Pending", "Approved", "Rejected"].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFilter(s)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${filter === s
                                                ? "bg-[#023e8a] text-white shadow-sm"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            {s}
                                            {s !== "All" && (
                                                <span className="ml-1.5 text-xs opacity-75">
                                                    ({s === "Pending" ? stats.pending : s === "Approved" ? stats.approved : stats.rejected})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Table Content */}
                            <div className="overflow-y-auto flex-1">
                                {viewMode === "list" ? (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filtered.map((r) => (
                                                <tr
                                                    key={r._id}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedRequest(r)}
                                                >
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className="text-sm font-mono text-[#023e8a] font-medium">
                                                            {r.requestNumber || r._id?.slice(-6)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {r.title || r.itemName}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className={badgeClass(r.status)}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className={priorityClass(r.priority)}>
                                                            {r.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className="text-sm text-gray-500">{daysAgoLabel(r.createdAt)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                                        {filtered.map((r) => (
                                            <div
                                                key={r._id}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-[#023e8a]/30"
                                                onClick={() => setSelectedRequest(r)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900">{r.title || r.itemName}</h3>
                                                        <p className="text-xs text-gray-500 mt-1">ID: {r.requestNumber || r._id?.slice(-6)}</p>
                                                    </div>
                                                    <span className={priorityClass(r.priority)}>
                                                        {r.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className={badgeClass(r.status)}>
                                                        {r.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{daysAgoLabel(r.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filtered.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-5xl mb-3">📭</div>
                                        <p className="text-gray-500 font-medium">No requests found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                                    </div>
                                )}
                            </div>

                            {/* Table Footer */}
                            {filtered.length > 0 && (
                                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center shrink-0">
                                    <span>Showing {filtered.length} of {requisitions.length} requests</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[#023e8a] font-medium">{stats.approvalRate}%</span>
                                        <span className="text-gray-400">approval rate</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar - Calendar & Insights */}
                        <div className="space-y-6">
                            {/* Calendar Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <IconCalendar />
                                        <h3 className="font-semibold text-gray-900">Activity Calendar</h3>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <IconChevronLeft />
                                        </button>
                                        <button
                                            onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <IconChevronRight />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-center mb-3">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {calDate.toLocaleString("default", { month: "long", year: "numeric" })}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                                        <div key={i} className="text-center py-1 text-xs font-semibold text-[#023e8a]">
                                            {d}
                                        </div>
                                    ))}
                                    {renderCal()}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-[#023e8a]/10 rounded-lg p-2 text-center">
                                        <p className="text-[#023e8a] font-semibold">
                                            {requisitions.filter(r => {
                                                const date = new Date(r.createdAt);
                                                return date.getMonth() === calDate.getMonth() && date.getFullYear() === calDate.getFullYear();
                                            }).length}
                                        </p>
                                        <p className="text-gray-500 text-xs">This month</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-2 text-center">
                                        <p className="text-green-600 font-semibold">{stats.approvalRate}%</p>
                                        <p className="text-gray-500 text-xs">Approval rate</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Feed */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
                                <div className="space-y-3">
                                    {filtered.slice(0, 5).map((r) => (
                                        <div key={r._id} className="flex items-start space-x-2 text-sm">
                                            <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#023e8a]"></div>
                                            <div className="flex-1">
                                                <p className="text-gray-700">{r.title || r.itemName}</p>
                                                <p className="text-xs text-gray-400">{daysAgoLabel(r.createdAt)}</p>
                                            </div>
                                            <span className={badgeClass(r.status)}>
                                                {r.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRequest(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                                <IconXCircle />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Request ID</label>
                                    <p className="font-mono text-sm">{selectedRequest.requestNumber || selectedRequest._id}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Status</label>
                                    <p className={badgeClass(selectedRequest.status)}>{selectedRequest.status}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Title</label>
                                    <p className="font-medium">{selectedRequest.title || selectedRequest.itemName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Priority</label>
                                    <p className={priorityClass(selectedRequest.priority)}>{selectedRequest.priority}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Created</label>
                                    <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Last Updated</label>
                                    <p>{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                            {selectedRequest.notes && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Notes</label>
                                    <p className="text-gray-700 mt-1">{selectedRequest.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
                            <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-[#023e8a] text-white rounded-lg hover:bg-[#023e8a]/90 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}