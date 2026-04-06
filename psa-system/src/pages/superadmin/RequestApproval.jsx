import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    const [itemsPerPage] = useState(6);
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

    const extractId = useCallback((id) => {
        if (!id) return null;
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id;
        if (typeof id === 'object' && id.id) return id.id;
        return null;
    }, []);

    const fetchRequisitions = useCallback(async () => {
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
    }, [API_BASE_URL, extractId]);

    useEffect(() => {
        fetchRequisitions();
    }, [fetchRequisitions]);

    const handleApprove = useCallback(async () => {
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
        } catch (error) {
            console.error('Error approving requisition:', error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    }, [selectedRequest, remarks, user, API_BASE_URL, fetchRequisitions]);

    const handleReject = useCallback(async () => {
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
        } catch (error) {
            console.error('Error rejecting requisition:', error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    }, [selectedRequest, remarks, user, API_BASE_URL, fetchRequisitions]);

    const getEmployeeDisplayId = useCallback((requisition) => {
        if (requisition.employeeId) return requisition.employeeId;
        if (requisition.employeeData?.employeeId) return requisition.employeeData.employeeId;
        if (requisition.requesterId && typeof requisition.requesterId === 'string') return requisition.requesterId;
        return 'N/A';
    }, []);

    const filteredRequisitions = useMemo(() => {
        let filtered = [...requisitions];

        if (filterStatus !== 'all') {
            filtered = filtered.filter(req => req.status?.toLowerCase() === filterStatus.toLowerCase());
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(req =>
                req.requesterName?.toLowerCase().includes(term) ||
                req.department?.toLowerCase().includes(term) ||
                req.notes?.toLowerCase().includes(term) ||
                req.items?.some(item => item.itemName?.toLowerCase().includes(term))
            );
        }

        return filtered;
    }, [requisitions, filterStatus, searchTerm]);

    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRequisitions.slice(start, start + itemsPerPage);
    }, [filteredRequisitions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);

    const formatDate = useCallback((dateString) => {
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
    }, []);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }, []);

    const getStatusBadge = useCallback((status) => {
        const normalizedStatus = (status || '').toLowerCase();
        const badges = {
            pending: { class: 'badge-pending', text: 'Pending', icon: '⏳' },
            approved: { class: 'badge-approved', text: 'Approved', icon: '✓' },
            rejected: { class: 'badge-rejected', text: 'Rejected', icon: '✗' },
            issued: { class: 'badge-issued', text: 'Issued', icon: '📦' }
        };
        const config = badges[normalizedStatus] || { class: 'badge-default', text: status || 'Unknown', icon: '?' };
        return (
            <span className={`status-badge ${config.class}`}>
                <span className="badge-icon">{config.icon}</span>
                {config.text}
            </span>
        );
    }, []);

    if (loading && requisitions.length === 0) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading requisitions...</p>
            </div>
        );
    }

    return (
        <div className="request-approval-container">
            <div className="request-approval-wrapper">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Request Approval</h1>
                        <p className="page-subtitle">
                            Review and approve pending requisitions. Approved requests will be queued for Admin to issue.
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="filter-section">
                    <div className="filter-tabs">
                        {['pending', 'approved', 'rejected', 'issued', 'all'].map(status => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                            >
                                {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
                                {status !== 'all' && (
                                    <span className="filter-count">({stats[status] || 0})</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
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
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-message">{error}</span>
                    </div>
                )}

                {/* Requisitions Grid */}
                {filteredRequisitions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3 className="empty-title">No Requisitions Found</h3>
                        <p className="empty-description">
                            {searchTerm ? 'Try adjusting your search or filters' : 'No requisitions match the selected status'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="requests-grid">
                            {paginatedRequests.map(req => {
                                const totalQuantity = req.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                                const totalValue = req.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
                                const isPending = req.status?.toLowerCase() === 'pending';
                                const employeeDisplayId = getEmployeeDisplayId(req);

                                return (
                                    <div key={req._id} className={`request-card ${req.status?.toLowerCase()}`}>
                                        {/* Card Header */}
                                        <div className="card-header">
                                            <div className="requester-info">
                                                <h3 className="requester-name">{req.requesterName || req.requester?.name || 'Unknown'}</h3>
                                                <p className="requester-dept">{req.department || 'N/A'}</p>
                                                <p className="requester-id">ID: {employeeDisplayId}</p>
                                            </div>
                                            {getStatusBadge(req.status)}
                                        </div>

                                        {/* Card Content */}
                                        <div className="card-content">
                                            {/* Items Preview */}
                                            <div className="items-preview">
                                                <p className="items-label">Requested Items:</p>
                                                <div className="items-list">
                                                    {req.items?.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="item-row">
                                                            <span className="item-name">{item.itemName}</span>
                                                            <span className="item-qty">{item.quantity} {item.unit || 'pcs'}</span>
                                                        </div>
                                                    ))}
                                                    {req.items?.length > 2 && (
                                                        <p className="more-items">+{req.items.length - 2} more items</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="card-stats">
                                                <div className="stat">
                                                    <span className="stat-label">Items</span>
                                                    <span className="stat-value">{req.items?.length || 0}</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-label">Total Qty</span>
                                                    <span className="stat-value">{totalQuantity}</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-label">Total Value</span>
                                                    <span className="stat-value">{formatCurrency(totalValue)}</span>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {req.notes && (
                                                <div className="notes-section">
                                                    <p className="notes-label">📝 Notes:</p>
                                                    <p className="notes-text">{req.notes}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="card-actions">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="btn-view"
                                                >
                                                    View Details
                                                </button>
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setShowApproveModal(true);
                                                            }}
                                                            disabled={processingId === req._id}
                                                            className="btn-approve-card"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setShowRejectModal(true);
                                                            }}
                                                            disabled={processingId === req._id}
                                                            className="btn-reject-card"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-wrapper">
                                <div className="pagination-info">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRequisitions.length)} of {filteredRequisitions.length} requisitions
                                </div>
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-page">Page {currentPage} of {totalPages}</span>
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

            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Requisition Details</h2>
                            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-status">
                                {getStatusBadge(selectedRequest.status)}
                            </div>

                            {/* Requester Info */}
                            <div className="info-section">
                                <h3 className="section-title">Requester Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Name</label>
                                        <p>{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Employee ID</label>
                                        <p>{getEmployeeDisplayId(selectedRequest)}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Department</label>
                                        <p>{selectedRequest.department || 'N/A'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Date Requested</label>
                                        <p>{formatDate(selectedRequest.createdAt || selectedRequest.dateRequested)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedRequest.notes && (
                                <div className="notes-section">
                                    <h3 className="section-title">Notes / Purpose</h3>
                                    <p className="notes-content">{selectedRequest.notes}</p>
                                </div>
                            )}

                            {/* Items Table */}
                            <div>
                                <h3 className="section-title">Requested Items</h3>
                                <div className="table-wrapper">
                                    <table className="details-table">
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
                                                    <td className="item-name-cell">{item.itemName}</td>
                                                    <td>{item.category || '—'}</td>
                                                    <td>{item.unit || '—'}</td>
                                                    <td className="text-right">{item.quantity}</td>
                                                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="text-right total-cell">{formatCurrency(item.totalPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="total-row">
                                                <td colSpan="3" className="text-right">Totals:</td>
                                                <td className="text-right">
                                                    {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                                                </td>
                                                <td className="text-right">—</td>
                                                <td className="text-right total-value">
                                                    {formatCurrency(selectedRequest.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            {selectedRequest.status?.toLowerCase() === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowRejectModal(true);
                                        }}
                                        className="btn-reject"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowApproveModal(true);
                                        }}
                                        className="btn-approve"
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                            <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Approve Requisition</h2>
                            <button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="approve-info">
                                <div className="approve-recipient">
                                    <span className="approve-label">Requester:</span>
                                    <span className="approve-value">{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</span>
                                </div>
                                <div className="approve-details">
                                    <span className="approve-label">Employee ID:</span>
                                    <span className="approve-value">{getEmployeeDisplayId(selectedRequest)}</span>
                                </div>
                                <div className="approve-details">
                                    <span className="approve-label">Items:</span>
                                    <span className="approve-value">{selectedRequest.items?.length || 0} items</span>
                                </div>
                                <div className="approve-details">
                                    <span className="approve-label">Total Quantity:</span>
                                    <span className="approve-value">
                                        {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Remarks (Optional)</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={3}
                                    className="form-textarea"
                                    placeholder="Add any remarks..."
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setShowApproveModal(false); setRemarks(''); }}>Cancel</button>
                            <button className="btn-approve" onClick={handleApprove} disabled={processingId === selectedRequest._id}>
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
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Reject Requisition</h2>
                            <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="reject-info">
                                <div className="reject-recipient">
                                    <span className="reject-label">Requester:</span>
                                    <span className="reject-value">{selectedRequest.requesterName || selectedRequest.requester?.name || 'Unknown'}</span>
                                </div>
                                <div className="reject-details">
                                    <span className="reject-label">Employee ID:</span>
                                    <span className="reject-value">{getEmployeeDisplayId(selectedRequest)}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Reason for Rejection <span className="required">*</span>
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={4}
                                    className="form-textarea"
                                    placeholder="Please provide a reason for rejection..."
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setShowRejectModal(false); setRemarks(''); }}>Cancel</button>
                            <button className="btn-reject" onClick={handleReject} disabled={!remarks || processingId === selectedRequest._id}>
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
            )}
        </div>
    );
};

export default RequestApproval;