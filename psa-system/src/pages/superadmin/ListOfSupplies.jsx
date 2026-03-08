import React, { useState, useMemo, useEffect } from 'react';
import './ListOfSupplies.css';

const ListOfSupplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSupplies(data || []);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }
    };
    fetchInventory();
  }, []);

  // Categories for filtering
  const categories = useMemo(() => ['all', ...new Set(supplies.map(item => item.category))], [supplies]);

  const getCategoryCount = (category) => category === 'all' ? supplies.length : supplies.filter(i => i.category === category).length;

  const filteredAndSortedItems = useMemo(() => {
    let items = [...supplies];

    if (selectedCategory !== 'all') items = items.filter(i => i.category === selectedCategory);

    if (searchTerm) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    items.sort((a, b) => {
      let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
      if (sortConfig.key === 'totalValue') {
        aVal = a.balances.total;
        bVal = b.balances.total;
      } else if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return items;
  }, [supplies, searchTerm, sortConfig, selectedCategory]);

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const handleEdit = (item) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsModalOpen(true);
  };

  const handleInputChange = (e, section, field) => {
    const { value } = e.target;
    setEditingItem({
      ...editingItem,
      [section]: { ...editingItem[section], [field]: parseFloat(value) || 0 },
      lastUpdated: new Date().toISOString()
    });
  };

  const handleCertificationChange = (e) => {
    const { name, value } = e.target;
    setCertification({ ...certification, [name]: value });
  };

  const handleSave = () => {
    const updatedItem = { ...editingItem };

    // Auto-calculate totals
    updatedItem.startingInventory.total = updatedItem.startingInventory.qty * updatedItem.startingInventory.unitPrice;
    updatedItem.additions.total = updatedItem.additions.qty * updatedItem.additions.unitPrice;
    updatedItem.issuances.total = updatedItem.issuances.qty * updatedItem.issuances.unitPrice;

    updatedItem.totalForIssuance.qty = updatedItem.startingInventory.qty + updatedItem.additions.qty;
    const totalValue = updatedItem.startingInventory.total + updatedItem.additions.total;
    updatedItem.totalForIssuance.unitPrice = updatedItem.totalForIssuance.qty > 0 ? totalValue / updatedItem.totalForIssuance.qty : 0;
    updatedItem.totalForIssuance.total = totalValue;

    updatedItem.balances.qty = updatedItem.totalForIssuance.qty - updatedItem.issuances.qty;
    updatedItem.balances.unitPrice = updatedItem.totalForIssuance.unitPrice;
    updatedItem.balances.total = updatedItem.balances.qty * updatedItem.balances.unitPrice;

    setSupplies(supplies.map(i => i.id === updatedItem.id ? updatedItem : i));
    setIsModalOpen(false);
    setEditingItem(null);

    // Save to backend
    fetch(`http://localhost:5000/api/inventory/${updatedItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(updatedItem)
    }).catch(err => console.error('Error saving inventory:', err));
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const formatCurrency = (num) => `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const calculateTotals = () => supplies.reduce((sum, item) => sum + item.balances.total, 0);

  const getSortIcon = (key) => sortConfig.key !== key ? '↕️' : (sortConfig.direction === 'asc' ? '↑' : '↓');

  const clearSearch = () => setSearchTerm('');

  return (
    <div className="supplies-container">
      <h1>INVENTORY OF OFFICE SUPPLIES</h1>
      <p>PSA - Regional Office • As of {certification.date}</p>

      {/* Category Filters */}
      <div className="category-sidebar">
        <h3>Categories</h3>
        <ul>
          {categories.map(cat => (
            <li key={cat} className={selectedCategory === cat ? 'active' : ''} onClick={() => setSelectedCategory(cat)}>
              {cat} <span>({getCategoryCount(cat)})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Search and Table */}
      <div className="table-section">
        <div className="table-controls">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={clearSearch}>✕</button>}
        </div>

        <div className="table-scroll-wrapper">
          <table className="supplies-table">
            <thead>
              <tr>
                <th rowSpan="2" onClick={() => handleSort('name')}>Item Name {getSortIcon('name')}</th>
                <th rowSpan="2" onClick={() => handleSort('unit')}>Unit {getSortIcon('unit')}</th>
                <th rowSpan="2" onClick={() => handleSort('category')}>Category {getSortIcon('category')}</th>
                <th colSpan="3">Starting Inventory</th>
                <th colSpan="3">Additions/Adjustments</th>
                <th colSpan="3">Total Inventory for Issuance</th>
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
                <tr><td colSpan="19">No items found.</td></tr>
              ) : (
                filteredAndSortedItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.unit}</td>
                    <td>{item.category}</td>
                    <td>{item.startingInventory.qty}</td>
                    <td>{formatCurrency(item.startingInventory.unitPrice)}</td>
                    <td>{formatCurrency(item.startingInventory.total)}</td>
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
                      <button onClick={() => handleEdit(item)}>Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="18" style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTALS:</td>
                <td>{formatCurrency(calculateTotals())}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit: {editingItem.name}</h2>

            {['startingInventory', 'additions', 'issuances'].map(section => (
              <div key={section} className="modal-section">
                <h4>{section === 'startingInventory' ? 'Starting Inventory' : section === 'additions' ? 'Additions/Adjustments' : 'Issuances'}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Qty:</label>
                    <input type="number" value={editingItem[section].qty} onChange={e => handleInputChange(e, section, 'qty')} />
                  </div>
                  <div className="form-group">
                    <label>Unit Price:</label>
                    <input type="number" step="0.01" value={editingItem[section].unitPrice} onChange={e => handleInputChange(e, section, 'unitPrice')} />
                  </div>
                </div>
              </div>
            ))}

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfSupplies;