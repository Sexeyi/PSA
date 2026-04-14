import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
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
      const allRequests = data.data || [];
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
      const requestsData = data.data || [];

      let filteredData = requestsData;
      if (filter !== 'all') {
        filteredData = requestsData.filter(req =>
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

  const formatCurrencyValue = useCallback((value) => {
    if (!value || value === 0) return '';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const getStatusBadge = useCallback((status) => {
    const normalizedStatus = (status || '').toLowerCase();
    const badges = {
      approved: { class: 'badge-approved', text: 'Approved' },
      rejected: { class: 'badge-rejected', text: 'Rejected' },
      issued: { class: 'badge-issued', text: 'Issued' }
    };
    const config = badges[normalizedStatus] || { class: 'badge-default', text: status || 'Unknown' };
    return (
      <span className={`status-badge ${config.class}`}>
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
    return requests.filter(req => {
      const requesterName = typeof req.requesterName === 'object'
        ? req.requesterName?.fullName || ''
        : req.requesterName || '';
      const department = typeof req.department === 'object'
        ? req.department?.name || ''
        : req.department || '';

      return requesterName.toLowerCase().includes(term) ||
        department.toLowerCase().includes(term) ||
        (req.employeeId || '').toLowerCase().includes(term);
    });
  }, [requests, searchTerm]);

  // Export single requisition to Excel with professional format
  const handleExportSingleToExcel = useCallback((request) => {
    try {
      const requesterName = typeof request.requesterName === 'object'
        ? request.requesterName?.fullName || 'Unknown'
        : request.requesterName || 'Unknown';

      const department = typeof request.department === 'object'
        ? request.department?.name || 'N/A'
        : request.department || 'N/A';

      // Prepare report data for single requisition
      const reportData = [];

      // Add header rows
      reportData.push(['Republic of the Philippines', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Philippine Statistics Authority', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Ilocos Sur Provincial Statistical Office', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Vigan City, Ilocos Sur', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([]);
      reportData.push(['REQUISITION AND ISSUANCE REPORT', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([`Requisition ID: ${request._id?.slice(-8).toUpperCase()}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([`Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([]);

      // Requester Information
      reportData.push(['REQUESTER INFORMATION', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Name:', requesterName, '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Department:', department, '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Employee ID:', request.employeeId || 'N/A', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Date Requested:', request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Status:', request.status || 'N/A', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      if (request.approvedBy) {
        reportData.push(['Processed By:', request.approvedBy, '', '', '', '', '', '', '', '', '', '', '', '', '']);
        reportData.push(['Date Processed:', request.approvedDate ? new Date(request.approvedDate).toLocaleString() : 'N/A', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      }
      if (request.approverRemarks || request.notes) {
        reportData.push(['Remarks:', request.approverRemarks || request.notes, '', '', '', '', '', '', '', '', '', '', '', '', '']);
      }
      reportData.push([]);

      // Items Table Header
      reportData.push(['REQUESTED ITEMS', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([
        'Item #', 'Item Name/Description', 'Category', 'Unit',
        'Quantity', 'Unit Price', 'Total Amount', '', '', '', '', '', '', '', ''
      ]);

      // Items Data
      let totalQuantity = 0;
      let totalValue = 0;

      request.items?.forEach((item, index) => {
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const total = quantity * unitPrice;

        totalQuantity += quantity;
        totalValue += total;

        reportData.push([
          (index + 1).toString(),
          item.itemName || 'N/A',
          item.category || 'N/A',
          item.unit || 'piece',
          quantity,
          formatCurrencyValue(unitPrice),
          formatCurrencyValue(total),
          '', '', '', '', '', '', '', ''
        ]);
      });

      // Totals Row
      reportData.push([
        '', '', '', '', 'TOTAL:', formatCurrencyValue(totalQuantity), formatCurrencyValue(totalValue),
        '', '', '', '', '', '', '', ''
      ]);

      reportData.push([]);
      reportData.push([]);

      // Signature Section
      reportData.push(['APPROVAL SIGNATURES', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Requested by:', requesterName, '', '', 'Approved by:', request.approvedBy || '_____________________', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Date:', request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '________', '', '', 'Date:', request.approvedDate ? new Date(request.approvedDate).toLocaleDateString() : '________', '', '', '', '', '', '', '', '', '', '']);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(reportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 10 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 5 },
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 },
        { wch: 5 }, { wch: 5 }, { wch: 5 }
      ];

      // Merge cells for better appearance
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 14 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 14 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 14 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 14 } },
        { s: { r: 7, c: 0 }, e: { r: 7, c: 14 } },
        { s: { r: 9, c: 0 }, e: { r: 9, c: 14 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 1 } },
        { s: { r: 12, c: 0 }, e: { r: 12, c: 1 } },
        { s: { r: 13, c: 0 }, e: { r: 13, c: 1 } },
        { s: { r: 14, c: 0 }, e: { r: 14, c: 1 } },
        { s: { r: 15, c: 0 }, e: { r: 15, c: 1 } },
        { s: { r: 17, c: 0 }, e: { r: 17, c: 14 } },
        { s: { r: 18, c: 0 }, e: { r: 18, c: 14 } },
        { s: { r: 24, c: 0 }, e: { r: 24, c: 14 } },
        { s: { r: 25, c: 0 }, e: { r: 25, c: 3 } },
        { s: { r: 25, c: 4 }, e: { r: 25, c: 7 } }
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Requisition Report');

      // Generate filename
      const filename = `Requisition_${request._id?.slice(-8)}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setSuccess('Requisition exported to Excel successfully');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export requisition to Excel');
      setTimeout(() => setError(''), 3000);
    }
  }, [formatCurrencyValue]);

  // Export to Excel with inventory report format (Bulk Export)
  const handleExportToExcel = useCallback(() => {
    try {
      // Group items by category
      const groupedByCategory = {};

      filteredRequests.forEach(request => {
        const category = request.category || 'OFFICE SUPPLIES';
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = [];
        }

        request.items?.forEach(item => {
          // Check if item already exists in the category
          const existingItem = groupedByCategory[category].find(i => i.name === item.itemName);

          if (existingItem) {
            // Aggregate quantities if same item appears multiple times
            existingItem.totalForIssuanceQty += item.quantity || 0;
            existingItem.totalForIssuanceTotal = existingItem.totalForIssuanceQty * existingItem.totalForIssuanceUnitPrice;
            existingItem.balancesQty = existingItem.totalForIssuanceQty;
            existingItem.balancesTotal = existingItem.balancesQty * existingItem.balancesUnitPrice;
          } else {
            groupedByCategory[category].push({
              name: item.itemName,
              unit: item.unit || 'piece',
              beginningQty: 0,
              beginningUnitPrice: item.unitPrice || 0,
              beginningTotal: 0,
              additionsQty: 0,
              additionsUnitPrice: 0,
              additionsTotal: 0,
              totalForIssuanceQty: item.quantity || 0,
              totalForIssuanceUnitPrice: item.unitPrice || 0,
              totalForIssuanceTotal: (item.quantity || 0) * (item.unitPrice || 0),
              issuancesQty: 0,
              issuancesUnitPrice: 0,
              issuancesTotal: 0,
              balancesQty: item.quantity || 0,
              balancesUnitPrice: item.unitPrice || 0,
              balancesTotal: (item.quantity || 0) * (item.unitPrice || 0)
            });
          }
        });
      });

      // Prepare report data with proper formatting
      const reportData = [];

      // Add header rows
      reportData.push(['Republic of the Philippines', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Philippine Statistics Authority', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Ilocos Sur Provincial Statistical Office', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push(['Vigan City, Ilocos Sur', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([]);
      reportData.push(['INVENTORY OF OFFICE SUPPLIES', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([`as of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      reportData.push([]);

      // Main header row
      reportData.push([
        'Item Name/Description', 'Unit',
        'INVENTORY AS OF DECEMBER 31, 2025', '', '',
        'ADDITIONS/ADJUSTMENTS', '', '',
        'TOTAL INVENTORY FOR ISSUANCE', '', '',
        'ISSUANCES', '', '',
        'BALANCES', '', ''
      ]);

      // Sub-header row
      reportData.push([
        '', '',
        'Quantity', 'Unit Price', 'Total Amount',
        'Quantity', 'Unit Price', 'Total Amount',
        'Quantity', 'Unit Price', 'Total Amount',
        'Quantity', 'Unit Price', 'Total Amount',
        'Quantity', 'Unit Price', 'Total Amount'
      ]);

      // Add data by category
      Object.keys(groupedByCategory).sort().forEach(category => {
        // Add category header
        reportData.push([category.toUpperCase(), '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

        // Add items
        groupedByCategory[category].forEach(item => {
          reportData.push([
            item.name,
            item.unit,
            item.beginningQty === 0 ? '' : item.beginningQty,
            item.beginningUnitPrice === 0 ? '' : formatCurrencyValue(item.beginningUnitPrice),
            item.beginningTotal === 0 ? '' : formatCurrencyValue(item.beginningTotal),
            item.additionsQty === 0 ? '' : item.additionsQty,
            item.additionsUnitPrice === 0 ? '' : formatCurrencyValue(item.additionsUnitPrice),
            item.additionsTotal === 0 ? '' : formatCurrencyValue(item.additionsTotal),
            item.totalForIssuanceQty === 0 ? '' : item.totalForIssuanceQty,
            item.totalForIssuanceUnitPrice === 0 ? '' : formatCurrencyValue(item.totalForIssuanceUnitPrice),
            item.totalForIssuanceTotal === 0 ? '' : formatCurrencyValue(item.totalForIssuanceTotal),
            item.issuancesQty === 0 ? '' : item.issuancesQty,
            item.issuancesUnitPrice === 0 ? '' : formatCurrencyValue(item.issuancesUnitPrice),
            item.issuancesTotal === 0 ? '' : formatCurrencyValue(item.issuancesTotal),
            item.balancesQty === 0 ? '' : item.balancesQty,
            item.balancesUnitPrice === 0 ? '' : formatCurrencyValue(item.balancesUnitPrice),
            item.balancesTotal === 0 ? '' : formatCurrencyValue(item.balancesTotal)
          ]);
        });

        // Add empty row after category
        reportData.push([]);
      });

      // Add totals row
      const totalBeginningQty = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.beginningQty || 0), 0), 0);
      const totalBeginningTotal = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.beginningTotal || 0), 0), 0);
      const totalAdditionsQty = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.additionsQty || 0), 0), 0);
      const totalAdditionsTotal = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.additionsTotal || 0), 0), 0);
      const totalForIssuanceQty = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.totalForIssuanceQty || 0), 0), 0);
      const totalForIssuanceTotal = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.totalForIssuanceTotal || 0), 0), 0);
      const totalIssuancesQty = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.issuancesQty || 0), 0), 0);
      const totalIssuancesTotal = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.issuancesTotal || 0), 0), 0);
      const totalBalancesQty = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.balancesQty || 0), 0), 0);
      const totalBalancesTotal = Object.values(groupedByCategory).reduce((sum, items) =>
        sum + items.reduce((s, i) => s + (i.balancesTotal || 0), 0), 0);

      reportData.push([
        'TOTAL', '',
        totalBeginningQty || '', '', formatCurrencyValue(totalBeginningTotal),
        totalAdditionsQty || '', '', formatCurrencyValue(totalAdditionsTotal),
        totalForIssuanceQty || '', '', formatCurrencyValue(totalForIssuanceTotal),
        totalIssuancesQty || '', '', formatCurrencyValue(totalIssuancesTotal),
        totalBalancesQty || '', '', formatCurrencyValue(totalBalancesTotal)
      ]);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(reportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 40 }, // Item Name
        { wch: 10 }, // Unit
        { wch: 12 }, // Beginning Qty
        { wch: 15 }, // Beginning Unit Price
        { wch: 15 }, // Beginning Total
        { wch: 12 }, // Additions Qty
        { wch: 15 }, // Additions Unit Price
        { wch: 15 }, // Additions Total
        { wch: 12 }, // Total Issuance Qty
        { wch: 15 }, // Total Issuance Unit Price
        { wch: 15 }, // Total Issuance Total
        { wch: 12 }, // Issuances Qty
        { wch: 15 }, // Issuances Unit Price
        { wch: 15 }, // Issuances Total
        { wch: 12 }, // Balances Qty
        { wch: 15 }, // Balances Unit Price
        { wch: 15 }  // Balances Total
      ];

      // Merge header cells for better appearance
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 16 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 16 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 16 } },
        { s: { r: 7, c: 2 }, e: { r: 7, c: 4 } },
        { s: { r: 7, c: 5 }, e: { r: 7, c: 7 } },
        { s: { r: 7, c: 8 }, e: { r: 7, c: 10 } },
        { s: { r: 7, c: 11 }, e: { r: 7, c: 13 } },
        { s: { r: 7, c: 14 }, e: { r: 7, c: 16 } }
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `Inventory_Report_${date}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setSuccess(`Inventory report exported successfully`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export inventory report');
      setTimeout(() => setError(''), 3000);
    }
  }, [filteredRequests, formatCurrencyValue]);

  const handleIssue = useCallback(async (requestId) => {
    if (!remarks.trim()) {
      alert("Please provide issuance remarks");
      return;
    }

    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/requisitions/${requestId}/issued`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          remarks: remarks
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
          <div className="header-actions">
            <button
              onClick={handleExportToExcel}
              className="btn-excel"
              disabled={filteredRequests.length === 0}
            >
              Export All to Excel
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-message">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-message">{success}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-approved">
            <div className="stat-info">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{getAccurateStatusCount('approved')}</span>
            </div>
          </div>
          <div className="stat-card stat-issued">
            <div className="stat-info">
              <span className="stat-label">Issued</span>
              <span className="stat-value">{getAccurateStatusCount('issued')}</span>
            </div>
          </div>
          <div className="stat-card stat-rejected">
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
              <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
        </div>

        {/* Request Cards Grid */}
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
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

                const requesterName = typeof request.requesterName === 'object'
                  ? request.requesterName?.fullName || 'Unknown'
                  : request.requesterName || 'Unknown';
                const department = typeof request.department === 'object'
                  ? request.department?.name || 'N/A'
                  : request.department || 'N/A';

                return (
                  <div key={request._id} className={`request-card ${normalizedStatus}`}>
                    {/* Card Header */}
                    <div className="card-header">
                      <div className="requester-info">
                        <h3 className="requester-name">{requesterName}</h3>
                        <p className="requester-dept">{department}</p>
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
                          <p className="notes-label">Notes:</p>
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
                            onClick={() => handleExportSingleToExcel(request)}
                            className="btn-excel-small"
                          >
                            Export Excel
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

              {/* Requester Information - Complete Details */}
              <div className="info-section">
                <h3 className="section-title">Requester Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>
                      {typeof selectedRequest.requesterName === 'object'
                        ? selectedRequest.requesterName?.fullName || 'Unknown'
                        : selectedRequest.requesterName || 'Unknown'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Employee ID</label>
                    <p>{selectedRequest.employeeId || selectedRequest.requesterId || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Department</label>
                    <p>
                      {typeof selectedRequest.department === 'object'
                        ? selectedRequest.department?.name || 'N/A'
                        : selectedRequest.department || 'N/A'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Position</label>
                    <p>{selectedRequest.position || selectedRequest.requesterPosition || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>
                      {typeof selectedRequest.requesterName === 'object'
                        ? selectedRequest.requesterName?.email || 'N/A'
                        : selectedRequest.email || 'N/A'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Contact Number</label>
                    <p>{selectedRequest.contactNumber || selectedRequest.requesterContact || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Requisition Details */}
              <div className="info-section">
                <h3 className="section-title">Requisition Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Requisition ID</label>
                    <p className="requisition-id">{selectedRequest._id}</p>
                  </div>
                  <div className="info-item">
                    <label>Date Requested</label>
                    <p>{formatDate(selectedRequest.createdAt || selectedRequest.dateRequested)}</p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <p>{getStatusBadge(selectedRequest.status)}</p>
                  </div>
                  <div className="info-item">
                    <label>Priority Level</label>
                    <p>
                      <span className={`priority-badge priority-${(selectedRequest.priority || 'medium').toLowerCase()}`}>
                        {(selectedRequest.priority || 'Medium').charAt(0).toUpperCase() + (selectedRequest.priority || 'medium').slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Purpose / Notes */}
              {(selectedRequest.notes || selectedRequest.purpose) && (
                <div className="notes-section">
                  <h3 className="section-title">Purpose / Notes</h3>
                  <p className="notes-content">{selectedRequest.notes || selectedRequest.purpose}</p>
                </div>
              )}

              {/* Processing Information (for approved/rejected/issued requests) */}
              {(selectedRequest.status?.toLowerCase() !== 'pending') && (
                <div className="info-section">
                  <h3 className="section-title">Processing Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Processed By</label>
                      <p>{selectedRequest.approvedBy || selectedRequest.processedBy || 'N/A'}</p>
                    </div>
                    <div className="info-item">
                      <label>Date Processed</label>
                      <p>{formatDate(selectedRequest.approvedDate || selectedRequest.processedDate)}</p>
                    </div>
                    <div className="info-item">
                      <label>Processing Remarks</label>
                      <p>{selectedRequest.approverRemarks || selectedRequest.remarks || 'No remarks'}</p>
                    </div>
                    {selectedRequest.status?.toLowerCase() === 'issued' && (
                      <>
                        <div className="info-item">
                          <label>Issued By</label>
                          <p>{selectedRequest.issuedBy || selectedRequest.approvedBy || 'N/A'}</p>
                        </div>
                        <div className="info-item">
                          <label>Date Issued</label>
                          <p>{formatDate(selectedRequest.issuedDate || selectedRequest.approvedDate)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Items Table - Complete with all items */}
              <div>
                <h3 className="section-title">Requested Items</h3>
                <div className="items-summary-stats">
                  <div className="summary-stat">
                    <span className="stat-label">Total Items:</span>
                    <span className="stat-value">{selectedRequest.items?.length || 0}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Total Quantity:</span>
                    <span className="stat-value">
                      {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Total Amount:</span>
                    <span className="stat-value">
                      {formatCurrency(selectedRequest.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                    </span>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Unit</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items && selectedRequest.items.length > 0 ? (
                        selectedRequest.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="item-name-cell">{item.itemName || 'N/A'}</td>
                            <td>{item.category || '—'}</td>
                            <td>{item.unit || '—'}</td>
                            <td className="text-right">{item.quantity || 0}</td>
                            <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-right total-cell">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No items found</td>
                        </tr>
                      )}
                    </tbody>
                    {selectedRequest.items && selectedRequest.items.length > 0 && (
                      <tfoot>
                        <tr className="total-row">
                          <td colSpan="4" className="text-right"><strong>GRAND TOTAL:</strong></td>
                          <td className="text-right">
                            <strong>
                              {selectedRequest.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                            </strong>
                          </td>
                          <td className="text-right">—</td>
                          <td className="text-right total-value">
                            <strong>
                              {formatCurrency(selectedRequest.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                            </strong>
                          </td>
                        </tr>
                      </tfoot>
                    )}
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
              {selectedRequest.status?.toLowerCase() === 'issued' && (
                <button
                  onClick={() => handleExportSingleToExcel(selectedRequest)}
                  className="btn-excel-modal"
                >
                  Export to Excel
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
                  <span className="issue-value">
                    {typeof selectedRequest.requesterName === 'object'
                      ? selectedRequest.requesterName?.fullName || 'Unknown'
                      : selectedRequest.requesterName || 'Unknown'}
                  </span>
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