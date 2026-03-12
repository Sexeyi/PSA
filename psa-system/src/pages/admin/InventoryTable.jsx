import React, { useState, useEffect } from "react";
import "./InventoryTable.css";

const ListOfSupplies = ({ supplies = [], setSupplies, userRole }) => {

  const [expandedRows, setExpandedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    category: "",
    stock: 0,
    unitPrice: 0,
    inventoryDec31: { qty: 0, unitPrice: 0, total: 0 },
    additions: { qty: 0, unitPrice: 0, total: 0 },
    issuances: { qty: 0, unitPrice: 0, total: 0 },
    balances: { qty: 0, unitPrice: 0, total: 0 }
  });

  // SAFE getter for nested values
  const getNestedValue = (item, section, field) => {
    return item?.[section]?.[field] ?? 0;
  };

  // Ensure every item has all required nested objects
  const sanitizeItem = (item) => ({
    ...item,
    inventoryDec31: item.inventoryDec31 || { qty: 0, unitPrice: 0, total: 0 },
    additions: item.additions || { qty: 0, unitPrice: 0, total: 0 },
    issuances: item.issuances || { qty: 0, unitPrice: 0, total: 0 },
    balances: item.balances || {
      qty: item.stock || 0,
      unitPrice: item.unitPrice || 0,
      total: (item.stock || 0) * (item.unitPrice || 0)
    }
  });

  useEffect(() => {
    if (!supplies || supplies.length === 0) {
      fetchInventory();
    }
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/inventories", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch inventory");

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("Inventory response not array:", data);
        return;
      }

      const sanitized = data.map(sanitizeItem);

      if (setSupplies) {
        setSupplies(sanitized);
      }

    } catch (error) {
      console.error("Fetch inventory error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (section, field, value) => {

    setFormData((prev) => {

      const numValue = parseFloat(value) || 0;

      const updatedSection = {
        ...(prev[section] || { qty: 0, unitPrice: 0, total: 0 }),
        [field]: numValue
      };

      updatedSection.total = (updatedSection.qty || 0) * (updatedSection.unitPrice || 0);

      const newData = {
        ...prev,
        [section]: updatedSection
      };

      const dec31Qty = newData.inventoryDec31.qty || 0;
      const additionsQty = newData.additions.qty || 0;
      const issuancesQty = newData.issuances.qty || 0;

      const dec31Total = newData.inventoryDec31.total || 0;
      const additionsTotal = newData.additions.total || 0;
      const issuancesTotal = newData.issuances.total || 0;

      const balanceQty = dec31Qty + additionsQty - issuancesQty;
      const balanceTotal = dec31Total + additionsTotal - issuancesTotal;
      const balanceUnitPrice = balanceQty > 0 ? balanceTotal / balanceQty : 0;

      newData.balances = {
        qty: balanceQty,
        unitPrice: balanceUnitPrice,
        total: balanceTotal
      };

      newData.stock = balanceQty;
      newData.unitPrice = balanceUnitPrice;

      return newData;
    });
  };

  const handleAddItem = async () => {

    if (!formData.name || !formData.unit || !formData.category) {
      alert("Please fill all required fields");
      return;
    }

    try {

      const token = localStorage.getItem("token");

      const payload = {
        ...formData,
        stock: formData.balances.qty,
        unitPrice: formData.balances.unitPrice
      };

      const response = await fetch("http://localhost:5000/api/inventories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {

        setShowAddModal(false);

        setFormData({
          name: "",
          unit: "",
          category: "",
          stock: 0,
          unitPrice: 0,
          inventoryDec31: { qty: 0, unitPrice: 0, total: 0 },
          additions: { qty: 0, unitPrice: 0, total: 0 },
          issuances: { qty: 0, unitPrice: 0, total: 0 },
          balances: { qty: 0, unitPrice: 0, total: 0 }
        });

        fetchInventory();
      }

    } catch (error) {
      console.error("Add item error:", error);
    }
  };

  const safeSupplies = (supplies || []).map(sanitizeItem);

  const filteredInventory = safeSupplies.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  if (loading) return <div className="loading-spinner">Loading inventory...</div>;

  return (
    <div className="inventory-container">

      <div className="inventory-header">
        <h1>Inventory of Office Supplies</h1>

        {(userRole === "SuperAdmin" || userRole === "Admin") && (
          <button
            className="btn-add-item"
            onClick={() => setShowAddModal(true)}
          >
            + Add New Item
          </button>
        )}
      </div>

      <div className="inventory-controls">
        <input
          type="text"
          placeholder="Search item or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="inventory-list">

        {filteredInventory.length === 0 && (
          <p className="empty-state">No inventory items found</p>
        )}

        {filteredInventory.map((item = {}) => (

          <div key={item._id} className="inventory-card">

            <div className="inventory-header-row">

              <div>
                <h3>{item.name || "Unnamed Item"}</h3>
                <span className="category-badge">{item.category || "None"}</span>
                <span className="unit-badge">{item.unit || "N/A"}</span>
              </div>

              <div className="stock-info">
                <span className="stock-value">{item.stock || 0}</span>
                <span className="stock-label">in stock</span>
              </div>

            </div>

            <div className="summary-row">

              <div className="summary-item">
                <label>Unit Price</label>
                <span>{formatCurrency(item.unitPrice)}</span>
              </div>

              <div className="summary-item">
                <label>Total Value</label>
                <span>{formatCurrency((item.stock || 0) * (item.unitPrice || 0))}</span>
              </div>

            </div>

            {expandedRows.includes(item._id) && (

              <div className="details-grid">

                <div className="detail-section">
                  <h4>Inventory Dec 31</h4>
                  <p>Qty: {getNestedValue(item, "inventoryDec31", "qty")}</p>
                  <p>Unit Price: {formatCurrency(getNestedValue(item, "inventoryDec31", "unitPrice"))}</p>
                  <p>Total: {formatCurrency(getNestedValue(item, "inventoryDec31", "total"))}</p>
                </div>

                <div className="detail-section">
                  <h4>Additions</h4>
                  <p>Qty: {getNestedValue(item, "additions", "qty")}</p>
                  <p>Unit Price: {formatCurrency(getNestedValue(item, "additions", "unitPrice"))}</p>
                  <p>Total: {formatCurrency(getNestedValue(item, "additions", "total"))}</p>
                </div>

                <div className="detail-section">
                  <h4>Issuances</h4>
                  <p>Qty: {getNestedValue(item, "issuances", "qty")}</p>
                  <p>Unit Price: {formatCurrency(getNestedValue(item, "issuances", "unitPrice"))}</p>
                  <p>Total: {formatCurrency(getNestedValue(item, "issuances", "total"))}</p>
                </div>

                <div className="detail-section">
                  <h4>Balances</h4>
                  <p>Qty: {getNestedValue(item, "balances", "qty")}</p>
                  <p>Unit Price: {formatCurrency(getNestedValue(item, "balances", "unitPrice"))}</p>
                  <p>Total: {formatCurrency(getNestedValue(item, "balances", "total"))}</p>
                </div>

              </div>

            )}

            <div className="inventory-actions">
              <button
                className="btn-details"
                onClick={() => toggleRow(item._id)}
              >
                {expandedRows.includes(item._id)
                  ? "− Hide Details"
                  : "+ Show Details"}
              </button>
            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default ListOfSupplies;