import React, { useState, useEffect } from "react";
import "./InventoryTable.css";

const InventoryTable = () => {
  const [inventory, setInventory] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    unit: "",
    category: "",
    stock: 0,
    unitPrice: 0,
    inventoryDec31: { qty: 0, unitPrice: 0, total: 0 },
    additions: { qty: 0, unitPrice: 0, total: 0 },
    issuances: { qty: 0, unitPrice: 0, total: 0 },
    balances: { qty: 0, unitPrice: 0, total: 0 }
  });

  // Fetch inventory from API
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Handle input changes for main form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle changes for nested objects (inventoryDec31, additions, etc.)
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => {
      const updatedSection = {
        ...prev[section],
        [field]: parseFloat(value) || 0
      };

      // Calculate total for the section
      updatedSection.total = (updatedSection.qty * updatedSection.unitPrice) || 0;

      // Update balances based on calculations
      const newFormData = {
        ...prev,
        [section]: updatedSection
      };

      // Recalculate balances
      const totalQty = (newFormData.inventoryDec31.qty + newFormData.additions.qty) - newFormData.issuances.qty;
      const totalValue = (newFormData.inventoryDec31.total + newFormData.additions.total) - newFormData.issuances.total;
      const avgUnitPrice = totalQty > 0 ? totalValue / totalQty : 0;

      newFormData.balances = {
        qty: totalQty,
        unitPrice: avgUnitPrice,
        total: totalValue
      };

      // Update main stock and unitPrice
      newFormData.stock = totalQty;
      newFormData.unitPrice = avgUnitPrice;

      return newFormData;
    });
  };

  // Add new inventory item
  const handleAddItem = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      // Refresh inventory list
      await fetchInventory();
      setShowAddModal(false);

      // Reset form
      setFormData({
        itemName: "",
        unit: "",
        category: "",
        stock: 0,
        unitPrice: 0,
        inventoryDec31: { qty: 0, unitPrice: 0, total: 0 },
        additions: { qty: 0, unitPrice: 0, total: 0 },
        issuances: { qty: 0, unitPrice: 0, total: 0 },
        balances: { qty: 0, unitPrice: 0, total: 0 }
      });
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item. Please try again.");
    }
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(
    (item) =>
      item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-container">Loading Inventory...</div>;

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory of Office Supplies</h1>
        <button
          className="btn-add-item"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Item
        </button>
      </div>

      <div className="inventory-controls">
        <input
          type="text"
          placeholder="Search by item or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Total Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item) => (
            <React.Fragment key={item._id}>
              <tr>
                <td>{item.itemName}</td>
                <td>{item.unit}</td>
                <td>{item.category}</td>
                <td>{item.stock}</td>
                <td>₱{(item.balances?.total || 0).toFixed(2)}</td>
                <td>
                  <button
                    className="btn-details"
                    onClick={() => toggleRow(item._id)}
                  >
                    {expandedRows.includes(item._id) ? "−" : "+"} Details
                  </button>
                </td>
              </tr>

              {expandedRows.includes(item._id) && (
                <tr className="expanded-row">
                  <td colSpan={6}>
                    <div className="details-grid">
                      <div>
                        <strong>Inventory Dec 31:</strong>
                        <p>Qty: {item.inventoryDec31?.qty || 0}</p>
                        <p>Unit Price: ₱{item.inventoryDec31?.unitPrice || 0}</p>
                        <p>Total: ₱{item.inventoryDec31?.total || 0}</p>
                      </div>

                      <div>
                        <strong>Additions:</strong>
                        <p>Qty: {item.additions?.qty || 0}</p>
                        <p>Unit Price: ₱{item.additions?.unitPrice || 0}</p>
                        <p>Total: ₱{item.additions?.total || 0}</p>
                      </div>

                      <div>
                        <strong>Issuances:</strong>
                        <p>Qty: {item.issuances?.qty || 0}</p>
                        <p>Unit Price: ₱{item.issuances?.unitPrice || 0}</p>
                        <p>Total: ₱{item.issuances?.total || 0}</p>
                      </div>

                      <div>
                        <strong>Balances:</strong>
                        <p>Qty: {item.balances?.qty || 0}</p>
                        <p>Unit Price: ₱{item.balances?.unitPrice || 0}</p>
                        <p>Total: ₱{item.balances?.total || 0}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {filteredInventory.length === 0 && (
            <tr>
              <td colSpan={6}>No items found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Inventory Item</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name *</label>
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      placeholder="Enter item name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit *</label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="e.g., pieces, boxes, reams"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Enter category"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Opening Inventory (as of Dec 31)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.inventoryDec31.qty}
                      onChange={(e) => handleNestedChange('inventoryDec31', 'qty', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.inventoryDec31.unitPrice}
                      onChange={(e) => handleNestedChange('inventoryDec31', 'unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total (₱)</label>
                    <input
                      type="number"
                      value={formData.inventoryDec31.total.toFixed(2)}
                      disabled
                      className="calculated-field"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additions (Current Period)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.additions.qty}
                      onChange={(e) => handleNestedChange('additions', 'qty', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.additions.unitPrice}
                      onChange={(e) => handleNestedChange('additions', 'unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total (₱)</label>
                    <input
                      type="number"
                      value={formData.additions.total.toFixed(2)}
                      disabled
                      className="calculated-field"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Issuances (Current Period)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.issuances.qty}
                      onChange={(e) => handleNestedChange('issuances', 'qty', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.issuances.unitPrice}
                      onChange={(e) => handleNestedChange('issuances', 'unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total (₱)</label>
                    <input
                      type="number"
                      value={formData.issuances.total.toFixed(2)}
                      disabled
                      className="calculated-field"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section summary">
                <h3>Current Balances (Calculated)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={formData.balances.qty}
                      disabled
                      className="calculated-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Avg. Unit Price (₱)</label>
                    <input
                      type="number"
                      value={formData.balances.unitPrice.toFixed(2)}
                      disabled
                      className="calculated-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Value (₱)</label>
                    <input
                      type="number"
                      value={formData.balances.total.toFixed(2)}
                      disabled
                      className="calculated-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddItem}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;