import React, { useState } from 'react';
import './History.css';

const History = ({ isOpen = true, onClose, historyData: propHistoryData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Determine if component is used as modal or full page
  const isModal = typeof onClose === 'function';

  // Use prop data if available, otherwise use default
  const historyData = propHistoryData || [
    {
      id: 1,
      requester: 'Nicole',
      department: 'Admin Department',
      date: '2024-01-15',
      type: 'Request',
      items: [
        { name: 'Laptop', quantity: 2, status: 'Approved' },
        { name: 'Mouse', quantity: 5, status: 'Approved' }
      ],
      status: 'Completed'
    },
    {
      id: 2,
      requester: 'Jasmine',
      department: 'HR Department',
      date: '2024-01-14',
      type: 'Request',
      items: [
        { name: 'Printer Paper', quantity: 10, status: 'Pending' }
      ],
      status: 'Pending'
    },
    {
      id: 3,
      requester: 'JM',
      department: 'Finance Department',
      date: '2024-01-13',
      type: 'Return',
      items: [
        { name: 'Calculator', quantity: 1, status: 'Completed' }
      ],
      status: 'Completed'
    },
    {
      id: 4,
      requester: 'Ella',
      department: 'Finance Department',
      date: '2024-01-12',
      type: 'Request',
      items: [
        { name: 'Projector', quantity: 1, status: 'Approved' },
        { name: 'Whiteboard Markers', quantity: 20, status: 'Approved' }
      ],
      status: 'Completed'
    },
    {
      id: 5,
      requester: 'Daryll',
      department: 'Statistical Department',
      date: '2024-01-11',
      type: 'Request',
      items: [
        { name: 'Safety Gloves', quantity: 50, status: 'Approved' }
      ],
      status: 'Completed'
    }
  ];

  // Filter data based on search and filter
  const filteredData = historyData.filter(item => {
    const matchesSearch = item.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Get statistics
  const totalRequests = historyData.length;
  const completedCount = historyData.filter(item => item.status === 'Completed').length;
  const pendingCount = historyData.filter(item => item.status === 'Pending').length;
  const requestCount = historyData.filter(item => item.type === 'Request').length;
  const returnCount = historyData.filter(item => item.type === 'Return').length;

  const toggleExpand = (id) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  // Modal layout
  if (isModal) {
    return (
      <div className="history-modal-overlay" onClick={handleClose}>
        <div className="history-modal" onClick={e => e.stopPropagation()}>
          <div className="history-header">
            <div>
              <h2>History Log</h2>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Track all supply requests and returns</p>
            </div>
            <button className="close-btn" onClick={handleClose}>&times;</button>
          </div>
          <div className="history-content">
            <div className="requester-summary">
              <h3>Overview</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-value">{totalRequests}</div>
                  <div className="summary-label">Total Records</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value">{completedCount}</div>
                  <div className="summary-label">Completed</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value">{pendingCount}</div>
                  <div className="summary-label">Pending</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value">{requestCount}</div>
                  <div className="summary-label">Requests</div>
                </div>
              </div>
            </div>
            <div className="history-filters">
              <input
                type="text"
                className="search-input"
                placeholder="Search by requester or department..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select
                className="filter-select"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Request">Requests</option>
                <option value="Return">Returns</option>
              </select>
            </div>
            <div className="history-list">
              <h3>Recent Activity</h3>
              {filteredData.length === 0 ? (
                <div className="no-results">No history found matching your criteria</div>
              ) : (
                filteredData.map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header" onClick={() => toggleExpand(item.id)}>
                      <div className="history-item-info">
                        <span className="requester-name">{item.requester}</span>
                        <span className="department">{item.department}</span>
                      </div>
                      <div className="history-item-meta">
                        <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
                        <span className="type">{item.type}</span>
                        <span className="date">{item.date}</span>
                        <span className="expand-icon">{expandedRequest === item.id ? '−' : '+'}</span>
                      </div>
                    </div>
                    {expandedRequest === item.id && (
                      <div className="history-item-details">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Quantity</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.items.map((detail, idx) => (
                              <tr key={idx}>
                                <td>{detail.name}</td>
                                <td>{detail.quantity}</td>
                                <td><span className={`item-status ${detail.status.toLowerCase()}`}>{detail.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full page layout (when accessed from sidebar)
  return (
    <div className="history-page">
      <div className="history-page-header">
        <div>
          <h1 className="history-page-title">History Log</h1>
          <p className="history-page-subtitle">Track all supply requests and returns</p>
        </div>
      </div>

      <div className="history-page-stats">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <span className="stat-count">{totalRequests}</span>
            <span className="stat-label">Total Records</span>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <span className="stat-count">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <span className="stat-count">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card requests">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <span className="stat-count">{requestCount}</span>
            <span className="stat-label">Requests</span>
          </div>
        </div>
        <div className="stat-card returns">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <span className="stat-count">{returnCount}</span>
            <span className="stat-label">Returns</span>
          </div>
        </div>
      </div>

      <div className="history-page-filters">
        <div className="search-box">
          <span className="search-icon"></span>
          <input
            type="text"
            placeholder="Search by requester or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="page-search-input"
          />
        </div>
        <select
          className="page-filter-select"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Request">Requests</option>
          <option value="Return">Returns</option>
        </select>
      </div>

      <div className="history-page-list">
        {filteredData.length === 0 ? (
          <div className="page-no-results">
            <span className="no-results-icon">📭</span>
            <p>No history found matching your criteria</p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div key={item.id} className={`page-history-item ${expandedRequest === item.id ? 'expanded' : ''}`}>
              <div className="page-item-header" onClick={() => toggleExpand(item.id)}>
                <div className="page-item-info">
                  <span className="page-item-requester">{item.requester}</span>
                  <span className="page-item-department">{item.department}</span>
                </div>
                <div className="page-item-meta">
                  <span className={`page-status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                  <span className={`page-type-badge ${item.type.toLowerCase()}`}>
                    {item.type}
                  </span>
                  <span className="page-item-date">{item.date}</span>
                  <button className="page-expand-btn">
                    {expandedRequest === item.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              {expandedRequest === item.id && (
                <div className="page-item-details">
                  <div className="details-title">Items Requested</div>
                  <table className="page-items-table">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.items.map((detail, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="item-cell">
                              <span className="item-icon"></span>
                              {detail.name}
                            </div>
                          </td>
                          <td>{detail.quantity}</td>
                          <td>
                            <span className={`page-item-status ${detail.status.toLowerCase()}`}>
                              {detail.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
