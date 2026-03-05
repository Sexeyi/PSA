import React, { useState } from 'react';
import './RequestForm.css';

const RequestForm = ({ onRequestSubmit }) => {
  const [formData, setFormData] = useState({
    requesterName: '',
    departmentUnit: '',
    positionRole: '',
    contactPhone: '',
    contactEmail: '',
    dateOfRequest: new Date().toISOString().split('T')[0],
    itemDescription: '',
    quantity: '',
    purposeJustification: '',
    neededByDate: '',
    inventoryBalance: '150 reams',
    unitPrice: '₱45.00',
    estimatedTotal: '₱90.00',
    budgetCode: '',
    approverName: '',
    decision: '',
    remarks: '',
    signatureDate: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate estimated total
    if (name === 'quantity') {
      const qty = parseInt(value) || 0;
      const unitPrice = parseFloat(formData.unitPrice.replace(/[^0-9.]/g, '')) || 0;
      const total = qty * unitPrice;
      setFormData({
        ...formData,
        [name]: value,
        estimatedTotal: `₱${total.toFixed(2)}`
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDecision = (decision) => {
    setFormData({
      ...formData,
      decision: decision,
      signatureDate: new Date().toLocaleDateString()
    });
  };

  const handleSubmit = () => {
    const newRequest = {
      id: Date.now(),
      requester: formData.requesterName || 'Unknown',
      department: formData.departmentUnit || 'Unknown',
      date: formData.dateOfRequest,
      type: 'Request',
      items: [
        { 
          name: formData.itemDescription || 'Unknown Item', 
          quantity: parseInt(formData.quantity) || 0, 
          status: formData.decision === 'Approve' ? 'Approved' : 'Pending' 
        }
      ],
      status: formData.decision === 'Approve' ? 'Completed' : 'Pending'
    };

    if (onRequestSubmit) {
      onRequestSubmit(prevData => [...(prevData || []), newRequest]);
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="request-form-container">
        <div className="request-form">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Request {formData.decision} Successfully!</h2>
            <p>The request has been processed and the requester has been notified.</p>
            <p><strong>Decision:</strong> {formData.decision}</p>
            <p><strong>Date:</strong> {formData.signatureDate}</p>
            <button 
              className="approve-btn" 
              onClick={() => setIsSubmitted(false)}
            >
              Process Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-form-container">
      <form className="request-form">
        <div className="form-header">
          <h1>Office Supplies Request</h1>
          <p>Requisition Management System</p>
        </div>

        {/* Requester Details */}
        <div className="form-section">
          <h2>Requester Details</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Name</th>
                <td>
                  <input
                    type="text"
                    name="requesterName"
                    value={formData.requesterName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>Department/Unit</th>
                <td>
                  <input
                    type="text"
                    name="departmentUnit"
                    value={formData.departmentUnit}
                    onChange={handleInputChange}
                    placeholder="Enter department/unit"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>Position/Role</th>
                <td>
                  <input
                    type="text"
                    name="positionRole"
                    value={formData.positionRole}
                    onChange={handleInputChange}
                    placeholder="Enter position/role"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>Contact (Phone)</th>
                <td>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>Contact (Email)</th>
                <td>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>Date of Request</th>
                <td>
                  <input
                    type="text"
                    name="dateOfRequest"
                    value={formData.dateOfRequest}
                    readOnly
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Requested Items */}
        <div className="form-section">
          <h2>Requested Items</h2>
          <table className="supplies-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Purpose/Justification</th>
                <th>Needed By (Date)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    name="itemDescription"
                    value={formData.itemDescription}
                    onChange={handleInputChange}
                    placeholder="e.g., Bond Paper, Legal"
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="1"
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="purposeJustification"
                    value={formData.purposeJustification}
                    onChange={handleInputChange}
                    placeholder="e.g., For monthly reports"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    name="neededByDate"
                    value={formData.neededByDate}
                    onChange={handleInputChange}
                    required
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* System-Generated Information */}
        <div className="form-section">
          <h2>System Information</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Current Inventory Balance</th>
                <td>
                  <input
                    type="text"
                    name="inventoryBalance"
                    value={formData.inventoryBalance}
                    readOnly
                  />
                </td>
              </tr>
              <tr>
                <th>Unit Price</th>
                <td>
                  <input
                    type="text"
                    name="unitPrice"
                    value={formData.unitPrice}
                    readOnly
                  />
                </td>
              </tr>
              <tr>
                <th>Estimated Total Cost</th>
                <td>
                  <input
                    type="text"
                    name="estimatedTotal"
                    value={formData.estimatedTotal}
                    readOnly
                  />
                </td>
              </tr>
              <tr>
                <th>Budget Code</th>
                <td>
                  <input
                    type="text"
                    name="budgetCode"
                    value={formData.budgetCode}
                    onChange={handleInputChange}
                    placeholder="Enter budget code (if applicable)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Approval Section */}
        <div className="form-section">
          <h2>Approval Section</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Approver's Name</th>
                <td>
                  <input
                    type="text"
                    name="approverName"
                    value={formData.approverName}
                    onChange={handleInputChange}
                    placeholder="Enter approver's name"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>Decision</th>
                <td>
                  <div className="decision-options">
                    <label className="decision-checkbox">
                      <input
                        type="radio"
                        name="decision"
                        checked={formData.decision === 'Approve'}
                        onChange={() => handleDecision('Approve')}
                      />
                      <span>Approve</span>
                    </label>
                    <label className="decision-checkbox">
                      <input
                        type="radio"
                        name="decision"
                        checked={formData.decision === 'Disapprove'}
                        onChange={() => handleDecision('Disapprove')}
                      />
                      <span>Disapprove</span>
                    </label>
                    <label className="decision-checkbox">
                      <input
                        type="radio"
                        name="decision"
                        checked={formData.decision === 'Hold'}
                        onChange={() => handleDecision('Hold')}
                      />
                      <span>Hold</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <th>Remarks/Conditions</th>
                <td>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="e.g., Limit to 1 ream due to stock shortage"
                    rows="3"
                  />
                </td>
              </tr>
              <tr>
                <th>Signature/Date</th>
                <td>
                  <input
                    type="text"
                    name="signatureDate"
                    value={formData.signatureDate}
                    placeholder="Auto-generated"
                    readOnly
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Workflow Notes */}
        <div className="workflow-notes">
          <h2>Workflow Notes</h2>
          <ul>
            <li>Once approved, the system will deduct from inventory and notify the requester.</li>
            <li>If disapproved, the approver's remarks will be visible to the requester.</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="approve-btn" 
            onClick={() => {
              setFormData({...formData, decision: 'Approve', signatureDate: new Date().toLocaleDateString()});
              handleSubmit();
              alert('Request approved!');
            }}
          >
            Approve
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;
