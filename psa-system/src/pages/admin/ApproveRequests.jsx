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

      const status = filter !== 'all'
        ? `?status=${filter}`
        : '';

      const response = await fetch(`http://localhost:5000/api/requests${status}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      setRequests(data.requests || []);

    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };


  const handleApprove = async (requestId) => {

    try {

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/requests/${requestId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            remarks,
            approvedDate: new Date().toISOString()
          })
        }
      );

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

      const response = await fetch(
        `http://localhost:5000/api/requests/${requestId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            remarks
          })
        }
      );

      if (response.ok) {

        setRejectRequest(null);
        setRemarks('');
        fetchRequests();

      }

    } catch (error) {
      console.error(error);
    }

  };


  const formatDate = (date) => {

    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  };


  if (loading) {
    return <div className="loading-spinner">Loading requests...</div>;
  }


  return (

    <div className="approve-container">

      <div className="approve-header">
        <h1>Requests for Approval</h1>
      </div>


      {/* FILTER TABS */}

      <div className="filter-tabs">

        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
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
          All
        </button>

      </div>


      {/* REQUEST LIST */}

      <div className="requests-list">

        {requests.length === 0 && (
          <p className="empty-state">No requests found</p>
        )}


        {requests.map(request => (

          <div key={request.id} className="request-card">

            <div className="request-header">

              <div>

                <h3>{request.requesterName}</h3>

                <span className="department">
                  {request.department}
                </span>

              </div>

              <span className={`status ${request.status.toLowerCase()}`}>
                {request.status}
              </span>

            </div>


            <div className="request-details">

              <strong>{request.itemName}</strong>

              <p>
                {request.quantity} {request.unit}
              </p>

              <p className="category">
                {request.category}
              </p>

              <p className="purpose">
                {request.purpose}
              </p>

              <p className="date">
                Requested: {formatDate(request.dateRequested)}
              </p>

            </div>


            {/* ACTION BUTTONS */}

            <div className="request-actions">

              <button
                className="view-btn"
                onClick={() => setSelectedRequest(request)}
              >
                View Details
              </button>


              {request.status === "Pending" && (

                <>
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(request.id)}
                  >
                    Approve
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() => setRejectRequest(request)}
                  >
                    Reject
                  </button>
                </>

              )}

            </div>

          </div>

        ))}

      </div>


      {/* DETAILS MODAL */}

      {selectedRequest && (

        <div
          className="modal-backdrop"
          onClick={() => setSelectedRequest(null)}
        >

          <div
            className="modal large"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>Requisition Details</h2>

            <p><strong>Requester:</strong> {selectedRequest.requesterName}</p>

            <p><strong>Department:</strong> {selectedRequest.department}</p>

            <p><strong>Item:</strong> {selectedRequest.itemName}</p>

            <p><strong>Category:</strong> {selectedRequest.category}</p>

            <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>

            <p><strong>Unit:</strong> {selectedRequest.unit}</p>

            <p><strong>Purpose:</strong> {selectedRequest.purpose}</p>

            {selectedRequest.notes && (
              <p><strong>Notes:</strong> {selectedRequest.notes}</p>
            )}

            <p>
              <strong>Date Requested:</strong>
              {formatDate(selectedRequest.dateRequested)}
            </p>


            <div className="modal-actions">

              <button
                className="print-btn"
                onClick={() =>
                  window.open(
                    `http://localhost:5000/api/requisitions/${selectedRequest.id}/pdf`
                  )
                }
              >
                Print PDF
              </button>


              {selectedRequest.status === "Pending" && (

                <>
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
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

              <button
                className="cancel-btn"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}



      {/* REJECT MODAL */}

      {rejectRequest && (

        <div
          className="modal-backdrop"
          onClick={() => setRejectRequest(null)}
        >

          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>Reject Request</h2>

            <p>
              <strong>{rejectRequest.requesterName}</strong>
            </p>

            <textarea
              placeholder="Enter rejection reason..."
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <div className="modal-actions">

              <button
                className="cancel-btn"
                onClick={() => setRejectRequest(null)}
              >
                Cancel
              </button>

              <button
                className="reject-btn"
                onClick={() => handleReject(rejectRequest.id)}
              >
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