import React, { useState, useEffect } from "react";
import axios from "axios";

const MyRequests = () => {
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([{
        itemName: "",
        quantity: 0,
        unit: "",
        category: "",
        unitPrice: 0,
        totalPrice: 0
    }]);
    const [submitting, setSubmitting] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Fetch inventory items
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

    const handleItemChange = (index, field, value) => {
        const updated = [...items];

        if (field === "itemName") {
            // Find selected item in inventory
            const selectedInventory = inventoryItems.find(item =>
                (item.name === value || item.itemName === value) ||
                (item.name?.toLowerCase() === value.toLowerCase() || item.itemName?.toLowerCase() === value.toLowerCase())
            );

            if (selectedInventory) {
                updated[index].itemName = selectedInventory.name || selectedInventory.itemName;
                updated[index].unit = selectedInventory.unit || "pcs";
                updated[index].category = selectedInventory.category || "office";
                updated[index].unitPrice = selectedInventory.unitPrice || selectedInventory.price || 0;
                updated[index].totalPrice = (updated[index].quantity || 0) * updated[index].unitPrice;
            } else {
                updated[index][field] = value;
            }
        } else if (field === "quantity") {
            const quantity = Number(value) || 0;
            updated[index].quantity = quantity;
            updated[index].totalPrice = quantity * (updated[index].unitPrice || 0);
        } else {
            updated[index][field] = value;
        }

        setItems(updated);
    };

    const addItem = () => {
        setItems([...items, {
            itemName: "",
            quantity: 0,
            unit: "",
            category: "",
            unitPrice: 0,
            totalPrice: 0
        }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const hasEmptyFields = items.some(item => !item.itemName || !item.itemName.trim());
        if (hasEmptyFields) {
            alert("Please fill in all item names");
            return;
        }

        const hasInvalidQuantity = items.some(item => item.quantity <= 0);
        if (hasInvalidQuantity) {
            alert("Please enter valid quantities (greater than 0)");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const payload = {
                items: items.map(item => ({
                    itemName: item.itemName,
                    quantity: item.quantity,
                    unit: item.unit,
                    category: item.category,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                })),
                notes,
                grandTotal: calculateGrandTotal()
            };

            await axios.post(
                `${API_BASE_URL}/api/requisitions`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("✅ Requisition submitted successfully!");

            // Reset form
            setItems([{
                itemName: "",
                quantity: 0,
                unit: "",
                category: "",
                unitPrice: 0,
                totalPrice: 0
            }]);
            setNotes("");

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Error submitting requisition");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    if (loadingInventory) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-lg"></div>
                    <p className="mt-4 text-gray-600">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container-custom py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="gradient-text text-3xl font-bold">Create New Requisition</h1>
                    <p className="text-gray-600 mt-2">
                        Fill out the form below to submit your request for approval
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Items Section */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-semibold text-gray-900">Request Items</h2>
                            <p className="text-sm text-gray-500 mt-1">Add the items you need to request</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="min-w-[200px]">Item Name <span className="text-red-500">*</span></th>
                                        <th className="min-w-[100px]">Quantity</th>
                                        <th className="min-w-[100px]">Unit</th>
                                        <th className="min-w-[120px]">Unit Price</th>
                                        <th className="min-w-[120px]">Total Price</th>
                                        <th className="min-w-[120px]">Category</th>
                                        <th className="min-w-[80px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    list={`inventory-list-${index}`}
                                                    value={item.itemName}
                                                    onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                                    className="input w-full"
                                                    placeholder="Type to search inventory..."
                                                    required
                                                />
                                                <datalist id={`inventory-list-${index}`}>
                                                    {inventoryItems.map(invItem => (
                                                        <option key={invItem._id} value={invItem.name || invItem.itemName}>
                                                            {invItem.name || invItem.itemName} - {formatCurrency(invItem.unitPrice || invItem.price)} per {invItem.unit}
                                                        </option>
                                                    ))}
                                                </datalist>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity || ""}
                                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                    className="input w-24"
                                                    placeholder="Qty"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    readOnly
                                                    className="input bg-gray-50 w-24 cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(item.unitPrice)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-semibold text-primary-600">
                                                    {formatCurrency(item.totalPrice)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.category}
                                                    readOnly
                                                    className="input bg-gray-50 w-32 cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-danger-500 hover:text-danger-600 font-medium text-sm transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900">
                                            Grand Total:
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-lg font-bold text-primary-600">
                                                {formatCurrency(calculateGrandTotal())}
                                            </div>
                                        </td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                type="button"
                                onClick={addItem}
                                className="btn btn-secondary"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Another Item
                            </button>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
                            <p className="text-sm text-gray-500 mt-1">Any special instructions or comments</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                placeholder="Enter any additional notes or special requirements here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="input resize-none"
                            />
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-primary-50 rounded-xl border border-primary-200 p-5">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Total Items</p>
                                <p className="text-xl font-bold text-primary-600">{items.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Total Quantity</p>
                                <p className="text-xl font-bold text-primary-600">
                                    {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Grand Total</p>
                                <p className="text-xl font-bold text-primary-600">
                                    {formatCurrency(calculateGrandTotal())}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setItems([{
                                    itemName: "",
                                    quantity: 0,
                                    unit: "",
                                    category: "",
                                    unitPrice: 0,
                                    totalPrice: 0
                                }]);
                                setNotes("");
                            }}
                            className="btn btn-secondary"
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-sm mr-2"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Requisition'
                            )}
                        </button>
                    </div>
                </form>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Fields marked with <span className="text-red-500">*</span> are required. Unit prices are automatically populated from inventory database.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Your request will be reviewed by the approver before processing.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MyRequests;