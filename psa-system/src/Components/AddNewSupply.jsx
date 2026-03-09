import React, { useState } from 'react';
import './AddNewSupply.css';

const AddNewSupply = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ productTitle: '', productQuantity: '', category: 'Office Supplies', unitPrice: '', totalAmount: '' });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New Supply:', formData);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
        <h2>Add New Supply</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Title:</label>
            <input type="text" name="productTitle" value={formData.productTitle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Product Quantity:</label>
            <input type="number" name="productQuantity" value={formData.productQuantity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category:</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              <option value="Office Supplies">Office Supplies</option>
            </select>
          </div>
          <div className="form-group">
            <label>Unit Price:</label>
            <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Total Amount:</label>
            <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} required />
          </div>
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Supply</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewSupply;
