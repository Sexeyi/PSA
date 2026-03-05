import React, { useState, useEffect } from 'react';
import './ApproveRequests.css';

const ApproveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [filter, setFilter] = useState('pending');
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyExpandedId, setHistoryExpandedId] = useState(null);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const status = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`http://localhost:5000/api/requests${status}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/requests?status=approved,completed,rejected', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setHistoryRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Approved',
          remarks,
          approvedDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSelectedRequest(null);
        setRemarks('');
        fetchRequests();
        if (showHistory) fetchHistory();
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId) => {
    if (!remarks.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Rejected',
          remarks
        })
      });

      if (response.ok) {
        setSelectedRequest(null);
        setRemarks('');
        fetchRequests();
        if (showHistory) fetchHistory();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter history based on search
  const filteredHistory = historyRequests
    .sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested))
    .filter(item =>
      item.requesterName?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      item.itemName?.toLowerCase().includes(historySearchTerm.toLowerCase())
    );

  if (loading && !showHistory) {
    return <div className="loading-spinner">Loading requests...</div>;
  }

  return (
    <div className="approve-container">
      <div className="approve-header">
        <h1>Requests for Approval</h1>
        <div className="header-actions">
          <button
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '← Back to Requests' : '📋 View History'}
          </button>
        </div>
      </div>

      {!showHistory ? (
        // Approval Requests View
        <>
          <div className="filter-tabs">
            <button
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending ({requests.filter(r => r.status === 'Pending').length})
            </button>
            <button
              className={filter === 'approved' ? 'active' : ''}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button
              className={filter === 'rejected' ? 'active' : ''}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({requests.length})
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No {filter} requests found</p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map(request => (
                <div key={request.id} className={`request-card ${request.status.toLowerCase()}`}>
                  <div className="request-header">
                    <div className="requester-info">
                      <h3>{request.requesterName}</h3>
                      <span className="department">{request.department}</span>
                    </div>
                    <div className="request-meta">
                      <span className={`status ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="request-details">
                    <div className="item-info">
                      <strong>{request.itemName}</strong>
                      <span>{request.quantity} {request.unit}</span>
                      <span className="category">{request.category}</span>
                    </div>
                    <p className="purpose">{request.purpose}</p>
                    {request.notes && (
                      <p className="notes"><small>📝 {request.notes}</small></p>
                    )}
                    <div className="date-info">
                      <span>Requested: {formatDate(request.dateRequested)}</span>
                      {request.neededByDate && (
                        <span>Needed by: {formatDate(request.neededByDate)}</span>
                      )}
                    </div>
                  </div>

                  {request.status === 'Pending' && (
                    <div className="request-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(request.id)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => setSelectedRequest(request)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {request.remarks && (
                    <div className="remarks">
                      <small>📌 {request.remarks}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // History View (Integrated)
        <div className="history-section">
          <div className="history-header">
            <h2>Request History</h2>
            <div className="history-search">
              <input
                type="text"
                placeholder="Search by name, department, or item..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="history-stats">
            <div className="stat-box">
              <span className="stat-number">{historyRequests.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {historyRequests.filter(r => r.status === 'Approved').length}
              </span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {historyRequests.filter(r => r.status === 'Rejected').length}
              </span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>

          <div className="history-list">
            {historyLoading ? (
              <p className="history-empty">Loading history...</p>
            ) : filteredHistory.length === 0 ? (
              <p className="history-empty">No history records found</p>
            ) : (
              filteredHistory.map(item => (
                <div key={item.id} className="history-card">
                  <div
                    className="history-card-header"
                    onClick={() => setHistoryExpandedId(historyExpandedId === item.id ? null : item.id)}
                  >
                    <div className="history-card-info">
                      <span className="history-card-name">{item.requesterName}</span>
                      <span className="history-card-dept">{item.department}</span>
                    </div>
                    <div className="history-card-meta">
                      <span className={`history-status ${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                      <span className="history-card-date">{formatDate(item.dateRequested)}</span>
                      <span className="history-expand-icon">
                        {historyExpandedId === item.id ? '−' : '+'}
                      </span>
                    </div>
                  </div>

                  {historyExpandedId === item.id && (
                    <div className="history-card-details">
                      <div className="history-detail-row">
                        <strong>Item:</strong> {item.itemName}
                      </div>
                      <div className="history-detail-row">
                        <strong>Quantity:</strong> {item.quantity} {item.unit}
                      </div>
                      <div className="history-detail-row">
                        <strong>Category:</strong> {item.category}
                      </div>
                      {item.purpose && (
                        <div className="history-detail-row">
                          <strong>Purpose:</strong> {item.purpose}
                        </div>
                      )}
                      {item.notes && (
                        <div className="history-detail-row">
                          <strong>Notes:</strong> {item.notes}
                        </div>
                      )}
                      {item.remarks && (
                        <div className="history-detail-row">
                          <strong>Remarks:</strong> {item.remarks}
                        </div>
                      )}
                      {item.neededByDate && (
                        <div className="history-detail-row">
                          <strong>Needed by:</strong> {formatDate(item.neededByDate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Reject Request</h2>
            <p><strong>{selectedRequest.requesterName}</strong> - {selectedRequest.itemName}</p>
            <textarea
              placeholder="Please provide a reason for rejection..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="4"
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setSelectedRequest(null)}>
                Cancel
              </button>
              <button
                className="reject-btn"
                onClick={() => handleReject(selectedRequest.id)}
                disabled={!remarks.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveRequests;