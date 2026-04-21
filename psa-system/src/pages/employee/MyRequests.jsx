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
        stock: 0,
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
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchInventoryItems();
    }, []);

    // Update position on scroll and resize
    useEffect(() => {
        if (showSuggestions !== null) {
            const updatePosition = () => {
                if (inputRefs.current[showSuggestions]) {
                    const rect = inputRefs.current[showSuggestions].getBoundingClientRect();
                    setSuggestionPosition({
                        top: rect.bottom + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            };

            updatePosition();

            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [showSuggestions]);

    const fetchInventoryItems = async () => {
        setLoadingInventory(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/api/inventories`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Handle different response structures
            let inventoryData = [];
            if (response.data.data && Array.isArray(response.data.data)) {
                inventoryData = response.data.data;
            } else if (Array.isArray(response.data)) {
                inventoryData = response.data;
            } else if (response.data.inventories && Array.isArray(response.data.inventories)) {
                inventoryData = response.data.inventories;
            } else {
                inventoryData = [];
            }

            console.log("Inventory data loaded:", inventoryData);
            setInventoryItems(inventoryData);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            setErrorMessage("Failed to load inventory items");
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setLoadingInventory(false);
        }
    };

    // Helper function to get available stock from inventory item
    const getAvailableStock = (inventoryItem) => {
        return inventoryItem.stock ||
            inventoryItem.balances?.qty ||
            inventoryItem.quantity ||
            0;
    };

    // Helper function to get unit price from inventory item
    const getUnitPrice = (inventoryItem) => {
        return inventoryItem.unitPrice ||
            inventoryItem.price ||
            inventoryItem.balances?.unitPrice ||
            0;
    };

    const getFilteredSuggestions = (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === "") return [];
        const term = searchTerm.toLowerCase().trim();
        return inventoryItems
            .filter(item => {
                const itemName = item.name || item.itemName || "";
                return itemName.toLowerCase().includes(term);
            })
            .slice(0, 6)
            .map(item => ({
                ...item,
                availableStock: getAvailableStock(item),
                unitPrice: getUnitPrice(item)
            }));
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

    const checkStockAvailability = (itemName, requestedQuantity) => {
        const inventoryItem = inventoryItems.find(
            item => (item.name || item.itemName || "").toLowerCase() === itemName.toLowerCase()
        );

        if (inventoryItem) {
            const availableStock = getAvailableStock(inventoryItem);
            return {
                available: availableStock,
                isAvailable: availableStock > 0,
                hasEnoughStock: requestedQuantity <= availableStock,
                item: inventoryItem,
                unitPrice: getUnitPrice(inventoryItem)
            };
        }
        return { available: 0, isAvailable: false, hasEnoughStock: false, item: null, unitPrice: 0 };
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];

        if (field === "itemName") {
            updated[index].itemName = value;

            // Clear itemName error when user types
            if (updated[index].errors?.itemName) {
                delete updated[index].errors.itemName;
            }

            if (value && value.trim() !== "") {
                updateSuggestionPosition(index);
                setShowSuggestions(index);
            } else {
                setShowSuggestions(null);
            }
            setActiveSuggestionIndex(null);

            updated[index].stock = 0;
            updated[index].unitPrice = 0;
            updated[index].totalPrice = 0;
            if (updated[index].errors) {
                updated[index].errors.stockError = null;
            }
        } else if (field === "quantity") {
            const quantity = Number(value) || 0;
            const unitPrice = updated[index].unitPrice || 0;
            updated[index].quantity = quantity;
            updated[index].totalPrice = quantity * unitPrice;

            // Clear quantity error
            if (updated[index].errors?.quantity) {
                delete updated[index].errors.quantity;
            }

            if (updated[index].itemName && quantity > 0) {
                const stockCheck = checkStockAvailability(updated[index].itemName, quantity);
                if (!stockCheck.hasEnoughStock && stockCheck.available > 0) {
                    if (!updated[index].errors) updated[index].errors = {};
                    updated[index].errors.quantity = `Only ${stockCheck.available} item(s) available in stock`;
                } else if (stockCheck.available === 0) {
                    if (!updated[index].errors) updated[index].errors = {};
                    updated[index].errors.quantity = `Item is out of stock`;
                } else {
                    if (updated[index].errors?.quantity) {
                        delete updated[index].errors.quantity;
                    }
                }
            }
        } else if (field === "unit") {
            updated[index].unit = value;
            // Clear unit error when unit is selected
            if (updated[index].errors?.unit) {
                delete updated[index].errors.unit;
            }
        } else {
            updated[index][field] = value;
        }

        setItems(updated);
        validateItem(updated[index], index);
    };

    const handleSelectSuggestion = (index, suggestion) => {
        const updated = [...items];
        const quantity = Number(updated[index].quantity) || 0;
        const availableStock = suggestion.availableStock || 0;
        const unitPrice = suggestion.unitPrice || 0;
        const isOutOfStock = availableStock === 0;

        // Calculate total price immediately
        const totalPrice = quantity * unitPrice;

        updated[index].itemName = suggestion.name || suggestion.itemName;
        updated[index].unit = suggestion.unit || "";
        updated[index].category = suggestion.category || "";
        updated[index].unitPrice = unitPrice;
        updated[index].stock = availableStock;
        updated[index].totalPrice = totalPrice;

        // Initialize errors object if it doesn't exist
        if (!updated[index].errors) updated[index].errors = {};

        if (isOutOfStock) {
            updated[index].errors.stockError = "This item is currently out of stock";
            updated[index].errors.quantity = "Cannot request out of stock item";
            setErrorMessage(`"${updated[index].itemName}" is out of stock and cannot be requested`);
            setTimeout(() => setErrorMessage(""), 5000);
        } else if (quantity > availableStock) {
            updated[index].errors.quantity = `Only ${availableStock} item(s) available in stock`;
        } else {
            delete updated[index].errors.stockError;
            delete updated[index].errors.quantity;
        }

        setItems(updated);
        setShowSuggestions(null);
        setActiveSuggestionIndex(null);
        validateItem(updated[index], index);
    };

    const handleQuantityChange = (index, value) => {
        const updated = [...items];
        const quantity = Number(value) || 0;
        const unitPrice = updated[index].unitPrice || 0;

        // Calculate total price when quantity changes
        updated[index].quantity = quantity;
        updated[index].totalPrice = quantity * unitPrice;

        // Clear quantity error
        if (updated[index].errors?.quantity) {
            delete updated[index].errors.quantity;
        }

        if (updated[index].itemName && quantity > 0) {
            const stockCheck = checkStockAvailability(updated[index].itemName, quantity);
            if (!stockCheck.hasEnoughStock && stockCheck.available > 0) {
                if (!updated[index].errors) updated[index].errors = {};
                updated[index].errors.quantity = `Only ${stockCheck.available} item(s) available in stock`;
            } else if (stockCheck.available === 0) {
                if (!updated[index].errors) updated[index].errors = {};
                updated[index].errors.quantity = `Item is out of stock`;
            } else {
                if (updated[index].errors?.quantity) {
                    delete updated[index].errors.quantity;
                }
            }
        }

        setItems(updated);
        validateItem(updated[index], index);
    };

    const validateItem = (item, index) => {
        const errors = { ...(item.errors || {}) };

        // Validate item name
        if (!item.itemName || !item.itemName.trim()) {
            errors.itemName = "Item name is required";
        } else {
            delete errors.itemName;
        }

        // Validate quantity
        if (!item.quantity || item.quantity <= 0) {
            errors.quantity = "Quantity must be greater than 0";
        } else if (item.quantity > 0) {
            // Only remove quantity error if it's not a stock-related error
            if (errors.quantity && !errors.quantity.includes("Only") && !errors.quantity.includes("out of stock")) {
                delete errors.quantity;
            }
        }

        // Validate unit
        if (!item.unit) {
            errors.unit = "Unit is required";
        } else {
            delete errors.unit;
        }

        // Check stock status
        if (item.itemName && item.stock === 0 && item.itemName.trim() !== "") {
            errors.stockError = "This item is out of stock";
            if (!errors.quantity) {
                errors.quantity = "Cannot request out of stock item";
            }
        }

        setItems(prev => prev.map((i, idx) =>
            idx === index ? { ...i, errors } : i
        ));

        // Return true if no errors (excluding stockError which is informational)
        const criticalErrors = Object.keys(errors).filter(key => key !== 'stockError');
        return criticalErrors.length === 0;
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
            stock: 0,
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

    const validateAllItemsStock = () => {
        let hasOutOfStockItems = false;
        let stockErrors = [];

        items.forEach((item) => {
            if (item.itemName && item.itemName.trim() !== "") {
                const stockCheck = checkStockAvailability(item.itemName, Number(item.quantity) || 0);
                if (stockCheck.available === 0) {
                    hasOutOfStockItems = true;
                    stockErrors.push(`"${item.itemName}" is out of stock`);
                } else if (!stockCheck.hasEnoughStock && stockCheck.available > 0) {
                    hasOutOfStockItems = true;
                    stockErrors.push(`"${item.itemName}" only has ${stockCheck.available} item(s) available`);
                }
            }
        });

        return { hasOutOfStockItems, stockErrors };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let isValid = true;

        // Validate all items
        items.forEach((item, index) => {
            const itemIsValid = validateItem(item, index);
            if (!itemIsValid) {
                isValid = false;
            }
        });

        // Check if any item has errors
        const hasErrors = items.some(item => {
            if (!item.errors) return false;
            const criticalErrors = Object.keys(item.errors).filter(key => key !== 'stockError');
            return criticalErrors.length > 0;
        });

        if (hasErrors) {
            setErrorMessage("Please fix all errors before submitting");
            setTimeout(() => setErrorMessage(""), 5000);
            return;
        }

        // Check if at least one item is filled
        const hasAnyItem = items.some(item =>
            item.itemName && item.itemName.trim() !== "" &&
            item.quantity && item.quantity > 0 &&
            item.unit
        );

        if (!hasAnyItem) {
            setErrorMessage("Please add at least one valid item to your requisition");
            setTimeout(() => setErrorMessage(""), 5000);
            return;
        }

        const { hasOutOfStockItems, stockErrors } = validateAllItemsStock();

        if (hasOutOfStockItems) {
            setErrorMessage(`Cannot submit requisition: ${stockErrors.join(", ")}`);
            setTimeout(() => setErrorMessage(""), 8000);
            return;
        }

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
            const userData = JSON.parse(localStorage.getItem("user"));

            // Calculate overall total
            const overallTotal = calculateOverallTotal();

            // Prepare items with all necessary fields including prices
            const preparedItems = items.map(item => ({
                itemName: item.itemName,
                quantity: Number(item.quantity),
                unit: item.unit,
                category: item.category,
                unitPrice: Number(item.unitPrice) || 0,
                totalPrice: Number(item.totalPrice) || 0
            }));

            const payload = {
                requesterId: userData._id,
                requesterName: userData.fullName || userData.name,
                department: userData.department || "N/A",
                items: preparedItems,
                notes: notes,
                overallTotal: overallTotal
            };

            console.log("Submitting payload:", JSON.stringify(payload, null, 2));

            const response = await axios.post(
                `${API_BASE_URL}/api/requisitions`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Response:", response.data);

            setSuccessMessage("Requisition submitted successfully!");

            // Reset form
            setItems([{
                id: 1,
                itemName: "",
                quantity: "",
                unit: "",
                category: "",
                unitPrice: 0,
                totalPrice: 0,
                stock: 0,
                errors: {}
            }]);
            setNotes("");
            setShowSuggestions(null);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(""), 5000);

        } catch (error) {
            console.error("Error details:", error.response?.data || error);
            setErrorMessage(error.response?.data?.message || "Error submitting requisition. Please try again.");
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
                stock: 0,
                errors: {}
            }]);
            setNotes("");
            setShowSuggestions(null);
            setErrorMessage("");
            setSuccessMessage("");
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
                <p>Loading inventory items...</p>
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
                        <span className="alert-icon">✓</span>
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Items Section */}
                    <div className="section">
                        <div className="section-header">
                            <h3>Request Items</h3>
                            <p>Add the items you need to request</p>
                        </div>

                        <div className="table-wrapper">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Item Name <span className="required">*</span></th>
                                        <th style={{ width: '15%' }}>Quantity <span className="required">*</span></th>
                                        <th style={{ width: '15%' }}>Unit <span className="required">*</span></th>
                                        <th style={{ width: '15%' }}>Unit Price</th>
                                        <th style={{ width: '15%' }}>Total</th>
                                        <th style={{ width: '15%' }}>Stock Status</th>
                                        <th style={{ width: '5%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => {
                                        const suggestions = getFilteredSuggestions(item.itemName);
                                        const isOutOfStock = item.stock === 0 && item.itemName && item.itemName.trim() !== "";
                                        const isLowStock = item.stock > 0 && item.stock <= 5;

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
                                                            className={item.errors?.itemName ? 'error' : ''}
                                                            placeholder="Type item name..."
                                                            autoComplete="off"
                                                        />
                                                        {item.errors?.itemName && (
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
                                                        className={item.errors?.quantity ? 'error' : ''}
                                                        placeholder="0"
                                                        disabled={isOutOfStock}
                                                    />
                                                    {item.errors?.quantity && (
                                                        <span className="error-text">{item.errors.quantity}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                                        className={item.errors?.unit ? 'error' : ''}
                                                        disabled={isOutOfStock}
                                                    >
                                                        <option value="">Select Unit</option>
                                                        <option value="piece">Piece(s)</option>
                                                        <option value="roll">Roll(s)</option>
                                                        <option value="ream">Ream(s)</option>
                                                        <option value="box">Box(es)</option>
                                                        <option value="pack">Pack(s)</option>
                                                        <option value="set">Set(s)</option>
                                                        <option value="bottle">Bottle(s)</option>
                                                        <option value="bundle">Bundle(s)</option>
                                                        <option value="pad">Pad(s)</option>
                                                    </select>
                                                    {item.errors?.unit && (
                                                        <span className="error-text">{item.errors.unit}</span>
                                                    )}
                                                </td>
                                                <td className="price-cell">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="total-cell">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                                <td className="stock-status-cell">
                                                    {item.itemName && item.itemName.trim() !== "" && item.stock !== undefined && (
                                                        <div className={`stock-status ${item.stock === 0 ? 'out-of-stock' : item.stock <= 5 ? 'low-stock' : 'in-stock'}`}>
                                                            {item.stock === 0 ? (
                                                                <span className="status-text out">Out of Stock</span>
                                                            ) : item.stock <= 5 ? (
                                                                <span className="status-text low">Low Stock ({item.stock} left)</span>
                                                            ) : (
                                                                <span className="status-text in">In Stock ({item.stock})</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="remove-btn"
                                                            aria-label="Remove item"
                                                        >
                                                            ✕
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
                            <button type="button" onClick={addItem} className="add-btn">
                                + Add Another Item
                            </button>
                        </div>

                        <div className="summary">
                            <div className="summary-row">
                                <span>Total Amount:</span>
                                <span className="total-amount">{formatCurrency(calculateOverallTotal())}</span>
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
                            className="notes-textarea"
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
                            <strong className="total-value">{formatCurrency(calculateOverallTotal())}</strong>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="actions">
                        <button type="button" onClick={handleClear} className="clear-btn" disabled={submitting}>
                            Clear Form
                        </button>
                        <button type="submit" disabled={submitting} className="submit-btn">
                            {submitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Requisition'
                            )}
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="help">
                        <p>Fields marked with <span className="required">*</span> are required.</p>
                        <p>Your request will be reviewed by the approver before processing.</p>
                        <p className="stock-note">Note: Items marked as "Out of Stock" cannot be requested.</p>
                    </div>
                </form>
            </div>

            {/* Global Suggestions Dropdown */}
            {showSuggestions !== null && items[showSuggestions] && getFilteredSuggestions(items[showSuggestions]?.itemName).length > 0 && (
                <div
                    ref={dropdownRef}
                    className="suggestions-dropdown-overlay"
                    style={{
                        position: 'absolute',
                        top: suggestionPosition.top,
                        left: suggestionPosition.left,
                        width: suggestionPosition.width,
                        zIndex: 1000
                    }}
                >
                    <ul className="suggestions-list">
                        {getFilteredSuggestions(items[showSuggestions]?.itemName).map((suggestion, idx) => (
                            <li
                                key={suggestion._id || suggestion.id || idx}
                                className={activeSuggestionIndex === idx ? 'active' : ''}
                                onClick={() => handleSelectSuggestion(showSuggestions, suggestion)}
                            >
                                <div className="suggestion-item">
                                    <span className="suggestion-name">{suggestion.name || suggestion.itemName}</span>
                                    <span className="suggestion-price">{formatCurrency(suggestion.unitPrice)}</span>
                                    <span className="suggestion-stock">Stock: {suggestion.availableStock}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MyRequests;