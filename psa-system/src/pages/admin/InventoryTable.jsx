import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import AddNewSupply from "../../Components/AddNewSupply";
import EditInventoryModal from "../../Components/EditInventoryModal";
import "./InventoryTable.css";

const InventoryTable = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [uploadData, setUploadData] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [bulkEditField, setBulkEditField] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/inventories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized. Please login again.");
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }

      const data = await response.json();

      let inventoryArray = [];
      if (Array.isArray(data)) {
        inventoryArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        inventoryArray = data.data;
      } else if (data.inventories && Array.isArray(data.inventories)) {
        inventoryArray = data.inventories;
      }

      setInventory(inventoryArray);
      setError("");
    } catch (error) {
      console.error("Fetch inventory error:", error);
      setError(error.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const filteredInventory = inventory.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.unit || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const handleSupplyAdded = (newSupply) => {
    fetchInventory();
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map(item => item._id));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [currentPage, searchTerm]);

  const handleEditItem = (item) => {
    setCurrentEditItem(item);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedItem) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/inventories/${updatedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedItem)
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      await fetchInventory();
      setShowEditModal(false);
      setCurrentEditItem(null);

    } catch (error) {
      console.error("Edit error:", error);
      setError("Failed to update item. Please try again.");
    }
  };

  const handleBulkEdit = async () => {
    if (!bulkEditField || selectedItems.length === 0) return;

    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");

      const updatePromises = selectedItems.map(itemId => {
        const updateData = {};

        switch (bulkEditField) {
          case 'category':
            updateData.category = bulkEditValue;
            break;
          case 'unit':
            updateData.unit = bulkEditValue;
            break;
          case 'price':
            updateData.unitPrice = parseFloat(bulkEditValue);
            break;
          case 'stock':
            updateData.stock = parseInt(bulkEditValue);
            break;
          default:
            break;
        }

        return fetch(`${API_BASE_URL}/api/inventories/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
      });

      await Promise.all(updatePromises);
      await fetchInventory();
      setShowBulkEditModal(false);
      setSelectedItems([]);
      setBulkEditField("");
      setBulkEditValue("");

    } catch (error) {
      console.error("Bulk edit error:", error);
      setError("Failed to update items. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) {
      return;
    }

    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");

      const deletePromises = selectedItems.map(itemId =>
        fetch(`${API_BASE_URL}/api/inventories/${itemId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      await fetchInventory();
      setSelectedItems([]);

    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete items. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setError("");

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        const dataRows = rows.slice(2);
        const parsedData = [];

        dataRows.forEach((row) => {
          const name = row[0];
          const unit = row[1];

          if (!name || !unit) return;

          const lowerName = name.toString().toLowerCase();

          if (
            lowerName.includes("consumables") ||
            lowerName.includes("covid") ||
            lowerName.includes("total")
          ) {
            return;
          }

          const item = {
            name: name,
            unit: unit,
            category: "General",
            inventoryDec31: {
              qty: parseFloat(row[2]) || 0,
              unitPrice: parseFloat(row[3]) || 0,
              total: parseFloat(row[4]) || 0
            },
            additions: {
              qty: parseFloat(row[5]) || 0,
              unitPrice: parseFloat(row[6]) || 0,
              total: parseFloat(row[7]) || 0
            },
            issuances: {
              qty: parseFloat(row[8]) || 0,
              unitPrice: parseFloat(row[9]) || 0,
              total: parseFloat(row[10]) || 0
            },
            balances: {
              qty: parseFloat(row[11]) || 0,
              unitPrice: parseFloat(row[12]) || 0,
              total: parseFloat(row[13]) || 0
            }
          };

          const balanceQty = item.balances.qty;
          const balanceTotal = item.balances.total;

          item.stock = balanceQty;
          item.unitPrice = balanceQty > 0 ? balanceTotal / balanceQty : 0;

          parsedData.push(item);
        });

        if (parsedData.length === 0) {
          setError("No valid inventory items found in the file.");
          return;
        }

        setUploadData(parsedData);
        setShowUploadModal(true);

      } catch (error) {
        console.error("Excel parse error:", error);
        setError("Failed to parse Excel file.");
      } finally {
        setUploadLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadConfirm = async () => {
    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const batchSize = 10;
      const results = [];

      for (let i = 0; i < uploadData.length; i += batchSize) {
        const batch = uploadData.slice(i, i + batchSize);
        const promises = batch.map(item =>
          fetch(`${API_BASE_URL}/api/inventories`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(item)
          }).then(res => res.json())
        );
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }

      await fetchInventory();
      setShowUploadModal(false);
      setUploadData([]);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload data. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Name': 'Example Item',
        'Unit': 'pcs',
        'Category': 'Office Supplies',
        'Stock': 100,
        'Unit Price': 50.00
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'inventory_template.xlsx');
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { class: 'status-out', text: 'Out of Stock' };
    if (stock <= 5) return { class: 'status-low', text: 'Low Stock' };
    if (stock <= 10) return { class: 'status-medium', text: 'Medium Stock' };
    return { class: 'status-in', text: 'In Stock' };
  };

  const calculateTotalValue = () => {
    return inventory.reduce((sum, item) => sum + ((item.stock || 0) * (item.unitPrice || 0)), 0);
  };

  const calculateLowStockCount = () => {
    return inventory.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length;
  };

  const calculateOutOfStockCount = () => {
    return inventory.filter(item => (item.stock || 0) === 0).length;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="inventory-wrapper">
        {/* Header */}
        <div className="inventory-header">
          <div className="header-left">
            <h1 className="inventory-title">Inventory Management</h1>
            <p className="inventory-subtitle">Manage and track all supplies inventory</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => document.getElementById('file-upload').click()}
              disabled={uploadLoading}
              className="btn-upload"
            >
              📤 {uploadLoading ? 'Uploading...' : 'Upload Excel'}
            </button>
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden-input"
            />
            <button onClick={downloadTemplate} className="btn-template">
              📥 Template
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add New Supply
            </button>
          </div>
        </div>

        {/* Selection Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="selection-bar">
            <div className="selection-info">
              <span className="selection-count">{selectedItems.length} items selected</span>
            </div>
            <div className="selection-actions">
              <button onClick={() => setShowBulkEditModal(true)} className="btn-bulk-edit">
                ✏️ Bulk Edit
              </button>
              <button onClick={handleDeleteSelected} className="btn-bulk-delete">
                🗑️ Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Add New Supply Modal */}
        <AddNewSupply
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSupplyAdded={handleSupplyAdded}
        />

        {/* Single Edit Modal */}
        {showEditModal && currentEditItem && (
          <EditInventoryModal
            item={currentEditItem}
            onClose={() => {
              setShowEditModal(false);
              setCurrentEditItem(null);
            }}
            onSave={handleSaveEdit}
          />
        )}

        {/* Bulk Edit Modal */}
        {showBulkEditModal && (
          <div className="modal-overlay" onClick={() => setShowBulkEditModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Bulk Edit Items</h3>
                <button className="modal-close" onClick={() => setShowBulkEditModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">Editing {selectedItems.length} selected items</p>
                <div className="form-group">
                  <label className="form-label">Field to Edit</label>
                  <select
                    value={bulkEditField}
                    onChange={(e) => setBulkEditField(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select field...</option>
                    <option value="category">Category</option>
                    <option value="unit">Unit</option>
                    <option value="price">Unit Price</option>
                    <option value="stock">Stock Quantity</option>
                  </select>
                </div>
                {bulkEditField && (
                  <div className="form-group">
                    <label className="form-label">New Value</label>
                    <input
                      type={bulkEditField === 'price' || bulkEditField === 'stock' ? 'number' : 'text'}
                      value={bulkEditValue}
                      onChange={(e) => setBulkEditValue(e.target.value)}
                      placeholder={`Enter new ${bulkEditField}`}
                      className="form-input"
                      step={bulkEditField === 'price' ? '0.01' : '1'}
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowBulkEditModal(false)}>Cancel</button>
                <button
                  className="btn-save"
                  onClick={handleBulkEdit}
                  disabled={!bulkEditField || !bulkEditValue || uploadLoading}
                >
                  {uploadLoading ? 'Updating...' : 'Update All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Confirmation Modal */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Confirm Upload</h3>
                <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Found <strong>{uploadData.length}</strong> items to upload.
                </p>
                <div className="preview-table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Unit</th>
                        <th>Stock</th>
                        <th>Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadData.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.category}</td>
                          <td>{item.unit}</td>
                          <td>{formatNumber(item.stock)}</td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadData.length > 5 && (
                    <p className="preview-more">... and {uploadData.length - 5} more items</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button className="btn-confirm" onClick={handleUploadConfirm} disabled={uploadLoading}>
                  {uploadLoading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-section">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by name, category, or unit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="stats-badge">
            <span>Total Items:</span>
            <strong>{filteredInventory.length}</strong>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="checkbox"
                    />
                  </th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total Value</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      <div className="empty-content">
                        <span className="empty-icon">📦</span>
                        <p>{searchTerm ? "No items match your search" : "No inventory items found"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => {
                    const totalValue = (item.stock || 0) * (item.unitPrice || 0);
                    const stockStatus = getStockStatus(item.stock || 0);

                    return (
                      <tr key={item._id}>
                        <td className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item._id)}
                            onChange={() => handleSelectItem(item._id)}
                            className="checkbox"
                          />
                        </td>
                        <td className="item-name">{item.name || "—"}</td>
                        <td><span className="category-badge">{item.category || "—"}</span></td>
                        <td>{item.unit || "—"}</td>
                        <td className="text-right stock-value">{formatNumber(item.stock)}</td>
                        <td className="text-right price-value">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right total-value">{formatCurrency(totalValue)}</td>
                        <td className="text-center">
                          <span className={`status-badge ${stockStatus.class}`}>
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="text-center">
                          <button onClick={() => handleEditItem(item)} className="edit-link">
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredInventory.length > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} items
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-page">
                  Page {currentPage} of {totalPages}
                </span>
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
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">📦</div>
            <div>
              <p className="summary-label">Total Items</p>
              <p className="summary-value">{inventory.length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div>
              <p className="summary-label">Total Value</p>
              <p className="summary-value">{formatCurrency(calculateTotalValue())}</p>
            </div>
          </div>
          <div className="summary-card summary-warning">
            <div className="summary-icon">⚠️</div>
            <div>
              <p className="summary-label">Low Stock Items</p>
              <p className="summary-value">{calculateLowStockCount()}</p>
            </div>
          </div>
          <div className="summary-card summary-danger">
            <div className="summary-icon">❌</div>
            <div>
              <p className="summary-label">Out of Stock</p>
              <p className="summary-value">{calculateOutOfStockCount()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;