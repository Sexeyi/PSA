import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './ListOfSupplies.css';

const ListOfSupplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ saving: false, success: false, error: null });

  // Certification state
  const [certification, setCertification] = useState({
    preparedBy: 'Ma. Athena Marie B. Aguilar',
    preparedByTitle: 'Administrative Officer I',
    certifiedBy: 'Jan Michael S. Pastor',
    certifiedByTitle: 'Accountant I',
    approvedBy: 'Jeanette R. Marzan',
    approvedByTitle: 'Chief Statistical Specialist',
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  });

  // Fetch inventory from backend
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/inventories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch inventory');

      const data = await response.json();
      setSupplies(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = ['all', ...new Set(supplies.map(item => item.category).filter(Boolean))];
    return uniqueCategories;
  }, [supplies]);

  const getCategoryCount = useCallback((category) => {
    return category === 'all' ? supplies.length : supplies.filter(i => i.category === category).length;
  }, [supplies]);

  const filteredAndSortedItems = useMemo(() => {
    let items = [...supplies];

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i =>
        i.name?.toLowerCase().includes(term) ||
        i.unit?.toLowerCase().includes(term) ||
        i.category?.toLowerCase().includes(term)
      );
    }

    // Sort items
    items.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'totalValue') {
        aVal = a.balances?.total || 0;
        bVal = b.balances?.total || 0;
      } else if (sortConfig.key === 'balanceQty') {
        aVal = a.balances?.qty || 0;
        bVal = b.balances?.qty || 0;
      } else if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return items;
  }, [supplies, searchTerm, sortConfig, selectedCategory]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsModalOpen(true);
    setSaveStatus({ saving: false, success: false, error: null });
  }, []);

  const handleInputChange = useCallback((e, section, field) => {
    const { value } = e.target;
    setEditingItem(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: parseFloat(value) || 0 },
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const calculateItemTotals = useCallback((item) => {
    const updatedItem = { ...item };

    // Calculate starting inventory total
    updatedItem.startingInventory.total = updatedItem.startingInventory.qty * updatedItem.startingInventory.unitPrice;

    // Calculate additions total
    updatedItem.additions.total = updatedItem.additions.qty * updatedItem.additions.unitPrice;

    // Calculate issuances total
    updatedItem.issuances.total = updatedItem.issuances.qty * updatedItem.issuances.unitPrice;

    // Calculate total for issuance
    updatedItem.totalForIssuance.qty = updatedItem.startingInventory.qty + updatedItem.additions.qty;
    const totalValue = updatedItem.startingInventory.total + updatedItem.additions.total;
    updatedItem.totalForIssuance.unitPrice = updatedItem.totalForIssuance.qty > 0 ? totalValue / updatedItem.totalForIssuance.qty : 0;
    updatedItem.totalForIssuance.total = totalValue;

    // Calculate balances
    updatedItem.balances.qty = updatedItem.totalForIssuance.qty - updatedItem.issuances.qty;
    updatedItem.balances.unitPrice = updatedItem.totalForIssuance.unitPrice;
    updatedItem.balances.total = updatedItem.balances.qty * updatedItem.balances.unitPrice;

    return updatedItem;
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingItem) return;

    setSaveStatus({ saving: true, success: false, error: null });

    const updatedItem = calculateItemTotals(editingItem);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/inventory/${updatedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedItem)
      });

      if (!response.ok) throw new Error('Failed to save inventory');

      setSupplies(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      setSaveStatus({ saving: false, success: true, error: null });

      setTimeout(() => {
        setIsModalOpen(false);
        setEditingItem(null);
        setSaveStatus({ saving: false, success: false, error: null });
      }, 1000);
    } catch (err) {
      console.error('Error saving inventory:', err);
      setSaveStatus({ saving: false, success: false, error: err.message });
    }
  }, [editingItem, calculateItemTotals]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSaveStatus({ saving: false, success: false, error: null });
  }, []);

  const formatCurrency = useCallback((num) => {
    if (num === undefined || num === null) return '₱0.00';
    return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatNumber = useCallback((num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US');
  }, []);

  const calculateTotalInventoryValue = useCallback(() => {
    return supplies.reduce((sum, item) => sum + (item.balances?.total || 0), 0);
  }, [supplies]);

  const getSortIcon = useCallback((key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }, [sortConfig]);

  const clearSearch = useCallback(() => setSearchTerm(''), []);

  const handleCertificationChange = useCallback((e) => {
    const { name, value } = e.target;
    setCertification(prev => ({ ...prev, [name]: value }));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Inventory</h3>
        <p>{error}</p>
        <button onClick={fetchInventory} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="supplies-container">
      {/* Header Section */}
      <div className="supplies-header">
        <div className="header-title">
          <h1>Inventory of Office Supplies</h1>
          <p>PSA - Regional Office • As of {certification.date}</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span>Total Items</span>
            <strong>{supplies.length}</strong>
          </div>
          <div className="stat-badge">
            <span>Total Value</span>
            <strong>{formatCurrency(calculateTotalInventoryValue())}</strong>
          </div>
        </div>
      </div>

      <div className="supplies-content">
        {/* Categories Sidebar */}
        <aside className="category-sidebar">
          <h3>Categories</h3>
          <ul>
            {categories.map(cat => (
              <li
                key={cat}
                className={selectedCategory === cat ? 'active' : ''}
                onClick={() => setSelectedCategory(cat)}
              >
                <span className="category-name">
                  {cat === 'all' ? 'All Categories' : cat}
                </span>
                <span className="category-count">{getCategoryCount(cat)}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Table Section */}
        <main className="table-section">
          {/* Search and Controls */}
          <div className="table-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by item name, unit, or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={clearSearch} className="clear-search" aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
            <div className="table-info">
              <span>Showing {filteredAndSortedItems.length} of {supplies.length} items</span>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="table-scroll-wrapper">
            <table className="supplies-table">
              <thead>
                <tr>
                  <th rowSpan="2" onClick={() => handleSort('name')}>
                    Item Name {getSortIcon('name')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('unit')}>
                    Unit {getSortIcon('unit')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('category')}>
                    Category {getSortIcon('category')}
                  </th>
                  <th colSpan="3">Starting Inventory</th>
                  <th colSpan="3">Additions</th>
                  <th colSpan="3">Total for Issuance</th>
                  <th colSpan="3">Issuances</th>
                  <th colSpan="3">Balances</th>
                  <th rowSpan="2">Actions</th>
                </tr>
                <tr>
                  <th>Qty</th><th>Unit Price</th><th>Total</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td colSpan="19" className="no-results">
                      <div className="no-results-content">
                        <span className="no-results-icon">📦</span>
                        <p>No items found</p>
                        <small>Try adjusting your search or filter</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map(item => (
                    <tr key={item.id} className={item.balances?.qty === 0 ? 'out-of-stock' : ''}>
                      <td className="item-name">{item.name}</td>
                      <td>{item.unit}</td>
                      <td><span className="category-tag">{item.category}</span></td>
                      <td className="quantity">{formatNumber(item.startingInventory?.qty)}</td>
                      <td className="price">{formatCurrency(item.startingInventory?.unitPrice)}</td>
                      <td className="total">{formatCurrency(item.startingInventory?.total)}</td>
                      <td className="quantity">{formatNumber(item.additions?.qty)}</td>
                      <td className="price">{formatCurrency(item.additions?.unitPrice)}</td>
                      <td className="total">{formatCurrency(item.additions?.total)}</td>
                      <td className="quantity">{formatNumber(item.totalForIssuance?.qty)}</td>
                      <td className="price">{formatCurrency(item.totalForIssuance?.unitPrice)}</td>
                      <td className="total">{formatCurrency(item.totalForIssuance?.total)}</td>
                      <td className="quantity">{formatNumber(item.issuances?.qty)}</td>
                      <td className="price">{formatCurrency(item.issuances?.unitPrice)}</td>
                      <td className="total">{formatCurrency(item.issuances?.total)}</td>
                      <td className="quantity balance-qty">{formatNumber(item.balances?.qty)}</td>
                      <td className="price balance-price">{formatCurrency(item.balances?.unitPrice)}</td>
                      <td className="total balance-total">{formatCurrency(item.balances?.total)}</td>
                      <td>
                        <button onClick={() => handleEdit(item)} className="edit-btn">
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredAndSortedItems.length > 0 && (
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="18" className="total-label">TOTAL INVENTORY VALUE:</td>
                    <td className="total-value">
                      {formatCurrency(filteredAndSortedItems.reduce((sum, item) => sum + (item.balances?.total || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </main>
      </div>

      {/* Certification Section */}
      <div className="certification-section">
        <h3>Certification</h3>
        <div className="certification-content">
          <div className="certification-grid">
            <div className="cert-field">
              <label>Prepared by:</label>
              <input
                type="text"
                name="preparedBy"
                value={certification.preparedBy}
                onChange={handleCertificationChange}
              />
              <small>{certification.preparedByTitle}</small>
            </div>
            <div className="cert-field">
              <label>Certified by:</label>
              <input
                type="text"
                name="certifiedBy"
                value={certification.certifiedBy}
                onChange={handleCertificationChange}
              />
              <small>{certification.certifiedByTitle}</small>
            </div>
            <div className="cert-field">
              <label>Approved by:</label>
              <input
                type="text"
                name="approvedBy"
                value={certification.approvedBy}
                onChange={handleCertificationChange}
              />
              <small>{certification.approvedByTitle}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Inventory Item</h2>
              <button className="modal-close" onClick={handleCancel}>✕</button>
            </div>

            <div className="modal-body">
              <div className="item-info">
                <h4>{editingItem.name}</h4>
                <p className="item-meta">{editingItem.category} • {editingItem.unit}</p>
              </div>

              {['startingInventory', 'additions', 'issuances'].map(section => (
                <div key={section} className="modal-section">
                  <h4>
                    {section === 'startingInventory' ? '📦 Starting Inventory' :
                      section === 'additions' ? '➕ Additions / Adjustments' :
                        '📤 Issuances'}
                  </h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={editingItem[section].qty}
                        onChange={e => handleInputChange(e, section, 'qty')}
                        step="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit Price (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem[section].unitPrice}
                        onChange={e => handleInputChange(e, section, 'unitPrice')}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {saveStatus.error && (
                <div className="error-message">
                  ⚠️ {saveStatus.error}
                </div>
              )}

              {saveStatus.success && (
                <div className="success-message">
                  ✓ Item updated successfully!
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saveStatus.saving}
              >
                {saveStatus.saving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfSupplies;