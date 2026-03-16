import React, { useState } from 'react';

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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate total amount if both quantity and unit price are present
    if (name === 'productQuantity' || name === 'unitPrice') {
      const quantity = name === 'productQuantity' ? value : formData.productQuantity;
      const price = name === 'unitPrice' ? value : formData.unitPrice;

      if (quantity && price && !isNaN(quantity) && !isNaN(price)) {
        const total = parseFloat(quantity) * parseFloat(price);
        setFormData(prev => ({
          ...prev,
          totalAmount: total.toFixed(2)
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.productTitle.trim()) {
        throw new Error('Product title is required');
      }
      if (!formData.productQuantity || formData.productQuantity <= 0) {
        throw new Error('Valid product quantity is required');
      }
      if (!formData.unitPrice || formData.unitPrice <= 0) {
        throw new Error('Valid unit price is required');
      }

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare data for API
      const supplyData = {
        name: formData.productTitle.trim(),
        quantity: parseInt(formData.productQuantity),
        category: formData.category,
        unitPrice: parseFloat(formData.unitPrice),
        totalPrice: parseFloat(formData.totalAmount) || (parseFloat(formData.productQuantity) * parseFloat(formData.unitPrice))
      };

      console.log('Adding new supply:', supplyData);

      // Send to backend
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

      console.log('Supply added successfully:', responseData);

      // Reset form
      setFormData({
        productTitle: '',
        productQuantity: '',
        category: 'Office Supplies',
        unitPrice: '',
        totalAmount: ''
      });

      // Notify parent component
      if (onSupplyAdded) {
        onSupplyAdded(responseData.data || responseData);
      }

      // Close modal
      onClose();

    } catch (error) {
      console.error('Error adding supply:', error);
      setError(error.message || 'Failed to add supply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Category options
  const categoryOptions = [
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Stationery',
    'Equipment',
    'Others'
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Supply</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-800 p-3 rounded-lg border border-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Product Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productTitle"
                value={formData.productTitle}
                onChange={handleChange}
                placeholder="Enter product title"
                required
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Product Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="productQuantity"
                value={formData.productQuantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                min="1"
                step="1"
                required
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Unit Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="Enter unit price"
                min="0.01"
                step="0.01"
                required
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Total Amount (Auto-calculated) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Total Amount ($)
              </label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                placeholder="Auto-calculated"
                readOnly
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-calculated from quantity and unit price
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Supply'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewSupply;