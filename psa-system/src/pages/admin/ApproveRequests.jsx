import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './ApproveRequests.css';

const ApproveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('approved');
  const [processingId, setProcessingId] = useState(null);
  const [allNonPendingRequests, setAllNonPendingRequests] = useState([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch all non-pending requests for accurate counting
  const fetchAllNonPending = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/requisitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requisitions');
      }

      const data = await response.json();
      const allRequests = data.requests || data.data || [];
      const nonPendingRequests = allRequests.filter(req => {
        const status = (req.status || '').toLowerCase();
        return status !== 'pending';
      });
      setAllNonPendingRequests(nonPendingRequests);
    } catch (error) {
      console.error("Error fetching all requests:", error);
    }
  }, [API_BASE_URL]);

  // Fetch filtered requests for display
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/requisitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requisitions');
      }

      const data = await response.json();
      const requestsData = data.requests || data.data || [];

      const nonPendingRequests = requestsData.filter(req => {
        const status = (req.status || '').toLowerCase();
        return status !== 'pending';
      });

      let filteredData = nonPendingRequests;
      if (filter !== 'all') {
        filteredData = nonPendingRequests.filter(req =>
          (req.status || '').toLowerCase() === filter.toLowerCase()
        );
      }

      setRequests(filteredData);
      setError('');
    } catch (error) {
      console.error("Fetch error", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, filter]);

  useEffect(() => {
    fetchAllNonPending();
    fetchRequests();
  }, [fetchAllNonPending, fetchRequests]);

  const handlePrintPDF = useCallback(async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/requisitions/${requestId}/pdf`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) alert('Please allow popups to view PDF');
    } catch (error) {
      console.error('PDF error:', error);
      alert('Error fetching PDF');
    }
  }, [API_BASE_URL]);

  // FIXED: Use the correct endpoint for issuing
  const handleIssue = useCallback(async (requestId) => {
    if (!remarks.trim()) {
      alert("Please provide issuance remarks");
      return;
    }

    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');

      // FIXED: Use the correct endpoint - /api/requisitions/:id/issue
      const response = await fetch(`${API_BASE_URL}/api/requisitions/${requestId}/issue`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'issued',
          issuedDate: new Date().toISOString(),
          issuedBy: 'Admin',
          issuanceRemarks: remarks
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to issue requisition');
      }

      await fetchRequests();
      await fetchAllNonPending();

      setShowIssueModal(false);
      setRemarks('');
      setSelectedRequest(null);
      setSuccess('Requisition issued successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error(error);
      setError(error.message || 'Error issuing requisition');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  }, [remarks, API_BASE_URL, fetchRequests, fetchAllNonPending]);

  const formatDate = useCallback((date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
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

  const getAccurateStatusCount = useCallback((targetStatus) => {
    return allNonPendingRequests.filter(req =>
      (req.status || '').toLowerCase() === targetStatus
    ).length;
  }, [allNonPendingRequests]);

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;
    const term = searchTerm.toLowerCase();
    return requests.filter(req =>
      (req.requesterName || '').toLowerCase().includes(term) ||
      (req.department || '').toLowerCase().includes(term) ||
      (req.employeeId || '').toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="approve-container">
      <div className="approve-wrapper">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Requests Management</h1>
            <p className="page-subtitle">Review approved requests and process issuance</p>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <span className="alert-message">{success}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-approved">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{getAccurateStatusCount('approved')}</span>
            </div>
          </div>
          <div className="stat-card stat-issued">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-label">Issued</span>
              <span className="stat-value">{getAccurateStatusCount('issued')}</span>
            </div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-icon">✗</div>
            <div className="stat-info">
              <span className="stat-label">Rejected</span>
              <span className="stat-value">{getAccurateStatusCount('rejected')}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-section">
          <div className="filter-tabs">
            {['approved', 'rejected', 'issued', 'all'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentPage(1); }}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
              >
                {f === 'all' ? 'All Requests' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="filter-count">({getAccurateStatusCount(f)})</span>
                )}
              </button>
            ))}
          </div>

          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, department, or employee ID..."
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

        {/* Request Cards Grid */}
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">No Requests Found</h3>
            <p className="empty-description">
              {searchTerm ? 'Try adjusting your search' : `No ${filter !== 'all' ? filter : ''} requests available`}
            </p>
          </div>
        ) : (
          <>
            <div className="requests-grid">
              {paginatedRequests.map(request => {
                const totalQuantity = request.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                const totalValue = request.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
                const normalizedStatus = (request.status || '').toLowerCase();
                const isApproved = normalizedStatus === 'approved';
                const isIssued = normalizedStatus === 'issued';

                return (
                  <div key={request._id} className={`request-card ${normalizedStatus}`}>
                    {/* Card Header */}
                    <div className="card-header">
                      <div className="requester-info">
                        <h3 className="requester-name">{request.requesterName || 'Unknown'}</h3>
                        <p className="requester-dept">{request.department || 'N/A'}</p>
                        {request.employeeId && (
                          <p className="requester-id">ID: {request.employeeId}</p>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Card Content */}
                    <div className="card-content">
                      {/* Items Preview */}
                      <div className="items-preview">
                        <p className="items-label">Requested Items:</p>
                        <div className="items-list">
                          {request.items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="item-row">
                              <span className="item-name">{item.itemName}</span>
                              <span className="item-qty">{item.quantity} {item.unit || 'pcs'}</span>
                            </div>
                          ))}
                          {request.items?.length > 2 && (
                            <p className="more-items">+{request.items.length - 2} more items</p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="card-stats">
                        <div className="stat">
                          <span className="stat-label">Items</span>
                          <span className="stat-value">{request.items?.length || 0}</span>
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
                      {request.notes && (
                        <div className="notes-section">
                          <p className="notes-label">📝 Notes:</p>
                          <p className="notes-text">{request.notes}</p>
                        </div>
                      )}

                      {/* Processing Info */}
                      {(isApproved || normalizedStatus === 'rejected') && (
                        <div className="processing-info">
                          <p className="info-label">Processing Remarks:</p>
                          <p className="info-text">{request.approverRemarks || request.remarks || 'N/A'}</p>
                          <p className="info-date">Processed: {formatDate(request.approvedDate || request.processedDate)}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="card-actions">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="btn-view"
                        >
                          View Details
                        </button>
                        {isApproved && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowIssueModal(true);
                            }}
                            disabled={processingId === request._id}
                            className="btn-issue"
                          >
                            Issue Items
                          </button>
                        )}
                        {isIssued && (
                          <button
                            onClick={() => handlePrintPDF(request._id)}
                            className="btn-pdf"
                          >
                            Export PDF
                          </button>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
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
      {selectedRequest && !showIssueModal && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Requisition Details</h2>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
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
                    <p>{selectedRequest.requesterName || 'Unknown'}</p>
                  </div>
                  <div className="info-item">
                    <label>Employee ID</label>
                    <p>{selectedRequest.employeeId || selectedRequest.requesterId || 'N/A'}</p>
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
              {selectedRequest.status?.toLowerCase() === 'approved' && (
                <button
                  onClick={() => setShowIssueModal(true)}
                  className="btn-issue-modal"
                >
                  Issue Items
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedRequest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => {
          setShowIssueModal(false);
          setRemarks('');
        }}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Issue Items</h2>
              <button className="modal-close" onClick={() => {
                setShowIssueModal(false);
                setRemarks('');
              }}>×</button>
            </div>

            <div className="modal-body">
              <div className="issue-info">
                <div className="issue-recipient">
                  <span className="issue-label">Recipient:</span>
                  <span className="issue-value">{selectedRequest.requesterName || 'Unknown'}</span>
                </div>
                <div className="issue-details">
                  <span className="issue-label">Items:</span>
                  <span className="issue-value">{selectedRequest.items?.length || 0} items</span>
                </div>
                <div className="issue-details">
                  <span className="issue-label">Total Quantity:</span>
                  <span className="issue-value">
                    {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Issuance Remarks <span className="required">*</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="form-textarea"
                  placeholder="Enter issuance details, condition of items, delivery instructions, etc..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowIssueModal(false);
                  setRemarks('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => handleIssue(selectedRequest._id)}
                disabled={!remarks.trim() || processingId === selectedRequest._id}
              >
                {processingId === selectedRequest._id ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : (
                  'Confirm Issuance'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveRequests;