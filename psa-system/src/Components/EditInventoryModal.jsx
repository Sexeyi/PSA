import React, { useState, useEffect, useRef } from "react";
import "./EditInventoryModal.css";

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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [touched, setTouched] = useState({});
    const firstInputRef = useRef(null);

    useEffect(() => {
        if (item) {
            firstInputRef.current?.focus();
            document.body.style.overflow = 'hidden';

            const handleEscape = (e) => {
                if (e.key === 'Escape' && !loading) {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = 'unset';
            };
        }
    }, [item, loading, onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleNestedChange = (section, field, value) => {
        const numValue = parseFloat(value) || 0;

        setFormData(prev => {
            const updatedSection = {
                ...prev[section],
                [field]: numValue
            };

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

    const validateField = (field, value) => {
        switch (field) {
            case 'name':
                return value.trim() ? '' : 'Item name is required';
            case 'unit':
                return value.trim() ? '' : 'Unit is required';
            case 'category':
                return value.trim() ? '' : 'Category is required';
            default:
                return '';
        }
    };

    const getFieldError = (field) => {
        if (!touched[field]) return '';
        return validateField(field, formData[field]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const allTouched = { name: true, unit: true, category: true };
        setTouched(allTouched);

        const errors = Object.keys(allTouched).map(field => validateField(field, formData[field]));
        if (errors.some(error => error)) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
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

            await new Promise(resolve => setTimeout(resolve, 500));
            onSave(updatedItem);
        } catch (err) {
            setError(err.message || 'Failed to save changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₱${Number(amount || 0).toFixed(2)}`;
    };

    const calculateCurrentStock = () => {
        return formData.inventoryDec31.qty + formData.additions.qty - formData.issuances.qty;
    };

    const calculateCurrentUnitPrice = () => {
        const totalQty = calculateCurrentStock();
        const totalValue = formData.inventoryDec31.total + formData.additions.total - formData.issuances.total;
        return totalQty > 0 ? totalValue / totalQty : 0;
    };

    const calculateCurrentTotal = () => {
        return formData.inventoryDec31.total + formData.additions.total - formData.issuances.total;
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
            <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Inventory Item</h2>
                    <button className="modal-close" onClick={onClose} disabled={loading}>×</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Item Name <span className="required">*</span></label>
                            <input
                                ref={firstInputRef}
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={() => handleBlur('name')}
                                placeholder="Enter item name"
                                disabled={loading}
                                className={getFieldError('name') ? 'error' : ''}
                            />
                            {getFieldError('name') && (
                                <span className="field-error">{getFieldError('name')}</span>
                            )}
                        </div>

                        <div className="form-field">
                            <label>Unit <span className="required">*</span></label>
                            <input
                                type="text"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                onBlur={() => handleBlur('unit')}
                                placeholder="e.g., pcs, kg, box"
                                disabled={loading}
                                className={getFieldError('unit') ? 'error' : ''}
                            />
                            {getFieldError('unit') && (
                                <span className="field-error">{getFieldError('unit')}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Category <span className="required">*</span></label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            onBlur={() => handleBlur('category')}
                            placeholder="Enter category"
                            disabled={loading}
                            className={getFieldError('category') ? 'error' : ''}
                        />
                        {getFieldError('category') && (
                            <span className="field-error">{getFieldError('category')}</span>
                        )}
                    </div>

                    <div className="section-title">Inventory as of December 31</div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={formData.inventoryDec31.qty}
                                onChange={(e) => handleNestedChange('inventoryDec31', 'qty', e.target.value)}
                                disabled={loading}
                                min="0"
                            />
                        </div>
                        <div className="form-field">
                            <label>Unit Price</label>
                            <input
                                type="number"
                                value={formData.inventoryDec31.unitPrice}
                                onChange={(e) => handleNestedChange('inventoryDec31', 'unitPrice', e.target.value)}
                                disabled={loading}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-field">
                            <label>Total Amount</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.inventoryDec31.total)}
                                readOnly
                                className="readonly-field"
                            />
                        </div>
                    </div>

                    <div className="section-title">Additions</div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={formData.additions.qty}
                                onChange={(e) => handleNestedChange('additions', 'qty', e.target.value)}
                                disabled={loading}
                                min="0"
                            />
                        </div>
                        <div className="form-field">
                            <label>Unit Price</label>
                            <input
                                type="number"
                                value={formData.additions.unitPrice}
                                onChange={(e) => handleNestedChange('additions', 'unitPrice', e.target.value)}
                                disabled={loading}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-field">
                            <label>Total Amount</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.additions.total)}
                                readOnly
                                className="readonly-field"
                            />
                        </div>
                    </div>

                    <div className="section-title">Issuances</div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={formData.issuances.qty}
                                onChange={(e) => handleNestedChange('issuances', 'qty', e.target.value)}
                                disabled={loading}
                                min="0"
                            />
                        </div>
                        <div className="form-field">
                            <label>Unit Price</label>
                            <input
                                type="number"
                                value={formData.issuances.unitPrice}
                                onChange={(e) => handleNestedChange('issuances', 'unitPrice', e.target.value)}
                                disabled={loading}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-field">
                            <label>Total Amount</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.issuances.total)}
                                readOnly
                                className="readonly-field"
                            />
                        </div>
                    </div>

                    <div className="summary-section">
                        <div className="section-title">Current Balance (Auto-calculated)</div>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <div className="summary-label">Stock Quantity</div>
                                <div className="summary-value">{calculateCurrentStock()}</div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-label">Unit Price</div>
                                <div className="summary-value">{formatCurrency(calculateCurrentUnitPrice())}</div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-label">Total Value</div>
                                <div className="summary-value">{formatCurrency(calculateCurrentTotal())}</div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditInventoryModal;