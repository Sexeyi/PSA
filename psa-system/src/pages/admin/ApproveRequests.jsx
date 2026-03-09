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

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const status = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`http://localhost:5000/api/requisitions${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/requisitions/${requestId}/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const newWindow = window.open(url, '_blank');
      if (!newWindow) alert('Please allow popups to print PDF');

    } catch (error) {
      console.error('PDF error:', error);
      alert('Error fetching PDF');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/requisitions/${requestId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remarks, approvedDate: new Date().toISOString() })
      });
      if (response.ok) {
        setSelectedRequest(null);
        setRemarks('');
        fetchRequests();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (requestId) => {
    if (!remarks.trim()) {
      alert("Please provide rejection remarks");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/requisitions/${requestId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remarks })
      });
      if (response.ok) {
        setRejectRequest(null);
        setRemarks('');
        fetchRequests();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date) => !date ? "N/A" : new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) return <div className="loading-spinner">Loading requests...</div>;

  return (
    <div className="approve-container">

      <div className="approve-header"><h1>Requests for Approval</h1></div>

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* REQUEST LIST */}
      <div className="requests-list">
        {requests.length === 0 && <p className="empty-state">No requests found</p>}

        {requests.map(request => (
          <div key={request._id} className="request-card">
            <div className="request-header">
              <div>
                <h3>{request.requesterName}</h3>
                <span className="department">{request.department}</span>
              </div>
              <span className={`status ${request.status.toLowerCase()}`}>{request.status}</span>
            </div>

            <div className="request-details">
              {/* Display items as table inside card */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.itemName}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit || "-"}</td>
                      <td>{item.category || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
              {(request.status === "Approved" || request.status === "Rejected") && (
                <>
                  <p><strong>Approved By:</strong> {request.approvedBy || "N/A"}</p>
                  <p><strong>Remarks:</strong> {request.approverRemarks || "N/A"}</p>
                  <p><strong>Processed Date:</strong> {formatDate(request.approvedDate)}</p>
                </>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="request-actions">
              <button className="view-btn" onClick={() => setSelectedRequest(request)}>View Details</button>
              {request.status === "Pending" && (
                <>
                  <button className="approve-btn" onClick={() => handleApprove(request._id)}>Approve</button>
                  <button className="reject-btn" onClick={() => setRejectRequest(request)}>Reject</button>
                </>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* DETAILS MODAL */}
      {selectedRequest && (
        <div className="modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h2>Requisition Details</h2>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {selectedRequest.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || "-"}</td>
                    <td>{item.category || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedRequest.notes && <p><strong>Notes:</strong> {selectedRequest.notes}</p>}
            {(selectedRequest.status === "Approved" || selectedRequest.status === "Rejected") && (
              <>
                <p><strong>Approved By:</strong> {selectedRequest.approvedBy || "N/A"}</p>
                <p><strong>Remarks:</strong> {selectedRequest.approverRemarks || "N/A"}</p>
                <p><strong>Processed Date:</strong> {formatDate(selectedRequest.approvedDate)}</p>
              </>
            )}

            <div className="modal-actions">
              <button
                className="print-btn"
                onClick={() => handlePrintPDF(selectedRequest._id)}
              >
                Export
              </button>

              {selectedRequest.status === "Pending" && (
                <>
                  <button className="approve-btn" onClick={() => handleApprove(selectedRequest._id)}>Approve</button>
                  <button className="reject-btn" onClick={() => { setRejectRequest(selectedRequest); setSelectedRequest(null); }}>Reject</button>
                </>
              )}

              <button className="cancel-btn" onClick={() => setSelectedRequest(null)}>Close</button>
            </div>

          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectRequest && (
        <div className="modal-backdrop" onClick={() => setRejectRequest(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Request</h2>
            <p><strong>{rejectRequest.requesterName}</strong></p>
            <textarea placeholder="Enter rejection reason..." rows="4" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setRejectRequest(null)}>Cancel</button>
              <button className="reject-btn" onClick={() => handleReject(rejectRequest._id)}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApproveRequests;