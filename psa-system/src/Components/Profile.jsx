import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; // Import the CSS file

const Profile = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    employeeId: '',
    role: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        department: user.department || '',
        employeeId: user.employeeId || user._id?.slice(-6) || '',
        role: user.role || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          department: formData.department
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        if (onUpdate) onUpdate(updatedUser);
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user._id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'superadmin': return 'badge-superadmin';
      case 'admin': return 'badge-admin';
      case 'approver': return 'badge-approver';
      case 'employee': return 'badge-employee';
      default: return 'badge-default';
    }
  };

  const getRoleLabel = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'approver': return 'Approver';
      case 'employee': return 'Employee';
      default: return role || 'User';
    }
  };

  const getDepartmentClass = (department) => {
    const deptLower = department?.toLowerCase();
    if (deptLower?.includes('finance')) return 'dept-finance';
    if (deptLower?.includes('statistical')) return 'dept-statistical';
    if (deptLower?.includes('civil')) return 'dept-civil';
    if (deptLower?.includes('national')) return 'dept-national';
    return 'dept-default';
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner spinner-large"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">
            View and manage your personal information
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <div className="alert-content">
              {message.type === 'success' ? (
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="profile-card">
          {/* Profile Header */}
          <div className="profile-card-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <span>{formData.fullName?.charAt(0) || formData.email?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{formData.fullName || 'User'}</h2>
                <p className="profile-email">{formData.email}</p>
                <div>
                  <span className={`badge ${getRoleBadgeClass(formData.role)}`}>
                    {getRoleLabel(formData.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="profile-content">
            {!isEditing && !isChangingPassword ? (
              // View Mode
              <div>
                <div className="info-grid">
                  <div>
                    <label className="info-label">Full Name</label>
                    <p className="info-value-large">{formData.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="info-label">Email Address</label>
                    <p className="info-value">{formData.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="info-label">Employee ID</label>
                    <p className="info-value" style={{ fontFamily: 'monospace' }}>{formData.employeeId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="info-label">Role</label>
                    <div>
                      <span className={`badge ${getRoleBadgeClass(formData.role)}`}>
                        {getRoleLabel(formData.role)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="info-label">Department</label>
                    <div>
                      {formData.department ? (
                        <span className={`dept-badge ${getDepartmentClass(formData.department)}`}>
                          {formData.department}
                        </span>
                      ) : (
                        <span className="info-value">Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="info-label">Account Status</label>
                    <div>
                      <span className="status-badge">
                        <span className="status-dot"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="button-group">
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="btn btn-secondary"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : isChangingPassword ? (
              // Change Password Mode
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    Current Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="form-input"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    New Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="form-input"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Confirm New Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="form-input"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="button-group">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setMessage({ type: '', text: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit}>
                <div className="info-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      disabled
                      className="form-input"
                    />
                    <p className="form-hint">Employee ID cannot be changed</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Department</option>
                      <option value="Finance and Admin Unit">Finance and Admin Unit</option>
                      <option value="Statistical Unit">Statistical Unit</option>
                      <option value="Civil Registration Unit">Civil Registration Unit</option>
                      <option value="National ID unit">National ID unit</option>
                    </select>
                  </div>
                </div>

                <div className="button-group">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        fullName: user.fullName || '',
                        email: user.email || '',
                        department: user.department || '',
                        employeeId: user.employeeId || user._id?.slice(-6) || '',
                        role: user.role || ''
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;