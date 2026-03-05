import React, { useState, useMemo } from 'react';
import './ListOfSupplies.css';

const ListOfSupplies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Initial data for supplies with the provided items
  const initialSupplies = [
    { id: 1, name: 'Ballpen (black, blue, red)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 2, name: 'Battery (AA, AAA)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 3, name: 'Binder clips (various sizes)', unit: 'box', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 4, name: 'Bond paper (different sizes/types)', unit: 'ream', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 5, name: 'Correction tape', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 6, name: 'Envelopes (documentary, mailing, expanding)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 7, name: 'Eraser', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 8, name: 'Fastener, metal', unit: 'box', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 9, name: 'Folders (ordinary, legal, etc.)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 10, name: 'Glue, all-purpose', unit: 'bottle', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 11, name: 'Highlighter', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 12, name: 'Marker (permanent, assorted colors)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 13, name: 'Notepad', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 14, name: 'Pencil with eraser', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 15, name: 'Record book (300 pages)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 16, name: 'Ruler', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 17, name: 'Scissors', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 18, name: 'Sign pen (black, blue, red)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 19, name: 'Stamp pad & ink', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 20, name: 'Stapler (No. 35)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 21, name: 'Staple wire (No. 35)', unit: 'box', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 22, name: 'Sticky notes', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 23, name: 'Tapes (masking, transparent, double adhesive, various sizes)', unit: 'roll', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 24, name: 'Transparency film', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
    { id: 25, name: 'USB flash drives (32GB, 64GB)', unit: 'piece', inventoryDec31: { qty: 0, unitPrice: 0, total: 0 }, additions: { qty: 0, unitPrice: 0, total: 0 }, totalForIssuance: { qty: 0, unitPrice: 0, total: 0 }, issuances: { qty: 0, unitPrice: 0, total: 0 }, balances: { qty: 0, unitPrice: 0, total: 0 } },
  ];

  const [supplies, setSupplies] = useState(initialSupplies);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Certification state with pre-filled values
  const [certification, setCertification] = useState({
    preparedBy: 'Ma. Athena Marie B. Aguilar',
    preparedByTitle: 'Administrative Officer I',
    certifiedBy: 'Jan Michael S. Pastor',
    certifiedByTitle: 'Accountant I',
    approvedBy: 'Jeanette R. Marzan',
    approvedByTitle: 'Chief Statistical Specialist'
  });

  // Get total items count
  const getTotalItems = () => {
    return supplies.length;
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let items = [...supplies];
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort items
    items.sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      } else {
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
      }
    });
    
    return items;
  }, [supplies, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleInputChange = (e, field, subField) => {
    const { value } = e.target;
    setEditingItem({
      ...editingItem,
      [field]: {
        ...editingItem[field],
        [subField]: parseFloat(value) || 0
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
    const updatedSupplies = supplies.map(item => 
      item.id === editingItem.id ? editingItem : item
    );
    setSupplies(updatedSupplies);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalBalance = 0;
    supplies.forEach(item => {
      totalBalance += item.balances.total;
    });
    return totalBalance;
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="supplies-container">
      <div className="supplies-header">
        <h1>INVENTORY OF OFFICE SUPPLIES</h1>
        <p>PSA - Regional Office • As of January 31, 2023 • {getTotalItems()} Items</p>
      </div>

      <div className="supplies-content">
        <div className="table-section">
          <div className="table-scroll-wrapper">
            <div className="table-header">
              <div className="search-box">
                <input
                  type="text"
                  placeholder=" Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <div className="table-container">
              <table className="supplies-table">
                <thead>
                  <tr>
                    <th rowSpan="2" className="item-column" onClick={() => handleSort('name')} style={{cursor: 'pointer'}}>
                      Item Name/Description {getSortIcon('name')}
                    </th>
                    <th rowSpan="2" onClick={() => handleSort('unit')} style={{cursor: 'pointer'}}>
                      Unit {getSortIcon('unit')}
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
                    <th>Total Amount</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedItems.length > 0 ? (
                    filteredAndSortedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="item-column">{item.name}</td>
                        <td>{item.unit}</td>
                        <td>{formatNumber(item.inventoryDec31.qty)}</td>
                        <td>₱{formatNumber(item.inventoryDec31.unitPrice)}</td>
                        <td>₱{formatNumber(item.inventoryDec31.total)}</td>
                        <td>{formatNumber(item.additions.qty)}</td>
                        <td>₱{formatNumber(item.additions.unitPrice)}</td>
                        <td>₱{formatNumber(item.additions.total)}</td>
                        <td>{formatNumber(item.totalForIssuance.qty)}</td>
                        <td>₱{formatNumber(item.totalForIssuance.unitPrice)}</td>
                        <td>₱{formatNumber(item.totalForIssuance.total)}</td>
                        <td>{formatNumber(item.issuances.qty)}</td>
                        <td>₱{formatNumber(item.issuances.unitPrice)}</td>
                        <td>₱{formatNumber(item.issuances.total)}</td>
                        <td>{formatNumber(item.balances.qty)}</td>
                        <td>₱{formatNumber(item.balances.unitPrice)}</td>
                        <td>₱{formatNumber(item.balances.total)}</td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEdit(item)}> Edit</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="18" style={{textAlign: 'center', padding: '40px', color: '#718096'}}>
                        No items found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>TOTALS</td>
                    <td>₱{formatNumber(supplies.reduce((sum, item) => sum + item.inventoryDec31.total, 0))}</td>
                    <td></td>
                    <td></td>
                    <td>₱{formatNumber(supplies.reduce((sum, item) => sum + item.additions.total, 0))}</td>
                    <td></td>
                    <td></td>
                    <td>₱{formatNumber(supplies.reduce((sum, item) => sum + item.totalForIssuance.total, 0))}</td>
                    <td></td>
                    <td></td>
                    <td>₱{formatNumber(supplies.reduce((sum, item) => sum + item.issuances.total, 0))}</td>
                    <td></td>
                    <td></td>
                    <td>₱{formatNumber(calculateTotals())}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="table-footer">
              <span>Showing {filteredAndSortedItems.length} of {supplies.length} items</span>
            </div>
          </div>
        </div>
      </div>

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

      {isModalOpen && editingItem && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2> Edit: {editingItem.name}</h2>
            
            <div className="modal-section">
              <h4> Inventory as of Dec 31, 2022</h4>
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
                <div className="form-group">
                  <label>Total Amount (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.inventoryDec31.total}
                    onChange={(e) => handleInputChange(e, 'inventoryDec31', 'total')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4> Additions/Adjustments</h4>
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
                <div className="form-group">
                  <label>Total Amount (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.additions.total}
                    onChange={(e) => handleInputChange(e, 'additions', 'total')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4> Total Inventory for Issuance</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={editingItem.totalForIssuance.qty}
                    onChange={(e) => handleInputChange(e, 'totalForIssuance', 'qty')}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.totalForIssuance.unitPrice}
                    onChange={(e) => handleInputChange(e, 'totalForIssuance', 'unitPrice')}
                  />
                </div>
                <div className="form-group">
                  <label>Total Amount (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.totalForIssuance.total}
                    onChange={(e) => handleInputChange(e, 'totalForIssuance', 'total')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4> Issuances</h4>
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
                <div className="form-group">
                  <label>Total Amount (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.issuances.total}
                    onChange={(e) => handleInputChange(e, 'issuances', 'total')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4> Balances</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={editingItem.balances.qty}
                    onChange={(e) => handleInputChange(e, 'balances', 'qty')}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.balances.unitPrice}
                    onChange={(e) => handleInputChange(e, 'balances', 'unitPrice')}
                  />
                </div>
                <div className="form-group">
                  <label>Total Amount (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.balances.total}
                    onChange={(e) => handleInputChange(e, 'balances', 'total')}
                  />
                </div>
              </div>
            </div>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleSave}> Save Changes</button>
              <button className="cancel-btn" onClick={handleCancel}>✕ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfSupplies;
