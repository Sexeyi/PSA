import React, { useState } from "react";

const EditInventoryModal = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: item.name || "",
        unit: item.unit || "",
        category: item.category || "",
        stock: item.stock || 0,
        unitPrice: item.unitPrice || 0,
        inventoryDec31: {
            qty: item.inventoryDec31?.qty || 0,
            unitPrice: item.inventoryDec31?.unitPrice || 0,
            total: item.inventoryDec31?.total || 0
        },
        additions: {
            qty: item.additions?.qty || 0,
            unitPrice: item.additions?.unitPrice || 0,
            total: item.additions?.total || 0
        },
        issuances: {
            qty: item.issuances?.qty || 0,
            unitPrice: item.issuances?.unitPrice || 0,
            total: item.issuances?.total || 0
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNestedChange = (section, field, value) => {
        const numValue = parseFloat(value) || 0;

        setFormData(prev => {
            const updatedSection = {
                ...prev[section],
                [field]: numValue
            };

            // Recalculate total for the section
            if (field === 'qty' || field === 'unitPrice') {
                const qty = field === 'qty' ? numValue : prev[section].qty;
                const unitPrice = field === 'unitPrice' ? numValue : prev[section].unitPrice;
                updatedSection.total = qty * unitPrice;
            }

            return {
                ...prev,
                [section]: updatedSection
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Recalculate final stock and unit price based on balances
        const totalQty = formData.inventoryDec31.qty + formData.additions.qty - formData.issuances.qty;
        const totalValue = formData.inventoryDec31.total + formData.additions.total - formData.issuances.total;

        const updatedItem = {
            ...item,
            ...formData,
            stock: totalQty,
            unitPrice: totalQty > 0 ? totalValue / totalQty : 0,
            balances: {
                qty: totalQty,
                unitPrice: totalQty > 0 ? totalValue / totalQty : 0,
                total: totalValue
            }
        };

        onSave(updatedItem);
    };

    const formatCurrency = (amount) => {
        return `₱${Number(amount || 0).toFixed(2)}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Edit Inventory Item</h2>
                        <button
                            onClick={onClose}
                            className="text-2xl text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit</label>
                            <input
                                type="text"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    {/* Inventory Dec 31 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Inventory as of December 31</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.inventoryDec31.qty}
                                    onChange={(e) => handleNestedChange('inventoryDec31', 'qty', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                                <input
                                    type="number"
                                    value={formData.inventoryDec31.unitPrice}
                                    onChange={(e) => handleNestedChange('inventoryDec31', 'unitPrice', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Total</label>
                                <input
                                    type="text"
                                    value={formatCurrency(formData.inventoryDec31.total)}
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additions */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Additions</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.additions.qty}
                                    onChange={(e) => handleNestedChange('additions', 'qty', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                                <input
                                    type="number"
                                    value={formData.additions.unitPrice}
                                    onChange={(e) => handleNestedChange('additions', 'unitPrice', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Total</label>
                                <input
                                    type="text"
                                    value={formatCurrency(formData.additions.total)}
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Issuances */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Issuances</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.issuances.qty}
                                    onChange={(e) => handleNestedChange('issuances', 'qty', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                                <input
                                    type="number"
                                    value={formData.issuances.unitPrice}
                                    onChange={(e) => handleNestedChange('issuances', 'unitPrice', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Total</label>
                                <input
                                    type="text"
                                    value={formatCurrency(formData.issuances.total)}
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Current Balance (Auto-calculated)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Stock Quantity</p>
                                <p className="text-lg font-bold">
                                    {formData.inventoryDec31.qty + formData.additions.qty - formData.issuances.qty}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Unit Price</p>
                                <p className="text-lg font-bold">
                                    {formatCurrency(
                                        (formData.inventoryDec31.qty + formData.additions.qty - formData.issuances.qty) > 0
                                            ? (formData.inventoryDec31.total + formData.additions.total - formData.issuances.total) /
                                            (formData.inventoryDec31.qty + formData.additions.qty - formData.issuances.qty)
                                            : 0
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Total Value</p>
                                <p className="text-lg font-bold">
                                    {formatCurrency(formData.inventoryDec31.total + formData.additions.total - formData.issuances.total)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditInventoryModal;