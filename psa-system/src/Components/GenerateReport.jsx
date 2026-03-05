import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './GenerateReport.css';

const GenerateReport = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ reportType: 'inventory', startDate: '', endDate: '' });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const doc = new jsPDF();
    doc.text(`Report Type: ${formData.reportType}`, 10, 10);
    doc.text(`Start Date: ${formData.startDate}`, 10, 20);
    doc.text(`End Date: ${formData.endDate}`, 10, 30);
    doc.text('Sample Data:', 10, 40);
    doc.text('Total Supplies: 150', 10, 50);
    doc.text('Recent Activities: 5', 10, 60);
    doc.save(`${formData.reportType}_report.pdf`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Generate Report</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Report Type:</label>
            <select name="reportType" value={formData.reportType} onChange={handleChange}>
              <option value="inventory">Inventory Report</option>
              <option value="activity">Activity Report</option>
              <option value="usage">Usage Report</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start Date:</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>End Date:</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
          </div>
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Generate Report</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateReport;
