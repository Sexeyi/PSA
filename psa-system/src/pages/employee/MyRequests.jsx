import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MyRequests.css";

const MyRequests = () => {
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([{
        id: 1,
        itemName: "",
        quantity: "",
        unit: "",
        category: "",
        unitPrice: 0,
        totalPrice: 0,
        errors: {}
    }]);
    const [submitting, setSubmitting] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchInventoryItems();
    }, []);

    const fetchInventoryItems = async () => {
        setLoadingInventory(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/api/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const inventoryData = response.data.data || response.data || [];
            setInventoryItems(inventoryData);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoadingInventory(false);
        }
    };

    const validateItem = (item, index) => {
        const errors = {};
        if (!item.itemName || !item.itemName.trim()) {
            errors.itemName = "Item name is required";
        }
        if (!item.quantity || item.quantity <= 0) {
            errors.quantity = "Quantity must be greater than 0";
        }
        if (!item.unit) {
            errors.unit = "Unit is required";
        }

        setItems(prev => prev.map((i, idx) =>
            idx === index ? { ...i, errors } : i
        ));

        return Object.keys(errors).length === 0;
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];

        if (field === "itemName") {
            const selectedInventory = inventoryItems.find(item =>
                (item.name === value || item.itemName === value) ||
                (item.name?.toLowerCase() === value.toLowerCase() || item.itemName?.toLowerCase() === value.toLowerCase())
            );

            if (selectedInventory) {
                updated[index].itemName = selectedInventory.name || selectedInventory.itemName;
                updated[index].unit = selectedInventory.unit || "";
                updated[index].category = selectedInventory.category || "office";
                updated[index].unitPrice = selectedInventory.unitPrice || selectedInventory.price || 0;
                const quantity = updated[index].quantity || 0;
                updated[index].totalPrice = quantity * updated[index].unitPrice;
            } else {
                updated[index].itemName = value;
            }
        } else if (field === "quantity") {
            const quantity = Number(value) || 0;
            updated[index].quantity = quantity;
            updated[index].totalPrice = quantity * (updated[index].unitPrice || 0);
        } else {
            updated[index][field] = value;
        }

        setItems(updated);
        validateItem(updated[index], index);
    };

    const addItem = () => {
        const newId = Math.max(...items.map(i => i.id), 0) + 1;
        setItems([...items, {
            id: newId,
            itemName: "",
            quantity: "",
            unit: "",
            category: "",
            unitPrice: 0,
            totalPrice: 0,
            errors: {}
        }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateOverallTotal = () => {
        return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    };

    const calculateTotalQuantity = () => {
        return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let isValid = true;
        items.forEach((item, index) => {
            if (!validateItem(item, index)) {
                isValid = false;
            }
        });

        if (!isValid) {
            setErrorMessage("Please fix the errors before submitting");
            setTimeout(() => setErrorMessage(""), 5000);
            return;
        }

        setSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const token = localStorage.getItem("token");
            const payload = {
                items: items.map(item => ({
                    itemName: item.itemName,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    category: item.category,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                })),
                notes,
                overallTotal: calculateOverallTotal()
            };

            await axios.post(
                `${API_BASE_URL}/api/requisitions`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage("Requisition submitted successfully!");

            setItems([{
                id: 1,
                itemName: "",
                quantity: "",
                unit: "",
                category: "",
                unitPrice: 0,
                totalPrice: 0,
                errors: {}
            }]);
            setNotes("");

            setTimeout(() => setSuccessMessage(""), 5000);

        } catch (error) {
            console.error(error);
            setErrorMessage(error.response?.data?.message || "Error submitting requisition");
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the form?")) {
            setItems([{
                id: 1,
                itemName: "",
                quantity: "",
                unit: "",
                category: "",
                unitPrice: 0,
                totalPrice: 0,
                errors: {}
            }]);
            setNotes("");
        }
    };

    if (loadingInventory) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading inventory...</p>
            </div>
        );
    }

    return (
        <div className="requests-container">
            <div className="requests-wrapper">
                {/* Header */}
                <div className="requests-header">
                    <h1 className="requests-title">Create New Requisition</h1>
                    <p className="requests-subtitle">
                        Fill out the form below to submit your request for approval
                    </p>
                </div>

                {/* Messages */}
                {successMessage && (
                    <div className="alert alert-success">
                        <span className="alert-icon">✓</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                {errorMessage && (
                    <div className="alert alert-error">
                        <span className="alert-icon">!</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="requests-form">
                    {/* Items Card */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Request Items</h3>
                        </div>
                        <div className="card-content">
                            <div className="table-container">
                                <table className="requests-table">
                                    <thead>
                                        <tr>
                                            <th className="item-name-col">Item Name <span className="required">*</span></th>
                                            <th className="quantity-col">Quantity <span className="required">*</span></th>
                                            <th className="unit-col">Unit <span className="required">*</span></th>
                                            <th className="price-col">Unit Price</th>
                                            <th className="total-col">Total</th>
                                            <th className="actions-col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="search-input-wrapper">
                                                        <input
                                                            type="text"
                                                            list={`inventory-list-${index}`}
                                                            value={item.itemName}
                                                            onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                                            className={`form-input ${item.errors.itemName ? 'error' : ''}`}
                                                            placeholder="Search inventory..."
                                                            autoComplete="off"
                                                        />
                                                        <datalist id={`inventory-list-${index}`}>
                                                            {inventoryItems.map(invItem => (
                                                                <option key={invItem._id} value={invItem.name || invItem.itemName}>
                                                                    {invItem.name || invItem.itemName} - {formatCurrency(invItem.unitPrice || invItem.price)} / {invItem.unit}
                                                                </option>
                                                            ))}
                                                        </datalist>
                                                    </div>
                                                    {item.errors.itemName && (
                                                        <p className="error-text">{item.errors.itemName}</p>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        className={`form-input quantity-input ${item.errors.quantity ? 'error' : ''}`}
                                                        placeholder="0"
                                                    />
                                                    {item.errors.quantity && (
                                                        <p className="error-text">{item.errors.quantity}</p>
                                                    )}
                                                </td>
                                                <td>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                                        className={`form-select ${item.errors.unit ? 'error' : ''}`}
                                                    >
                                                        <option value="">Select unit</option>
                                                        <option value="piece">Piece</option>
                                                        <option value="roll">Roll</option>
                                                        <option value="ream">Ream</option>
                                                        <option value="box">Box</option>
                                                        <option value="book">Book</option>
                                                        <option value="pack">Pack</option>
                                                        <option value="set">Set</option>
                                                        <option value="bottle">Bottle</option>
                                                        <option value="toner">Toner</option>
                                                    </select>
                                                    {item.errors.unit && (
                                                        <p className="error-text">{item.errors.unit}</p>
                                                    )}
                                                </td>
                                                <td className="price-cell">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="total-cell">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                                <td className="actions-cell">
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="remove-btn"
                                                            title="Remove item"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="add-item-section">
                                <button type="button" className="btn-outline" onClick={addItem}>
                                    <span className="btn-icon">+</span>
                                    Add Another Item
                                </button>
                            </div>

                            {/* Summary Row */}
                            <div className="summary-section">
                                <div className="summary-card">
                                    <div className="summary-label">Overall Total:</div>
                                    <div className="summary-value">{formatCurrency(calculateOverallTotal())}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Additional Notes</h3>
                            <p className="card-description">Any special instructions or comments</p>
                        </div>
                        <div className="card-content">
                            <textarea
                                className="form-textarea"
                                placeholder="Enter any additional notes or special requirements here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div>
                                <p className="stat-label">Total Items</p>
                                <p className="stat-value">{items.length}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div>
                                <p className="stat-label">Total Quantity</p>
                                <p className="stat-value">{calculateTotalQuantity()}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div>
                                <p className="stat-label">Overall Total</p>
                                <p className="stat-value stat-value-primary">{formatCurrency(calculateOverallTotal())}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleClear}>
                            Clear Form
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Requisition'
                            )}
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="help-text">
                        <p>Fields marked with <span className="required-text">*</span> are required.</p>
                        <p>Your request will be reviewed by the approver before processing.</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyRequests;