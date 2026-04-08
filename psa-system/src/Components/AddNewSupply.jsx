import React, { useState, useEffect, useRef } from 'react';
import './AddNewSupply.css';

const AddNewSupply = ({ isOpen, onClose, onSupplyAdded }) => {
  const [formData, setFormData] = useState({
    productTitle: '',
    productQuantity: '',
    category: 'Office Supplies',
    unitPrice: '',
    totalAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'productQuantity' && value < 0) return;
    if (name === 'unitPrice' && value < 0) return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'productQuantity' || name === 'unitPrice') {
      const quantity = name === 'productQuantity' ? value : formData.productQuantity;
      const price = name === 'unitPrice' ? value : formData.unitPrice;

      if (quantity && price && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
        const total = parseFloat(quantity) * parseFloat(price);
        setFormData(prev => ({
          ...prev,
          totalAmount: total.toFixed(2)
        }));
      } else if (!quantity || !price) {
        setFormData(prev => ({
          ...prev,
          totalAmount: ''
        }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'productTitle':
        return value.trim() ? '' : 'Product title is required';
      case 'productQuantity':
        return !value || value <= 0 ? 'Valid quantity is required' : '';
      case 'unitPrice':
        return !value || value <= 0 ? 'Valid unit price is required' : '';
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

    const allTouched = {
      productTitle: true,
      productQuantity: true,
      unitPrice: true
    };
    setTouched(allTouched);

    const errors = Object.keys(allTouched).map(field => validateField(field, formData[field]));
    if (errors.some(error => error)) {
      setError('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const supplyData = {
        name: formData.productTitle.trim(),
        quantity: parseInt(formData.productQuantity),
        category: formData.category,
        unitPrice: parseFloat(formData.unitPrice),
        totalPrice: parseFloat(formData.totalAmount) || (parseFloat(formData.productQuantity) * parseFloat(formData.unitPrice))
      };

      const response = await fetch('http://localhost:5000/api/inventories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplyData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add supply');
      }

      setFormData({
        productTitle: '',
        productQuantity: '',
        category: 'Office Supplies',
        unitPrice: '',
        totalAmount: ''
      });
      setTouched({});

      if (onSupplyAdded) {
        onSupplyAdded(responseData.data || responseData);
      }

      onClose();

    } catch (error) {
      console.error('Error adding supply:', error);
      setError(error.message || 'Failed to add supply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Stationery',
    'Equipment',
    'Others'
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Supply</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>×</button>
        </div>

        {error && (
          <div className="modal-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Product Title <span className="required">*</span></label>
            <input
              ref={firstInputRef}
              type="text"
              name="productTitle"
              value={formData.productTitle}
              onChange={handleChange}
              onBlur={() => handleBlur('productTitle')}
              placeholder="Enter product title"
              disabled={loading}
              className={getFieldError('productTitle') ? 'error' : ''}
            />
            {getFieldError('productTitle') && (
              <span className="field-error">{getFieldError('productTitle')}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Product Quantity <span className="required">*</span></label>
              <input
                type="number"
                name="productQuantity"
                value={formData.productQuantity}
                onChange={handleChange}
                onBlur={() => handleBlur('productQuantity')}
                placeholder="Enter quantity"
                min="1"
                step="1"
                disabled={loading}
                className={getFieldError('productQuantity') ? 'error' : ''}
              />
              {getFieldError('productQuantity') && (
                <span className="field-error">{getFieldError('productQuantity')}</span>
              )}
            </div>

            <div className="form-field">
              <label>Category <span className="required">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Unit Price ($) <span className="required">*</span></label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                onBlur={() => handleBlur('unitPrice')}
                placeholder="Enter unit price"
                min="0.01"
                step="0.01"
                disabled={loading}
                className={getFieldError('unitPrice') ? 'error' : ''}
              />
              {getFieldError('unitPrice') && (
                <span className="field-error">{getFieldError('unitPrice')}</span>
              )}
            </div>

            <div className="form-field">
              <label>Total Amount ($)</label>
              <input
                type="text"
                name="totalAmount"
                value={formData.totalAmount}
                readOnly
                disabled={loading}
                placeholder="Auto-calculated"
                className="readonly-field"
              />
              <span className="helper-text">Auto-calculated from quantity and unit price</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Supply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewSupply;