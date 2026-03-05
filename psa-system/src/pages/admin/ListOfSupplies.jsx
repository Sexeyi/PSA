import React, { useState, useMemo } from 'react';
import './ListOfSupplies.css';

const ListOfSupplies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Initial data for supplies
  const initialSupplies = [
    { id: 1, name: 'Ballpen (black, blue, red)', unit: 'piece', category: 'Writing', inventoryDec31: { qty: 150, unitPrice: 12.50, total: 1875.00 }, additions: { qty: 50, unitPrice: 13.00, total: 650.00 }, totalForIssuance: { qty: 200, unitPrice: 12.62, total: 2524.00 }, issuances: { qty: 45, unitPrice: 12.62, total: 567.90 }, balances: { qty: 155, unitPrice: 12.62, total: 1956.10 } },
    { id: 2, name: 'Battery (AA, AAA)', unit: 'piece', category: 'Electronics', inventoryDec31: { qty: 80, unitPrice: 25.00, total: 2000.00 }, additions: { qty: 20, unitPrice: 26.00, total: 520.00 }, totalForIssuance: { qty: 100, unitPrice: 25.20, total: 2520.00 }, issuances: { qty: 15, unitPrice: 25.20, total: 378.00 }, balances: { qty: 85, unitPrice: 25.20, total: 2142.00 } },
    { id: 3, name: 'Binder clips (various sizes)', unit: 'box', category: 'Fasteners', inventoryDec31: { qty: 45, unitPrice: 45.00, total: 2025.00 }, additions: { qty: 10, unitPrice: 48.00, total: 480.00 }, totalForIssuance: { qty: 55, unitPrice: 45.55, total: 2505.25 }, issuances: { qty: 12, unitPrice: 45.55, total: 546.60 }, balances: { qty: 43, unitPrice: 45.55, total: 1958.65 } },
    { id: 4, name: 'Bond paper (different sizes/types)', unit: 'ream', category: 'Paper', inventoryDec31: { qty: 200, unitPrice: 220.00, total: 44000.00 }, additions: { qty: 50, unitPrice: 225.00, total: 11250.00 }, totalForIssuance: { qty: 250, unitPrice: 221.00, total: 55250.00 }, issuances: { qty: 75, unitPrice: 221.00, total: 16575.00 }, balances: { qty: 175, unitPrice: 221.00, total: 38675.00 } },
    { id: 5, name: 'Correction tape', unit: 'piece', category: 'Writing', inventoryDec31: { qty: 60, unitPrice: 35.00, total: 2100.00 }, additions: { qty: 15, unitPrice: 36.50, total: 547.50 }, totalForIssuance: { qty: 75, unitPrice: 35.30, total: 2647.50 }, issuances: { qty: 8, unitPrice: 35.30, total: 282.40 }, balances: { qty: 67, unitPrice: 35.30, total: 2365.10 } },
    { id: 6, name: 'Envelopes (documentary, mailing, expanding)', unit: 'piece', category: 'Paper', inventoryDec31: { qty: 350, unitPrice: 8.50, total: 2975.00 }, additions: { qty: 100, unitPrice: 9.00, total: 900.00 }, totalForIssuance: { qty: 450, unitPrice: 8.61, total: 3874.50 }, issuances: { qty: 120, unitPrice: 8.61, total: 1033.20 }, balances: { qty: 330, unitPrice: 8.61, total: 2841.30 } },
    { id: 7, name: 'Eraser', unit: 'piece', category: 'Writing', inventoryDec31: { qty: 90, unitPrice: 15.00, total: 1350.00 }, additions: { qty: 25, unitPrice: 16.00, total: 400.00 }, totalForIssuance: { qty: 115, unitPrice: 15.22, total: 1750.30 }, issuances: { qty: 18, unitPrice: 15.22, total: 273.96 }, balances: { qty: 97, unitPrice: 15.22, total: 1476.34 } },
    { id: 8, name: 'Fastener, metal', unit: 'box', category: 'Fasteners', inventoryDec31: { qty: 30, unitPrice: 60.00, total: 1800.00 }, additions: { qty: 8, unitPrice: 62.00, total: 496.00 }, totalForIssuance: { qty: 38, unitPrice: 60.42, total: 2295.96 }, issuances: { qty: 5, unitPrice: 60.42, total: 302.10 }, balances: { qty: 33, unitPrice: 60.42, total: 1993.86 } },
    { id: 9, name: 'Folders (ordinary, legal, etc.)', unit: 'piece', category: 'Paper', inventoryDec31: { qty: 280, unitPrice: 12.00, total: 3360.00 }, additions: { qty: 60, unitPrice: 12.50, total: 750.00 }, totalForIssuance: { qty: 340, unitPrice: 12.09, total: 4110.60 }, issuances: { qty: 95, unitPrice: 12.09, total: 1148.55 }, balances: { qty: 245, unitPrice: 12.09, total: 2962.05 } },
    { id: 10, name: 'Glue, all-purpose', unit: 'bottle', category: 'Adhesives', inventoryDec31: { qty: 65, unitPrice: 28.00, total: 1820.00 }, additions: { qty: 15, unitPrice: 29.50, total: 442.50 }, totalForIssuance: { qty: 80, unitPrice: 28.28, total: 2262.40 }, issuances: { qty: 22, unitPrice: 28.28, total: 622.16 }, balances: { qty: 58, unitPrice: 28.28, total: 1640.24 } },
  ];

  const [supplies, setSupplies] = useState(initialSupplies);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

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

  // Categories for filtering
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(supplies.map(item => item.category))];
    return cats;
  }, [supplies]);

  // Get category counts
  const getCategoryCount = (category) => {
    if (category === 'all') return supplies.length;
    return supplies.filter(item => item.category === category).length;
  };

  // Get total items count
  const getTotalItems = () => supplies.length;

  // Filter, search, and sort items
  const filteredAndSortedItems = useMemo(() => {
    let items = [...supplies];

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort items
    items.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortConfig.key === 'unit') {
        aVal = a.unit;
        bVal = b.unit;
      } else if (sortConfig.key === 'category') {
        aVal = a.category;
        bVal = b.category;
      } else if (sortConfig.key === 'totalValue') {
        aVal = a.balances.total;
        bVal = b.balances.total;
      }

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortConfig.direction === 'asc'
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    return items;
  }, [supplies, searchTerm, sortConfig, selectedCategory]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (item) => {
    setEditingItem(JSON.parse(JSON.stringify(item))); // Deep clone
    setIsModalOpen(true);
  };

  const handleInputChange = (e, section, field) => {
    const { value } = e.target;
    setEditingItem({
      ...editingItem,
      [section]: {
        ...editingItem[section],
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleCertificationChange = (e) => {
    const { name, value } = e.target;
    setCertification({
      ...certification,
      [name]: value
    });
  };

  const handleSave = () => {
    // Auto-calculate totals
    const updatedItem = { ...editingItem };

    // Calculate total for inventoryDec31
    updatedItem.inventoryDec31.total =
      updatedItem.inventoryDec31.qty * updatedItem.inventoryDec31.unitPrice;

    // Calculate total for additions
    updatedItem.additions.total =
      updatedItem.additions.qty * updatedItem.additions.unitPrice;

    // Calculate total for issuances
    updatedItem.issuances.total =
      updatedItem.issuances.qty * updatedItem.issuances.unitPrice;

    // Calculate total for issuance (inventory + additions)
    updatedItem.totalForIssuance.qty =
      updatedItem.inventoryDec31.qty + updatedItem.additions.qty;

    // Weighted average unit price
    const totalValue = updatedItem.inventoryDec31.total + updatedItem.additions.total;
    const totalQty = updatedItem.totalForIssuance.qty;
    updatedItem.totalForIssuance.unitPrice = totalQty > 0 ? totalValue / totalQty : 0;
    updatedItem.totalForIssuance.total = totalValue;

    // Calculate balances
    updatedItem.balances.qty =
      updatedItem.totalForIssuance.qty - updatedItem.issuances.qty;
    updatedItem.balances.unitPrice = updatedItem.totalForIssuance.unitPrice;
    updatedItem.balances.total =
      updatedItem.balances.qty * updatedItem.balances.unitPrice;

    const updatedSupplies = supplies.map(item =>
      item.id === editingItem.id ? updatedItem : item
    );

    setSupplies(updatedSupplies);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAndSortedItems.map(item => item.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (num) => {
    return `₱${formatNumber(num)}`;
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalValue = 0;
    filteredAndSortedItems.forEach(item => {
      totalValue += item.balances.total;
    });
    return totalValue;
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const clearSearch = () => setSearchTerm('');

  return (
    <div className="supplies-container">
      {/* Header with Stats */}
      <div className="supplies-header">
        <div>
          <h1>INVENTORY OF OFFICE SUPPLIES</h1>
          <p>PSA - Regional Office • As of {certification.date}</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            Total Items <span>{getTotalItems()}</span>
          </div>
          <div className="stat-badge">
            Total Value <span>{formatCurrency(calculateTotals())}</span>
          </div>
        </div>
      </div>

      <div className="supplies-content">
        {/* Category Sidebar */}
        <div className="category-sidebar">
          <h3>Categories</h3>
          <ul>
            {categories.map(category => (
              <li
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                <span>{category === 'all' ? 'All Items' : category}</span>
                <span className="count">{getCategoryCount(category)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Table Section */}
        <div className="table-section">
          {/* Table Controls */}
          <div className="table-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search items by name, unit, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>

            <button className="export-btn" onClick={() => alert('Export feature coming soon!')}>
              📥 Export Report
            </button>
          </div>

          {/* Table */}
          <div className="table-scroll-wrapper">
            <table className="supplies-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="item-column" onClick={() => handleSort('name')}>
                    Item Name/Description {getSortIcon('name')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('unit')}>
                    Unit {getSortIcon('unit')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('category')}>
                    Category {getSortIcon('category')}
                  </th>
                  <th colSpan="3">Inventory as of Dec 31, 2022</th>
                  <th colSpan="3">Additions/Adjustments</th>
                  <th colSpan="3">Total Inventory for Issuance</th>
                  <th colSpan="3">Issuances</th>
                  <th colSpan="3">Balances</th>
                  <th rowSpan="2">Actions</th>
                </tr>
                <tr>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.length > 0 ? (
                  filteredAndSortedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-column">{item.name}</td>
                      <td>{item.unit}</td>
                      <td>{item.category}</td>
                      <td>{item.inventoryDec31.qty}</td>
                      <td>{formatCurrency(item.inventoryDec31.unitPrice)}</td>
                      <td>{formatCurrency(item.inventoryDec31.total)}</td>
                      <td>{item.additions.qty}</td>
                      <td>{formatCurrency(item.additions.unitPrice)}</td>
                      <td>{formatCurrency(item.additions.total)}</td>
                      <td>{item.totalForIssuance.qty}</td>
                      <td>{formatCurrency(item.totalForIssuance.unitPrice)}</td>
                      <td>{formatCurrency(item.totalForIssuance.total)}</td>
                      <td>{item.issuances.qty}</td>
                      <td>{formatCurrency(item.issuances.unitPrice)}</td>
                      <td>{formatCurrency(item.issuances.total)}</td>
                      <td>{item.balances.qty}</td>
                      <td>{formatCurrency(item.balances.unitPrice)}</td>
                      <td>{formatCurrency(item.balances.total)}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEdit(item)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="19" className="no-results">
                      No items found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTALS</td>
                  <td>{formatCurrency(supplies.reduce((sum, item) => sum + item.inventoryDec31.total, 0))}</td>
                  <td></td>
                  <td></td>
                  <td>{formatCurrency(supplies.reduce((sum, item) => sum + item.additions.total, 0))}</td>
                  <td></td>
                  <td></td>
                  <td>{formatCurrency(supplies.reduce((sum, item) => sum + item.totalForIssuance.total, 0))}</td>
                  <td></td>
                  <td></td>
                  <td>{formatCurrency(supplies.reduce((sum, item) => sum + item.issuances.total, 0))}</td>
                  <td></td>
                  <td></td>
                  <td>{formatCurrency(calculateTotals())}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table Footer */}
          <div className="table-footer">
            <div className="footer-stats">
              <span>Showing {filteredAndSortedItems.length} of {supplies.length} items</span>
              {selectedCategory !== 'all' && (
                <span>Category: {selectedCategory}</span>
              )}
              {searchTerm && (
                <span>Search: "{searchTerm}"</span>
              )}
            </div>
            <div>
              Total Value: <strong>{formatCurrency(calculateTotals())}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Certification Section */}
      <div className="certification-section">
        <h3>CERTIFICATION</h3>
        <div className="certification-content">
          <div className="certification-form">
            <div className="certification-field">
              <label>Prepared by:</label>
              <input
                type="text"
                name="preparedBy"
                value={certification.preparedBy}
                onChange={handleCertificationChange}
                placeholder="Enter name"
              />
              <input
                type="text"
                name="preparedByTitle"
                value={certification.preparedByTitle}
                onChange={handleCertificationChange}
                placeholder="Enter title/position"
              />
            </div>
            <div className="certification-field">
              <label>Certified Correct by:</label>
              <input
                type="text"
                name="certifiedBy"
                value={certification.certifiedBy}
                onChange={handleCertificationChange}
                placeholder="Enter name"
              />
              <input
                type="text"
                name="certifiedByTitle"
                value={certification.certifiedByTitle}
                onChange={handleCertificationChange}
                placeholder="Enter title/position"
              />
            </div>
            <div className="certification-field">
              <label>Approved by:</label>
              <input
                type="text"
                name="approvedBy"
                value={certification.approvedBy}
                onChange={handleCertificationChange}
                placeholder="Enter name"
              />
              <input
                type="text"
                name="approvedByTitle"
                value={certification.approvedByTitle}
                onChange={handleCertificationChange}
                placeholder="Enter title/position"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit: {editingItem.name}</h2>

            <div className="modal-section">
              <h4>Inventory as of Dec 31, 2022</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={editingItem.inventoryDec31.qty}
                    onChange={(e) => handleInputChange(e, 'inventoryDec31', 'qty')}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.inventoryDec31.unitPrice}
                    onChange={(e) => handleInputChange(e, 'inventoryDec31', 'unitPrice')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4>Additions/Adjustments</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={editingItem.additions.qty}
                    onChange={(e) => handleInputChange(e, 'additions', 'qty')}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.additions.unitPrice}
                    onChange={(e) => handleInputChange(e, 'additions', 'unitPrice')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4>Issuances</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={editingItem.issuances.qty}
                    onChange={(e) => handleInputChange(e, 'issuances', 'qty')}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.issuances.unitPrice}
                    onChange={(e) => handleInputChange(e, 'issuances', 'unitPrice')}
                  />
                </div>
              </div>
              <p className="calc-note">* Totals will be calculated automatically</p>
            </div>

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfSupplies;