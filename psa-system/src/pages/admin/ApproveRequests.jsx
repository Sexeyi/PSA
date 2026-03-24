import React, { useState, useEffect } from 'react';

const ApproveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('approved');
  const [processingId, setProcessingId] = useState(null);
  const [allNonPendingRequests, setAllNonPendingRequests] = useState([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [remarks, setRemarks] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch all non-pending requests for accurate counting
  useEffect(() => {
    const fetchAllNonPending = async () => {
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
    };
    fetchAllNonPending();
  }, []);

  // Fetch filtered requests for display
  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
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

      // Filter out pending requests
      const nonPendingRequests = requestsData.filter(req => {
        const status = (req.status || '').toLowerCase();
        return status !== 'pending';
      });

      // Apply filter (case-insensitive)
      let filteredData = nonPendingRequests;
      if (filter !== 'all') {
        filteredData = nonPendingRequests.filter(req =>
          (req.status || '').toLowerCase() === filter.toLowerCase()
        );
      }

      setRequests(filteredData);
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async (requestId) => {
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
  };

  const handleIssue = async (requestId) => {
    if (!remarks.trim()) {
      alert("Please provide issuance remarks");
      return;
    }

    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');

      // Update the requisition status to "issued"
      const response = await fetch(`${API_BASE_URL}/api/requisitions/${requestId}`, {
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

      // Refresh the all non-pending requests as well
      const allResponse = await fetch(`${API_BASE_URL}/api/requisitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (allResponse.ok) {
        const allData = await allResponse.json();
        const allRequests = allData.requests || allData.data || [];
        const nonPendingRequests = allRequests.filter(req => {
          const status = (req.status || '').toLowerCase();
          return status !== 'pending';
        });
        setAllNonPendingRequests(nonPendingRequests);
      }

      setShowIssueModal(false);
      setRemarks('');
      alert('📦 Requisition issued successfully!');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error issuing requisition');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => {
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
  };

  const normalizeStatus = (status) => {
    if (!status) return '';
    return status.toLowerCase();
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = normalizeStatus(status);

    switch (normalizedStatus) {
      case 'approved':
        return <span className="badge badge-approved">✅ Approved - Ready for Issuance</span>;
      case 'rejected':
        return <span className="badge badge-rejected">❌ Rejected</span>;
      case 'issued':
        return <span className="badge badge-issued">📦 Issued</span>;
      default:
        return <span className="badge">{status || 'Unknown'}</span>;
    }
  };

  const getAccurateStatusCount = (targetStatus) => {
    return allNonPendingRequests.filter(req =>
      normalizeStatus(req.status) === targetStatus
    ).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="gradient-text">Requests Management</h1>
          <p className="text-gray-600 mt-2">
            Review approved requests and process issuance. Rejected requests for reference.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Approved (Ready for Issuance)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getAccurateStatusCount('approved')}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Issued</p>
                <p className="text-2xl font-bold text-green-600">
                  {getAccurateStatusCount('issued')}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {getAccurateStatusCount('rejected')}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card p-5 mb-6">
          <div className="flex flex-wrap gap-2">
            {['approved', 'rejected', 'issued', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="ml-2 text-xs opacity-75">
                    ({getAccurateStatusCount(f)})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Request List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600">No {filter !== 'all' ? filter : ''} requests available</p>
            </div>
          ) : (
            requests.map(request => {
              const totalQuantity = request.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
              const normalizedStatus = normalizeStatus(request.status);
              const isApproved = normalizedStatus === 'approved';
              const isIssued = normalizedStatus === 'issued';

              return (
                <div key={request._id} className="card overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {request.requesterName || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {request.department || 'N/A'}
                        </p>
                        {request.employeeId && (
                          <p className="text-xs text-gray-400 mt-1">
                            Employee ID: {request.employeeId}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    {/* Items Summary */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Items Requested:</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {request.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm mb-1 last:mb-0">
                            <span className="text-gray-600">{item.itemName}</span>
                            <span className="font-medium text-gray-900">
                              {item.quantity} {item.unit || 'pcs'}
                            </span>
                          </div>
                        ))}
                        {request.items?.length > 3 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{request.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Total Items</p>
                        <p className="text-lg font-bold text-blue-600">{request.items?.length || 0}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Total Quantity</p>
                        <p className="text-lg font-bold text-green-600">{totalQuantity}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                        <p className="text-xs text-gray-500 mb-1">Notes:</p>
                        <p className="text-sm text-gray-700">{request.notes}</p>
                      </div>
                    )}

                    {/* Processed Info */}
                    {(isApproved || normalizedStatus === 'rejected') && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Processing Info:</p>
                        <p className="text-sm text-gray-700">
                          <strong>Remarks:</strong> {request.approverRemarks || request.remarks || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Processed: {formatDate(request.approvedDate || request.processedDate)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1 btn btn-secondary"
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
                          className="flex-1 btn btn-primary"
                        >
                          Issue Items
                        </button>
                      )}
                      {isIssued && (
                        <button
                          onClick={() => handlePrintPDF(request._id)}
                          className="flex-1 btn btn-primary"
                        >
                          Generate PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && !showIssueModal && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Requisition Details</h2>
                  <div className="mt-2">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
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
                    <p className="font-medium">{selectedRequest.requesterName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Employee ID</p>
                    <p className="font-medium">{selectedRequest.employeeId || selectedRequest.requesterId || 'N/A'}</p>
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

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notes / Purpose</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Items Table */}
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
                          <td className="font-medium">{item.itemName}</td>
                          <td>{item.category || '—'}</td>
                          <td>{item.unit || '—'}</td>
                          <td className="text-right">{item.quantity}</td>
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
              <div className="flex justify-end gap-3 pt-4 border-t">
                {normalizeStatus(selectedRequest.status) === 'approved' && (
                  <button
                    onClick={() => {
                      setShowIssueModal(true);
                    }}
                    className="btn btn-primary"
                  >
                    Issue Items
                  </button>
                )}
                {(normalizeStatus(selectedRequest.status) === 'approved' || normalizeStatus(selectedRequest.status) === 'issued') && (
                  <button
                    onClick={() => handlePrintPDF(selectedRequest._id)}
                    className="btn btn-primary"
                  >
                    Export PDF
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
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
          <div className="modal-content max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Issue Items</h2>
                  <p className="text-sm text-gray-500">Confirm issuance of items</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Issue items to <span className="font-medium text-gray-900">{selectedRequest.requesterName}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Items: {selectedRequest.items?.length || 0} | Total Qty: {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuance Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  className="input"
                  placeholder="Enter issuance details..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowIssueModal(false);
                    setRemarks('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleIssue(selectedRequest._id)}
                  disabled={!remarks.trim() || processingId === selectedRequest._id}
                  className="btn btn-primary"
                >
                  {processingId === selectedRequest._id ? (
                    <>
                      <span className="spinner-sm"></span>
                      Processing...
                    </>
                  ) : (
                    'Confirm Issuance'
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

export default ApproveRequests;