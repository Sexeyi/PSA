import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RequestApproval.css';

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

            alert('Requisition approved successfully! It is now ready for Admin to issue.');
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

            alert('Requisition rejected successfully!');
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
            <div className="loading-container">
                <div className="loading-content">
                    <div className="spinner-large"></div>
                    <p className="loading-text">Loading requisitions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="request-approval-container">
            <div className="request-approval-wrapper">
                {/* Header */}
                <div className="request-header">
                    <h1 className="request-title">Request Approval</h1>
                    <p className="request-subtitle">
                        Review and approve pending requisitions. Approved requests will be queued for Admin to issue.
                    </p>
                    {user && (
                        <div className="user-info-badge">
                            <span>Logged in as: <strong>{user.fullName}</strong> (Role: {user.role})</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Pending</p>
                                <p className="stat-value stat-value-pending">{stats.pending}</p>
                            </div>
                            <div className={`stat-decoration stat-decoration-pending`}></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Approved</p>
                                <p className="stat-value stat-value-approved">{stats.approved}</p>
                            </div>
                            <div className={`stat-decoration stat-decoration-approved`}></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Rejected</p>
                                <p className="stat-value stat-value-rejected">{stats.rejected}</p>
                            </div>
                            <div className={`stat-decoration stat-decoration-rejected`}></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Issued</p>
                                <p className="stat-value stat-value-issued">{stats.issued}</p>
                            </div>
                            <div className={`stat-decoration stat-decoration-issued`}></div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="filters-card">
                    <div className="filters-wrapper">
                        <div className="search-wrapper">
                            <input
                                type="text"
                                placeholder="Search by requester, department, or item..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                            />
                        </div>
                        <div className="filter-buttons">
                            {['pending', 'approved', 'rejected', 'issued', 'all'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`filter-btn ${filterStatus === status ? 'filter-btn-active' : ''}`}
                                >
                                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        Error: {error}
                    </div>
                )}

                {/* Requisitions Table */}
                <div className="table-card">
                    <div className="table-header">
                        <h2>Requisitions ({filteredRequisitions.length})</h2>
                    </div>

                    {filteredRequisitions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3 className="empty-state-title">No Requisitions Found</h3>
                            <p className="empty-state-text">
                                {searchTerm ? 'Try adjusting your search or filters' : 'No requisitions match the selected status'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-wrapper">
                                <table className="data-table">
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
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setShowDetailsModal(true);
                                                    }}
                                                >
                                                    <td>
                                                        <div className="requester-name">
                                                            {req.requesterName || req.requester?.name || 'Unknown'}
                                                        </div>
                                                        <div className="requester-id">
                                                            ID: {employeeDisplayId}
                                                        </div>
                                                    </td>
                                                    <td className="department-cell">
                                                        {req.department || 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div className="items-count">{req.items?.length || 0} item(s)</div>
                                                        <div className="items-preview">
                                                            {req.items?.map(i => i.itemName).slice(0, 2).join(', ')}
                                                            {req.items?.length > 2 && '...'}
                                                        </div>
                                                    </td>
                                                    <td className="quantity-value text-right">
                                                        {totalQuantity}
                                                    </td>
                                                    <td className="text-center">
                                                        {getStatusBadge(req.status)}
                                                    </td>
                                                    <td className="date-value">
                                                        {formatDate(req.createdAt || req.dateRequested)}
                                                    </td>
                                                    <td className="text-center">
                                                        {isPending && (
                                                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequest(req);
                                                                        setShowApproveModal(true);
                                                                    }}
                                                                    className="action-btn btn-approve"
                                                                    disabled={processingId === req._id}
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequest(req);
                                                                        setShowRejectModal(true);
                                                                    }}
                                                                    className="action-btn btn-reject"
                                                                    disabled={processingId === req._id}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {!isPending && (
                                                            <span className="processed-badge">Processed</span>
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
                                <div className="pagination-wrapper">
                                    <div className="pagination-info">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequisitions.length)} of {filteredRequisitions.length} requisitions
                                    </div>
                                    <div className="pagination-controls">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            Previous
                                        </button>
                                        <span className="pagination-page">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
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
                    <div className="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-sticky-header">
                            <div className="modal-header-flex">
                                <div>
                                    <h2 className="modal-title">Requisition Details</h2>
                                    <div className="modal-badge-group">
                                        {getStatusBadge(selectedRequest.status)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="modal-close"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="modal-body">
                            {/* Requester Info */}
                            <div className="info-section">
                                <h3 className="section-title">Requester Information</h3>
                                <div className="info-grid">
                                    <div>
                                        <p className="info-label">Name</p>
                                        <p className="info-value">{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="info-label">Employee ID</p>
                                        <p className="info-value">{getEmployeeDisplayId(selectedRequest)}</p>
                                    </div>
                                    <div>
                                        <p className="info-label">Department</p>
                                        <p className="info-value">{selectedRequest.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="info-label">Date Requested</p>
                                        <p className="info-value">{formatDate(selectedRequest.createdAt || selectedRequest.dateRequested)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes/Purpose */}
                            {selectedRequest.notes && (
                                <div className="notes-section">
                                    <h3 className="section-title">Notes / Purpose</h3>
                                    <p className="notes-content">
                                        {selectedRequest.notes}
                                    </p>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <h3 className="section-title">Requested Items</h3>
                                <div className="items-table-wrapper">
                                    <table className="items-table">
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
                                                    <td className="text-right">{item.quantity}</td>
                                                    <td className="text-right">
                                                        {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '—'}
                                                    </td>
                                                    <td className="text-right font-semibold">
                                                        {item.totalPrice ? `$${item.totalPrice.toFixed(2)}` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" className="text-right font-semibold">Totals:</td>
                                                <td className="text-right font-semibold">
                                                    {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                                                </td>
                                                <td className="text-right">—</td>
                                                <td className="text-right font-semibold">
                                                    ${selectedRequest.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2) || '0.00'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {selectedRequest.status?.toLowerCase() === 'pending' && (
                            <div className="modal-footer">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setShowRejectModal(true);
                                    }}
                                    className="action-btn btn-reject"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setShowApproveModal(true);
                                    }}
                                    className="action-btn btn-approve"
                                >
                                    Approve
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content modal-content-medium" onClick={e => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="modal-header-simple">
                                <h2 className="modal-title">Approve Requisition</h2>
                                <p className="modal-subtitle">Review the details before approving</p>
                            </div>

                            <div className="requirement-summary">
                                <p className="requester-info">
                                    Approve requisition from <strong>{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</strong>
                                </p>
                                <p className="requester-details">
                                    Employee ID: {getEmployeeDisplayId(selectedRequest)} | Items: {selectedRequest.items?.length || 0} | Total Qty: {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Remarks (Optional)</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="3"
                                    className="textarea-input"
                                    placeholder="Add any remarks..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setRemarks('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={processingId === selectedRequest._id}
                                    className="action-btn btn-approve"
                                >
                                    {processingId === selectedRequest._id ? (
                                        <>
                                            <span className="spinner-small"></span>
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
                    <div className="modal-content modal-content-medium" onClick={e => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="modal-header-simple">
                                <h2 className="modal-title">Reject Requisition</h2>
                                <p className="modal-subtitle">Please provide a reason for rejection</p>
                            </div>

                            <div className="requirement-summary">
                                <p className="requester-info">
                                    Reject requisition from <strong>{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</strong>
                                </p>
                                <p className="requester-details">
                                    Employee ID: {getEmployeeDisplayId(selectedRequest)}
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Reason for Rejection <span className="required">*</span>
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows="3"
                                    className="textarea-input"
                                    placeholder="Please provide a reason..."
                                    required
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRemarks('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!remarks || processingId === selectedRequest._id}
                                    className="action-btn btn-reject"
                                >
                                    {processingId === selectedRequest._id ? (
                                        <>
                                            <span className="spinner-small"></span>
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