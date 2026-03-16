import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import AddNewSupply from "../../Components/AddNewSupply";

const InventoryTable = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [uploadData, setUploadData] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch inventory from database
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

      // Handle different response structures
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

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.unit || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Handle supply added
  const handleSupplyAdded = (newSupply) => {
    console.log('New supply added:', newSupply);
    fetchInventory(); // Refresh the list
  };

  // Handle file upload
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

        // Convert sheet to array format
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ""
        });

        // Skip first 2 header rows
        const dataRows = rows.slice(2);

        const parsedData = [];

        dataRows.forEach((row) => {
          const name = row[0];
          const unit = row[1];

          // Ignore empty rows
          if (!name || !unit) return;

          const lowerName = name.toString().toLowerCase();

          // Ignore category rows
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

          // Calculate stock + price
          const balanceQty = item.balances.qty;
          const balanceTotal = item.balances.total;

          item.stock = balanceQty;
          item.unitPrice = balanceQty > 0 ? balanceTotal / balanceQty : 0;

          parsedData.push(item);
        });

        console.log("Parsed Excel Data:", parsedData);

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

  // Upload data to server
  const handleUploadConfirm = async () => {
    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // Upload items in batches to avoid overwhelming the server
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

      console.log('Upload results:', results);

      // Refresh inventory
      await fetchInventory();

      // Close modal and reset
      setShowUploadModal(false);
      setUploadData([]);

      // Show success message
      alert(`Successfully uploaded ${uploadData.length} items!`);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload data. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'Name': 'Example Item',
        'Unit': 'pcs',
        'Category': 'Office Supplies',
        'Stock': 100,
        'Unit Price': 50.00,
        'Dec 31 Qty': 50,
        'Dec 31 Price': 45.00,
        'Additions Qty': 30,
        'Additions Price': 55.00,
        'Issuances Qty': 20,
        'Issuances Price': 52.00
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'inventory_template.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with title and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track all supplies inventory</p>
        </div>
        <div className="flex gap-3">
          {/* Upload Button */}
          <button
            onClick={() => document.getElementById('file-upload').click()}
            disabled={uploadLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">📤</span>
            {uploadLoading ? 'Uploading...' : 'Upload Excel'}
          </button>

          {/* Hidden file input */}
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Download Template Button */}
          <button
            onClick={downloadTemplate}
            className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">📥</span>
            Template
          </button>

          {/* Add New Supply Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">+</span>
            Add New Supply
          </button>
        </div>
      </div>

      {/* Add New Supply Modal */}
      <AddNewSupply
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSupplyAdded={handleSupplyAdded}
      />

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Confirm Upload</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <p className="mb-4 text-gray-600">
                Found <span className="font-semibold">{uploadData.length}</span> items to upload.
                Please review the first few items below:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Unit</th>
                      <th className="px-4 py-2 text-right">Stock</th>
                      <th className="px-4 py-2 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadData.slice(0, 5).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.category}</td>
                        <td className="px-4 py-2">{item.unit}</td>
                        <td className="px-4 py-2 text-right">{item.stock}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {uploadData.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... and {uploadData.length - 5} more items
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={uploadLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  'Confirm Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Rest of your component remains the same... */}
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, category, or unit..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Total Items:</span>
          <span className="font-semibold">{filteredInventory.length}</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? "No items match your search" : "No inventory items found"}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const totalValue = (item.stock || 0) * (item.unitPrice || 0);
                  const stockLevel = item.stock || 0;

                  let statusColor = "bg-green-100 text-green-800";
                  let statusText = "In Stock";

                  if (stockLevel === 0) {
                    statusColor = "bg-red-100 text-red-800";
                    statusText = "Out of Stock";
                  } else if (stockLevel <= 5) {
                    statusColor = "bg-yellow-100 text-yellow-800";
                    statusText = "Low Stock";
                  } else if (stockLevel <= 10) {
                    statusColor = "bg-orange-100 text-orange-800";
                    statusText = "Medium Stock";
                  }

                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name || "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{item.category || "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{item.unit || "—"}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <span className={stockLevel <= 5 ? "text-red-600" : "text-gray-900"}>
                          {stockLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(totalValue)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
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
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} items
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(inventory.reduce((sum, item) => sum + ((item.stock || 0) * (item.unitPrice || 0)), 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">
            {inventory.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">
            {inventory.filter(item => (item.stock || 0) === 0).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;