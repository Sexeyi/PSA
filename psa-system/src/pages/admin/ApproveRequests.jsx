import React, { useState, useEffect } from 'react';
import './ApproveRequests.css';

const ApproveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);

  const [remarks, setRemarks] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  // Fetch all requisitions (admin)
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const status = filter !== 'all' ? `?status=${filter}` : '';

      const res = await fetch(`http://localhost:5000/api/requisitions${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Approve a requisition
  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`http://localhost:5000/api/requisitions/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks, approvedDate: new Date().toISOString() }),
      });

      if (res.ok) {
        setSelectedRequest(null);
        setRemarks('');
        fetchRequests();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error approving requisition');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reject a requisition
  const handleReject = async (requestId) => {
    if (!remarks.trim()) return alert('Please provide rejection remarks');

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`http://localhost:5000/api/requisitions/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks }),
      });

      if (res.ok) {
        setRejectRequest(null);
        setRemarks('');
        fetchRequests();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error rejecting requisition');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  if (loading) return <div className="loading-spinner">Loading requests...</div>;

  return (
    <div className="approve-container">
      <div className="approve-header">
        <h1>Requests for Approval</h1>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="requests-list">
        {requests.length === 0 && <p className="empty-state">No requests found</p>}

        {requests.map((req) => (
          <div key={req._id} className="request-card">
            <div className="request-header">
              <div>
                <h3>{req.requesterName}</h3>
                <span className="department">{req.department}</span>
              </div>
              <span className={`status ${req.status.toLowerCase()}`}>{req.status}</span>
            </div>

            <div className="request-details">
              {req.items.map((item, idx) => (
                <div key={idx} className="request-item">
                  <strong> {item.quantity} {item.itemName}</strong>
                  <p>
                    ₱  {item.unit}
                  </p>
                  <p className="category">{item.category}</p>
                </div>
              ))}
              {req.notes && <p className="purpose">Notes: {req.notes}</p>}
              <p className="date">Requested: {formatDate(req.dateRequested)}</p>
            </div>

            {/* Actions */}
            <div className="request-actions">
              <button className="view-btn" onClick={() => setSelectedRequest(req)}>
                View Details
              </button>
              {req.status === 'Pending' && (
                <>
                  <button className="approve-btn" onClick={() => handleApprove(req._id)}>
                    Approve
                  </button>
                  <button className="reject-btn" onClick={() => setRejectRequest(req)}>
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Request Modal */}
      {selectedRequest && (
        <div className="modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h2>Requisition Details</h2>
            <p><strong>Requester:</strong> {selectedRequest.requesterName}</p>
            <p><strong>Department:</strong> {selectedRequest.department}</p>
            {selectedRequest.items.map((item, idx) => (
              <div key={idx}>
                <p><strong>Item {idx + 1}:</strong> {item.itemName}</p>
                <p>Category: {item.category}</p>
                <p>Quantity: {item.quantity}pcs, Pesos{item.unit}</p>
              </div>
            ))}
            {selectedRequest.notes && <p><strong>Notes:</strong> {selectedRequest.notes}</p>}
            <p><strong>Date Requested:</strong> {formatDate(selectedRequest.dateRequested)}</p>

            <div className="modal-actions">
              <button
                className="print-btn"
                onClick={() =>
                  window.open(`http://localhost:5000/api/requisitions/${selectedRequest._id}/pdf`)
                }
              >
                Print PDF
              </button>

              {selectedRequest.status === 'Pending' && (
                <>
                  <button className="approve-btn" onClick={() => handleApprove(selectedRequest._id)}>
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => {
                      setRejectRequest(selectedRequest);
                      setSelectedRequest(null);
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              <button className="cancel-btn" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectRequest && (
        <div className="modal-backdrop" onClick={() => setRejectRequest(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Request</h2>
            <p><strong>{rejectRequest.requesterName}</strong></p>
            <textarea
              placeholder="Enter rejection reason..."
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setRejectRequest(null)}>
                Cancel
              </button>
              <button className="reject-btn" onClick={() => handleReject(rejectRequest._id)}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveRequests;