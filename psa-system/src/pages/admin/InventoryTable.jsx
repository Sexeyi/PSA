import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import AddNewSupply from "../../Components/AddNewSupply";
import EditInventoryModal from "../../Components/EditInventoryModal";
import "./InventoryTable.css";

const InventoryTable = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [uploadData, setUploadData] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState([]);

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
    setSuccess("New supply added successfully");
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

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/inventories/${itemId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      await fetchInventory();
      setSuccess(`"${itemName}" deleted successfully`);

    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete item. Please try again.");
    } finally {
      setUploadLoading(false);
    }
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
      setSuccess("Item updated successfully");

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
      setSuccess(`${selectedItems.length} item(s) updated successfully`);

    } catch (error) {
      console.error("Bulk edit error:", error);
      setError("Failed to update items. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`)) {
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

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(res => !res.ok);

      if (failedDeletes.length > 0) {
        setError(`Failed to delete ${failedDeletes.length} items. Please try again.`);
      } else {
        await fetchInventory();
        setSelectedItems([]);
        setSuccess(`${selectedItems.length} item(s) deleted successfully`);
      }

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

        if (!rows || rows.length === 0) {
          setError("Excel file is empty");
          setUploadLoading(false);
          return;
        }

        let headerRowIndex = -1;
        let dataStartRow = -1;

        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const firstCell = (row[0] || "").toString().toLowerCase();
          const secondCell = (row[1] || "").toString().toLowerCase();

          if (firstCell === "name" || firstCell === "item name" || firstCell === "item" ||
            (firstCell === "a" && secondCell === "b") ||
            (firstCell === "product" && secondCell === "unit")) {
            headerRowIndex = i;
            dataStartRow = i + 1;
            break;
          }
        }

        if (headerRowIndex === -1) {
          headerRowIndex = 0;
          dataStartRow = 1;
        }

        const parsedData = [];
        const previewData = [];

        for (let i = dataStartRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;

          let name = row[0];
          let unit = row[1];

          if (!name && row[1]) {
            name = row[1];
            unit = row[2];
          }

          if (!name || !unit) continue;

          name = name.toString().trim();
          unit = unit.toString().trim();

          const lowerName = name.toLowerCase();
          if (lowerName.includes("consumables") ||
            lowerName.includes("covid") ||
            lowerName.includes("total") ||
            lowerName.includes("summary") ||
            lowerName.includes("subtotal")) {
            continue;
          }

          const inventoryQty = parseFloat(row[2]) || 0;
          const inventoryPrice = parseFloat(row[3]) || 0;
          const inventoryTotal = parseFloat(row[4]) || (inventoryQty * inventoryPrice);

          const additionsQty = parseFloat(row[5]) || 0;
          const additionsPrice = parseFloat(row[6]) || 0;
          const additionsTotal = parseFloat(row[7]) || (additionsQty * additionsPrice);

          const issuancesQty = parseFloat(row[8]) || 0;
          const issuancesPrice = parseFloat(row[9]) || 0;
          const issuancesTotal = parseFloat(row[10]) || (issuancesQty * issuancesPrice);

          const balancesQty = parseFloat(row[11]) || 0;
          const balancesPrice = parseFloat(row[12]) || 0;
          const balancesTotal = parseFloat(row[13]) || (balancesQty * balancesPrice);

          let stock = balancesQty;
          let unitPrice = balancesPrice;

          if (stock === 0 && inventoryQty > 0) {
            stock = inventoryQty;
            unitPrice = inventoryPrice;
          }

          if (unitPrice === 0 && stock > 0 && balancesTotal > 0) {
            unitPrice = balancesTotal / stock;
          }

          const item = {
            name: name,
            unit: unit,
            category: "Office Supplies",
            stock: stock,
            unitPrice: unitPrice,
            inventoryDec31: {
              qty: inventoryQty,
              unitPrice: inventoryPrice,
              total: inventoryTotal
            },
            additions: {
              qty: additionsQty,
              unitPrice: additionsPrice,
              total: additionsTotal
            },
            issuances: {
              qty: issuancesQty,
              unitPrice: issuancesPrice,
              total: issuancesTotal
            },
            balances: {
              qty: balancesQty,
              unitPrice: balancesPrice,
              total: balancesTotal
            }
          };

          parsedData.push(item);

          if (previewData.length < 5) {
            previewData.push({
              name: item.name,
              category: item.category,
              unit: item.unit,
              stock: item.stock,
              unitPrice: item.unitPrice
            });
          }
        }

        if (parsedData.length === 0) {
          setError("No valid inventory items found in the file. Please check the format.");
          setUploadLoading(false);
          return;
        }

        setUploadData(parsedData);
        setUploadPreview(previewData);
        setShowUploadModal(true);

      } catch (error) {
        console.error("Excel parse error:", error);
        setError("Failed to parse Excel file.");
      } finally {
        setUploadLoading(false);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setUploadLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadConfirm = async () => {
    if (!uploadData || uploadData.length === 0) {
      setError("No data to upload");
      return;
    }

    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      const batchSize = 10;
      for (let i = 0; i < uploadData.length; i += batchSize) {
        const batch = uploadData.slice(i, i + batchSize);
        const promises = batch.map(async (item) => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/inventories`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(item)
            });

            if (response.ok) {
              successCount++;
              return { success: true };
            } else {
              failCount++;
              return { success: false };
            }
          } catch (error) {
            failCount++;
            return { success: false };
          }
        });

        await Promise.all(promises);
      }

      await fetchInventory();
      setShowUploadModal(false);
      setUploadData([]);
      setUploadPreview([]);

      if (successCount > 0) {
        setSuccess(`Successfully uploaded ${successCount} item(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload data. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Name': 'Bond Paper',
        'Unit': 'ream',
        'Inventory Qty': 100,
        'Inventory Unit Price': 250.00,
        'Inventory Total': 25000.00,
        'Additions Qty': 50,
        'Additions Unit Price': 260.00,
        'Additions Total': 13000.00,
        'Issuances Qty': 30,
        'Issuances Unit Price': 250.00,
        'Issuances Total': 7500.00,
        'Balances Qty': 120,
        'Balances Unit Price': 254.17,
        'Balances Total': 30500.00
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template');
    XLSX.writeFile(wb, 'inventory_import_template.xlsx');
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
              {uploadLoading ? 'Processing...' : 'Upload Excel'}
            </button>
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden-input"
            />
            <button onClick={downloadTemplate} className="btn-template">
              Download Template
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Add New Supply
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
                Bulk Edit
              </button>
              <button onClick={handleDeleteSelected} className="btn-bulk-delete">
                Delete Selected
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
                  Found <strong>{uploadData.length}</strong> items ready to upload.
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
                      {uploadPreview.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.category}</td>
                          <td>{item.unit}</td>
                          <td className="text-right">{formatNumber(item.stock)}</td>
                          <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadData.length > 5 && (
                    <p className="preview-more">... and {uploadData.length - 5} more items</p>
                  )}
                </div>
                <div className="upload-warning">
                  <p className="warning-text">
                    Note: Items with the same name may create duplicates. Please review before confirming.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button
                  className="btn-confirm"
                  onClick={handleUploadConfirm}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'Uploading...' : `Confirm Upload (${uploadData.length} items)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="alert-success">
            <span>{success}</span>
            <button className="alert-close" onClick={() => setSuccess("")}>×</button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert-error">
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError("")}>×</button>
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
                        <p>{searchTerm ? "No items match your search" : "No inventory items found"}</p>
                        {!searchTerm && (
                          <button onClick={() => setShowAddModal(true)} className="btn-add-first">
                            Add Your First Item
                          </button>
                        )}
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
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="edit-link"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id, item.name)}
                              className="delete-link"
                              disabled={uploadLoading}
                            >
                              Delete
                            </button>
                          </div>
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
            <div>
              <p className="summary-label">Total Items</p>
              <p className="summary-value">{inventory.length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div>
              <p className="summary-label">Total Value</p>
              <p className="summary-value">{formatCurrency(calculateTotalValue())}</p>
            </div>
          </div>
          <div className="summary-card summary-warning">
            <div>
              <p className="summary-label">Low Stock Items</p>
              <p className="summary-value">{calculateLowStockCount()}</p>
            </div>
          </div>
          <div className="summary-card summary-danger">
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