import React, { useState, useEffect } from "react";
import "./InventoryTable.css";

const InventoryTable = () => {
  const [inventory, setInventory] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredInventory = inventory.filter(
    (item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalValue = (item) => item.stock * item.unitPrice;

  if (loading) return <div>Loading Inventory...</div>;

  return (
    <div className="inventory-container">
      <h1>Inventory of Office Supplies</h1>
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
                <td>₱{(calculateTotalValue(item) || 0).toFixed(2)}</td>
                <td>
                  <button onClick={() => toggleRow(item._id)}>
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
    </div>
  );
};

export default InventoryTable;