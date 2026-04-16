import React, { useState, useEffect, useRef, useCallback } from "react";
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
    const [showSuggestions, setShowSuggestions] = useState(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
    const [suggestionPosition, setSuggestionPosition] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const inputRefs = useRef({});

    useEffect(() => {
        fetchInventoryItems();
    }, []);

    const fetchInventoryItems = async () => {
        setLoadingInventory(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/api/inventories`, {
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

    const getFilteredSuggestions = (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === "") return [];
        const term = searchTerm.toLowerCase().trim();
        return inventoryItems
            .filter(item => (item.name || item.itemName || "").toLowerCase().includes(term))
            .slice(0, 6);
    };

    const updateSuggestionPosition = (index) => {
        if (inputRefs.current[index]) {
            const rect = inputRefs.current[index].getBoundingClientRect();
            setSuggestionPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];

        if (field === "itemName") {
            updated[index].itemName = value;
            if (value && value.trim() !== "") {
                updateSuggestionPosition(index);
                setShowSuggestions(index);
            } else {
                setShowSuggestions(null);
            }
            setActiveSuggestionIndex(null);
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

    const handleSelectSuggestion = (index, suggestion) => {
        const updated = [...items];
        const quantity = Number(updated[index].quantity) || 0;

        updated[index].itemName = suggestion.name || suggestion.itemName;
        updated[index].unit = suggestion.unit || "";
        updated[index].category = suggestion.category || "";
        updated[index].unitPrice = suggestion.unitPrice || suggestion.price || 0;
        updated[index].totalPrice = quantity * (suggestion.unitPrice || suggestion.price || 0);

        setItems(updated);
        setShowSuggestions(null);
        setActiveSuggestionIndex(null);
        validateItem(updated[index], index);
    };

    const handleQuantityChange = (index, value) => {
        const updated = [...items];
        const quantity = Number(value) || 0;
        updated[index].quantity = quantity;
        updated[index].totalPrice = quantity * (updated[index].unitPrice || 0);
        setItems(updated);
        validateItem(updated[index], index);
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
            const updated = items.filter((_, i) => i !== index);
            setItems(updated);
            setShowSuggestions(null);
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

            setSuccessMessage("Requisition submitted successfully");

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
            setShowSuggestions(null);
        }
    };

    const handleKeyDown = (e, index, suggestions) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev =>
                prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1)
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev =>
                prev === null ? suggestions.length - 1 : Math.max(prev - 1, 0)
            );
        } else if (e.key === 'Enter' && activeSuggestionIndex !== null) {
            e.preventDefault();
            handleSelectSuggestion(index, suggestions[activeSuggestionIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(null);
            setActiveSuggestionIndex(null);
        }
    };

    const handleFocus = (index, value) => {
        if (value && value.trim() !== "") {
            updateSuggestionPosition(index);
            setShowSuggestions(index);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.suggestions-container') && !e.target.closest('.suggestions-dropdown-overlay')) {
                setShowSuggestions(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (loadingInventory) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading inventory...</p>
            </div>
        );
    }

    return (
        <div className="requests-container">
            <div className="requests-wrapper">
                {/* Header */}
                <div className="requests-header">
                    <h1>Create New Requisition</h1>
                    <p>Fill out the form below to submit your request for approval</p>
                </div>

                {/* Messages */}
                {successMessage && (
                    <div className="alert alert-success">
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="alert alert-error">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Items Section */}
                    <div className="section">
                        <div className="section-header">
                            <h3>Request Items</h3>
                        </div>

                        <div className="table-wrapper">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Item Name <span className="required">*</span></th>
                                        <th>Quantity <span className="required">*</span></th>
                                        <th>Unit <span className="required">*</span></th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => {
                                        const suggestions = getFilteredSuggestions(item.itemName);
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="suggestions-container">
                                                        <input
                                                            ref={el => inputRefs.current[index] = el}
                                                            type="text"
                                                            value={item.itemName}
                                                            onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                                            onFocus={() => handleFocus(index, item.itemName)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, suggestions)}
                                                            className={item.errors.itemName ? 'error' : ''}
                                                            placeholder="Type item name..."
                                                            autoComplete="off"
                                                        />
                                                        {item.errors.itemName && (
                                                            <span className="error-text">{item.errors.itemName}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        className={item.errors.quantity ? 'error' : ''}
                                                        placeholder="0"
                                                    />
                                                    {item.errors.quantity && (
                                                        <span className="error-text">{item.errors.quantity}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                                        className={item.errors.unit ? 'error' : ''}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="piece">Piece</option>
                                                        <option value="roll">Roll</option>
                                                        <option value="ream">Ream</option>
                                                        <option value="box">Box</option>
                                                        <option value="pack">Pack</option>
                                                        <option value="set">Set</option>
                                                        <option value="bottle">Bottle</option>
                                                    </select>
                                                    {item.errors.unit && (
                                                        <span className="error-text">{item.errors.unit}</span>
                                                    )}
                                                </td>
                                                <td className="price-cell">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="total-cell">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                                <td>
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="remove-btn"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="add-item">
                            <button type="button" onClick={addItem}>
                                + Add Another Item
                            </button>
                        </div>

                        <div className="summary">
                            <div className="summary-row">
                                <span>Total Amount:</span>
                                <span>{formatCurrency(calculateOverallTotal())}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="section">
                        <div className="section-header">
                            <h3>Additional Notes</h3>
                            <p>Optional - Any special instructions or comments</p>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="4"
                            placeholder="Enter any additional notes here..."
                        />
                    </div>

                    {/* Summary Stats */}
                    <div className="stats">
                        <div className="stat">
                            <span>Items</span>
                            <strong>{items.length}</strong>
                        </div>
                        <div className="stat">
                            <span>Total Quantity</span>
                            <strong>{calculateTotalQuantity()}</strong>
                        </div>
                        <div className="stat">
                            <span>Overall Total</span>
                            <strong>{formatCurrency(calculateOverallTotal())}</strong>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="actions">
                        <button type="button" onClick={handleClear}>
                            Clear Form
                        </button>
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Requisition'}
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="help">
                        <p>Fields marked with * are required.</p>
                        <p>Your request will be reviewed before processing.</p>
                    </div>
                </form>
            </div>

            {/* Global Suggestions Dropdown - Overlays the page */}
            {showSuggestions !== null && getFilteredSuggestions(items[showSuggestions]?.itemName).length > 0 && (
                <div
                    className="suggestions-dropdown-overlay"
                    style={{
                        position: 'fixed',
                        top: suggestionPosition.top,
                        left: suggestionPosition.left,
                        width: suggestionPosition.width,
                        zIndex: 1000
                    }}
                >
                    <ul className="suggestions-list">
                        {getFilteredSuggestions(items[showSuggestions]?.itemName).map((suggestion, idx) => (
                            <li
                                key={suggestion._id}
                                className={activeSuggestionIndex === idx ? 'active' : ''}
                                onClick={() => handleSelectSuggestion(showSuggestions, suggestion)}
                            >
                                <span className="suggestion-name">{suggestion.name || suggestion.itemName}</span>
                                <span className="suggestion-unit">{suggestion.unit}</span>
                                <span className="suggestion-price">{formatCurrency(suggestion.unitPrice || suggestion.price)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MyRequests;