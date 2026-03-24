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
    const [filterStatus, setFilterStatus] = useState('pending');
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

    const extractId = (id) => {
        if (!id) return null;
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id;
        if (typeof id === 'object' && id.id) return id.id;
        return null;
    };

    const fetchRequisitions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

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

            let requisitionsArray = [];
            if (data.data && Array.isArray(data.data)) {
                requisitionsArray = data.data;
            } else if (data.requests && Array.isArray(data.requests)) {
                requisitionsArray = data.requests;
            } else if (Array.isArray(data)) {
                requisitionsArray = data;
            }

            const processedRequisitions = requisitionsArray.map(req => {
                let requesterId = null;
                let requesterName = req.requesterName || req.requester?.name || null;
                let requesterDepartment = req.department || req.requester?.department || null;

                if (req.requesterId) {
                    requesterId = extractId(req.requesterId);
                } else if (req.requester && req.requester._id) {
                    requesterId = req.requester._id;
                    requesterName = req.requester.name || requesterName;
                    requesterDepartment = req.requester.department || requesterDepartment;
                } else if (req.userId) {
                    requesterId = extractId(req.userId);
                }

                return {
                    ...req,
                    requesterId: requesterId,
                    requesterName: requesterName,
                    department: req.department || requesterDepartment
                };
            });

            const requisitionsWithEmployeeIds = await Promise.all(
                processedRequisitions.map(async (req) => {
                    if (req.requesterId && req.requesterId !== 'N/A') {
                        try {
                            const employeeResponse = await fetch(`${API_BASE_URL}/api/users/${req.requesterId}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (employeeResponse.ok) {
                                const employeeData = await employeeResponse.json();
                                return {
                                    ...req,
                                    employeeId: employeeData.employeeId,
                                    employeeName: employeeData.fullName,
                                    employeeDepartment: employeeData.department,
                                    employeeData: employeeData
                                };
                            }
                        } catch (err) {
                            console.error(`Error fetching employee for ${req.requesterId}:`, err);
                        }
                    }
                    return req;
                })
            );

            setRequisitions(requisitionsWithEmployeeIds);

            const pending = requisitionsWithEmployeeIds.filter(req => req.status?.toLowerCase() === 'pending').length;
            const approved = requisitionsWithEmployeeIds.filter(req => req.status?.toLowerCase() === 'approved').length;
            const rejected = requisitionsWithEmployeeIds.filter(req => req.status?.toLowerCase() === 'rejected').length;
            const issued = requisitionsWithEmployeeIds.filter(req => req.status?.toLowerCase() === 'issued').length;

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

    const handleApprove = async () => {
        if (!selectedRequest) return;

        try {
            setProcessingId(selectedRequest._id);
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/api/requisitions/${selectedRequest._id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    remarks: remarks,
                    approvedBy: user?._id,
                    approvedAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to approve requisition');
            }

            await fetchRequisitions();

            setShowApproveModal(false);
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setRemarks('');

            alert('✅ Requisition approved successfully! It is now ready for Admin to issue.');
        } catch (error) {
            console.error('Error approving requisition:', error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setProcessingId(selectedRequest._id);
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/api/requisitions/${selectedRequest._id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    remarks: remarks,
                    rejectedBy: user?._id,
                    rejectedAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to reject requisition');
            }

            await fetchRequisitions();

            setShowRejectModal(false);
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setRemarks('');

            alert('❌ Requisition rejected successfully!');
        } catch (error) {
            console.error('Error rejecting requisition:', error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getEmployeeDisplayId = (requisition) => {
        if (requisition.employeeId) {
            return requisition.employeeId;
        }
        if (requisition.employeeData?.employeeId) {
            return requisition.employeeData.employeeId;
        }
        if (requisition.requesterId && typeof requisition.requesterId === 'string') {
            return requisition.requesterId;
        }
        return 'N/A';
    };

    const filteredRequisitions = requisitions.filter(req => {
        const matchesStatus = filterStatus === 'all' || req.status?.toLowerCase() === filterStatus.toLowerCase();
        const matchesSearch = !searchTerm ||
            req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.items?.some(item => item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesStatus && matchesSearch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequisitions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);

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

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || '';

        switch (statusLower) {
            case 'pending':
                return <span className="badge badge-pending">Pending</span>;
            case 'approved':
                return <span className="badge badge-approved">Approved</span>;
            case 'rejected':
                return <span className="badge badge-rejected">Rejected</span>;
            case 'issued':
                return <span className="badge badge-issued">Issued</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (loading && requisitions.length === 0) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-lg"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading requisitions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
            <div className="container-custom py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="gradient-text">SuperAdmin - Request Approval</h1>
                    <p className="text-gray-600 mt-2">
                        Review and approve pending requisitions. Approved requests will be queued for Admin to issue.
                    </p>
                    {user && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Logged in as: <strong>{user.fullName}</strong> (Role: {user.role})</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className="card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">⏳</span>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Approved</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">✅</span>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Rejected</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                            </div>
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">❌</span>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Issued</p>
                                <p className="text-2xl font-bold text-green-600">{stats.issued}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">📦</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="card p-5 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-50">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by requester, department, or item..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['pending', 'approved', 'rejected', 'issued', 'all'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {status === 'all' ? 'All' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
                        ⚠️ {error}
                    </div>
                )}

                {/* Requisitions Table */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">
                            Requisitions ({filteredRequisitions.length})
                        </h2>
                    </div>

                    {filteredRequisitions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-5xl mb-4">📭</div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No Requisitions Found</h3>
                            <p className="text-gray-600">
                                {searchTerm ? 'Try adjusting your search or filters' : 'No requisitions match the selected status'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Requester</th>
                                            <th>Department</th>
                                            <th>Items</th>
                                            <th className="text-right">Total Qty</th>
                                            <th className="text-center">Status</th>
                                            <th>Date</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(req => {
                                            const totalQuantity = req.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                                            const isPending = req.status?.toLowerCase() === 'pending';
                                            const employeeDisplayId = getEmployeeDisplayId(req);

                                            return (
                                                <tr
                                                    key={req._id}
                                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setShowDetailsModal(true);
                                                    }}
                                                >
                                                    <td>
                                                        <div className="font-medium text-gray-900">
                                                            {req.requesterName || req.requester?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Employee ID: {employeeDisplayId}
                                                        </div>
                                                    </td>
                                                    <td className="text-gray-600">
                                                        {req.department || 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div className="font-medium text-gray-900">{req.items?.length || 0} item(s)</div>
                                                        <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                                                            {req.items?.map(i => i.itemName).slice(0, 2).join(', ')}
                                                            {req.items?.length > 2 && '...'}
                                                        </div>
                                                    </td>
                                                    <td className="text-right font-medium text-gray-900">
                                                        {totalQuantity}
                                                    </td>
                                                    <td className="text-center">
                                                        {getStatusBadge(req.status)}
                                                    </td>
                                                    <td className="text-sm text-gray-600">
                                                        {formatDate(req.createdAt || req.dateRequested)}
                                                    </td>
                                                    <td className="text-center">
                                                        {isPending && (
                                                            <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequest(req);
                                                                        setShowApproveModal(true);
                                                                    }}
                                                                    className="btn btn-primary"
                                                                    disabled={processingId === req._id}
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequest(req);
                                                                        setShowRejectModal(true);
                                                                    }}
                                                                    className="btn btn-danger"
                                                                    disabled={processingId === req._id}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {!isPending && (
                                                            <span className="text-xs text-gray-400">Processed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequisitions.length)} of {filteredRequisitions.length} requisitions
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="btn btn-secondary"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1 text-sm">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="btn btn-secondary"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Requisition Details</h2>
                                    <div className="flex items-center gap-2 mt-2">
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
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3">Requester Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-medium">{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Employee ID</p>
                                        <p className="font-medium">{getEmployeeDisplayId(selectedRequest)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="font-medium">{selectedRequest.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Date Requested</p>
                                        <p className="font-medium">{formatDate(selectedRequest.createdAt || selectedRequest.dateRequested)}</p>
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
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Category</th>
                                                <th>Unit</th>
                                                <th className="text-right">Quantity</th>
                                                <th className="text-right">Unit Price</th>
                                                <th className="text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedRequest.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.itemName}</td>
                                                    <td>{item.category || '—'}</td>
                                                    <td>{item.unit || '—'}</td>
                                                    <td className="text-right font-medium">{item.quantity}</td>
                                                    <td className="text-right">
                                                        {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '—'}
                                                    </td>
                                                    <td className="text-right font-semibold text-primary-600">
                                                        {item.totalPrice ? `$${item.totalPrice.toFixed(2)}` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 font-medium">
                                                <td colSpan="3" className="text-right">Totals:</td>
                                                <td className="text-right">
                                                    {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                                                </td>
                                                <td className="text-right">—</td>
                                                <td className="text-right font-bold text-primary-600">
                                                    ${selectedRequest.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2) || '0.00'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedRequest.status?.toLowerCase() === 'pending' && (
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowRejectModal(true);
                                        }}
                                        className="btn btn-danger"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowApproveModal(true);
                                        }}
                                        className="btn btn-primary"
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
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Approve Requisition</h2>
                                    <p className="text-sm text-gray-500">Review the details before approving</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Approve requisition from <span className="font-medium text-gray-900">{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Employee ID: {getEmployeeDisplayId(selectedRequest)} | Items: {selectedRequest.items?.length || 0} | Total Qty: {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="3"
                                    className="input"
                                    placeholder="Add any remarks..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setRemarks('');
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={processingId === selectedRequest._id}
                                    className="btn btn-primary"
                                >
                                    {processingId === selectedRequest._id ? (
                                        <>
                                            <span className="spinner-sm"></span>
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
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">❌</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Reject Requisition</h2>
                                    <p className="text-sm text-gray-500">Please provide a reason for rejection</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Reject requisition from <span className="font-medium text-gray-900">{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Employee ID: {getEmployeeDisplayId(selectedRequest)}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="3"
                                    className="input"
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
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!remarks || processingId === selectedRequest._id}
                                    className="btn btn-danger"
                                >
                                    {processingId === selectedRequest._id ? (
                                        <>
                                            <span className="spinner-sm"></span>
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