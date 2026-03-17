import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RequestApproval = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        issued: 0
    });

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
            console.log('👤 Logged in user:', parsedUser);
            console.log('👤 User role:', parsedUser.role);

            // Check if user is SuperAdmin (case insensitive)
            const userRole = parsedUser.role?.toLowerCase();
            if (userRole !== 'superadmin') {
                alert(`Access denied. SuperAdmin only. Your role: ${parsedUser.role}`);
                navigate('/dashboard');
                return;
            }
            setUser(parsedUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/login');
        }
    }, [navigate]);

    // Fetch all requisitions for SuperAdmin
    const fetchRequisitions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            console.log('Fetching requisitions with token:', token ? 'Token exists' : 'No token');

            const response = await fetch(`${API_BASE_URL}/api/requisitions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch requisitions');
            }

            const data = await response.json();
            console.log('Requisitions response:', data);

            // Handle different response structures
            let requisitionsArray = [];
            if (data.data && Array.isArray(data.data)) {
                requisitionsArray = data.data;
            } else if (data.requests && Array.isArray(data.requests)) {
                requisitionsArray = data.requests;
            } else if (Array.isArray(data)) {
                requisitionsArray = data;
            }

            setRequisitions(requisitionsArray);

            // Calculate stats
            const pending = requisitionsArray.filter(req => req.status?.toLowerCase() === 'pending').length;
            const approved = requisitionsArray.filter(req => req.status?.toLowerCase() === 'approved').length;
            const rejected = requisitionsArray.filter(req => req.status?.toLowerCase() === 'rejected').length;
            const issued = requisitionsArray.filter(req => req.status?.toLowerCase() === 'issued').length;

            setStats({ pending, approved, rejected, issued });
            setError(null);
        } catch (error) {
            console.error('Error fetching requisitions:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequisitions();
    }, []);

    // Handle approve by SuperAdmin
    const handleApprove = async () => {
        if (!selectedRequest) return;

        try {
            setProcessingId(selectedRequest._id);
            const token = localStorage.getItem('token');

            console.log('Approving requisition:', selectedRequest._id);
            console.log('User role:', user?.role);
            console.log('Request payload:', { remarks });

            // Use the approve endpoint
            const response = await fetch(`${API_BASE_URL}/api/requisitions/${selectedRequest._id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    remarks: remarks
                })
            });

            console.log('Approve response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Approve error response:', errorData);
                throw new Error(errorData.message || 'Failed to approve requisition');
            }

            const result = await response.json();
            console.log('Approve success response:', result);

            // Refresh the list
            await fetchRequisitions();

            // Close modals
            setShowApproveModal(false);
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setRemarks('');

            // Show success message
            alert('Requisition approved successfully! It will now be available for Admin to issue.');
        } catch (error) {
            console.error('Error approving requisition:', error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    // Handle reject by SuperAdmin
    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setProcessingId(selectedRequest._id);
            const token = localStorage.getItem('token');

            console.log('Rejecting requisition:', selectedRequest._id);
            console.log('User role:', user?.role);
            console.log('Request payload:', { remarks });

            // Use the reject endpoint
            const response = await fetch(`${API_BASE_URL}/api/requisitions/${selectedRequest._id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    remarks: remarks
                })
            });

            console.log('Reject response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Reject error response:', errorData);
                throw new Error(errorData.message || 'Failed to reject requisition');
            }

            const result = await response.json();
            console.log('Reject success response:', result);

            // Refresh the list
            await fetchRequisitions();

            // Close modals
            setShowRejectModal(false);
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setRemarks('');

            // Show success message
            alert('Requisition rejected successfully!');
        } catch (error) {
            console.error('Error rejecting requisition:', error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    // Get only pending requisitions for the main table
    const pendingRequisitions = requisitions.filter(req =>
        req.status?.toLowerCase() === 'pending'
    );

    // Filter and search within pending requests
    const filteredRequisitions = pendingRequisitions.filter(req => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            req.requesterName?.toLowerCase().includes(searchLower) ||
            req.department?.toLowerCase().includes(searchLower) ||
            req.notes?.toLowerCase().includes(searchLower) ||
            req.items?.some(item => item.itemName?.toLowerCase().includes(searchLower))
        );
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequisitions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    // Get priority badge based on quantity
    const getPriorityBadge = (items) => {
        const totalItems = items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

        if (totalItems > 20) {
            return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">High</span>;
        } else if (totalItems > 10) {
            return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Medium</span>;
        }
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Low</span>;
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || '';

        const statusConfig = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-blue-100 text-blue-800',
            'rejected': 'bg-red-100 text-red-800',
            'issued': 'bg-green-100 text-green-800'
        };

        const colorClass = statusConfig[statusLower] || 'bg-gray-100 text-gray-800';

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {status || 'Unknown'}
            </span>
        );
    };

    if (loading && requisitions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading requisitions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">SuperAdmin - Request Approval</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve pending requisitions. Approved requests will be queued for Admin to issue.
                </p>
                {user && (
                    <p className="text-sm text-gray-500 mt-2">
                        Logged in as: {user.fullName} (Role: {user.role})
                    </p>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Issued</p>
                    <p className="text-2xl font-bold text-green-600">{stats.issued}</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search pending requests by requester, department, or item..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
                    ⚠️ {error}
                </div>
            )}

            {/* No Pending Requests Message */}
            {pendingRequisitions.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Requests</h3>
                    <p className="text-gray-600">
                        All requisitions have been processed. Check back later for new requests.
                    </p>
                </div>
            )}

            {/* Pending Requisitions Table */}
            {pendingRequisitions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">Pending Requisitions ({pendingRequisitions.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requester</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Qty</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Requested</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentItems.map(req => {
                                    const totalQuantity = req.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                                    return (
                                        <tr
                                            key={req._id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setSelectedRequest(req);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {req.requesterName || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {req.department || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900">{req.items?.length || 0} item(s)</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                                    {req.items?.map(i => i.itemName).join(', ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {totalQuantity}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getPriorityBadge(req.items)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(req.dateRequested)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setShowApproveModal(true);
                                                        }}
                                                        className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        disabled={processingId === req._id}
                                                    >
                                                        {processingId === req._id ? 'Processing...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setShowRejectModal(true);
                                                        }}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                        disabled={processingId === req._id}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredRequisitions.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequisitions.length)} of {filteredRequisitions.length} pending requisitions
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Requisition Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">Requested by: {selectedRequest.requesterName}</p>
                                    <div className="mt-2">
                                        {getStatusBadge(selectedRequest.status)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-2xl text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Requester Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-3">Requester Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-medium">{selectedRequest.requesterName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="font-medium">{selectedRequest.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Requester ID</p>
                                        <p className="font-medium">{selectedRequest.requesterId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Date Requested</p>
                                        <p className="font-medium">{formatDate(selectedRequest.dateRequested)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes/Purpose */}
                            {selectedRequest.notes && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Notes / Purpose</h3>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {selectedRequest.notes}
                                    </p>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Requested Items</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Item Name</th>
                                                <th className="px-4 py-2 text-left">Category</th>
                                                <th className="px-4 py-2 text-left">Unit</th>
                                                <th className="px-4 py-2 text-right">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedRequest.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{item.itemName}</td>
                                                    <td className="px-4 py-2">{item.category || '—'}</td>
                                                    <td className="px-4 py-2">{item.unit || '—'}</td>
                                                    <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-medium">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-2 text-right">Total Items:</td>
                                                <td className="px-4 py-2 text-right">
                                                    {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Actions - Only show if still pending */}
                            {selectedRequest.status?.toLowerCase() === 'pending' && (
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowRejectModal(true);
                                        }}
                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowApproveModal(true);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowApproveModal(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Requisition</h2>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to approve requisition from <span className="font-medium">{selectedRequest.requesterName}</span>?
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                After approval, this requisition will be queued for Admin to issue the items.
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="Add any remarks..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setRemarks('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={processingId === selectedRequest._id}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingId === selectedRequest._id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Approving...
                                        </>
                                    ) : (
                                        'Confirm Approval'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Requisition</h2>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to reject requisition from <span className="font-medium">{selectedRequest.requesterName}</span>?
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Reason for Rejection *</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="Please provide a reason..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRemarks('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!remarks || processingId === selectedRequest._id}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingId === selectedRequest._id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Rejecting...
                                        </>
                                    ) : (
                                        'Confirm Rejection'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestApproval;