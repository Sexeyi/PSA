import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
          window.location.reload();
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile' });
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
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'superadmin':
        return <span className="badge badge-approved">Super Admin</span>;
      case 'admin':
        return <span className="badge badge-approved">Admin</span>;
      case 'approver':
        return <span className="badge badge-pending">Approver</span>;
      case 'employee':
        return <span className="badge badge-issued">Employee</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  const getDepartmentColor = (department) => {
    const deptLower = department?.toLowerCase();
    if (deptLower?.includes('finance')) return 'bg-blue-100 text-blue-800';
    if (deptLower?.includes('statistical')) return 'bg-green-100 text-green-800';
    if (deptLower?.includes('civil')) return 'bg-purple-100 text-purple-800';
    if (deptLower?.includes('national')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="gradient-text">My Profile</h1>
          <p className="text-gray-600 mt-2">
            View and manage your personal information
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {message.text}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="card overflow-hidden">
            {/* Profile Header */}
            <div className="bg-linear-to-r from-[#023e8a] to-[#023e8a]/80 px-6 py-8 text-white">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {formData.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{formData.fullName}</h2>
                  <p className="text-white/80 mt-1">{formData.email}</p>
                  <div className="mt-2">
                    {getRoleBadge(formData.role)}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              {!isEditing && !isChangingPassword ? (
                // View Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Full Name</label>
                      <p className="text-gray-900 mt-1 font-medium">{formData.fullName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Email Address</label>
                      <p className="text-gray-900 mt-1">{formData.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Employee ID</label>
                      <p className="text-gray-900 mt-1 font-mono">{formData.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Role</label>
                      <p className="mt-1">{getRoleBadge(formData.role)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Department</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(formData.department)}`}>
                          {formData.department || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Account Status</label>
                      <p className="mt-1">
                        <span className="badge badge-approved">Active</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="input"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="input"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="input"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                          <span className="spinner-sm"></span>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        disabled
                        className="input bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Employee ID cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="">Select Department</option>
                        <option value="Finance and Admin Unit">Finance and Admin Unit</option>
                        <option value="Statistical Unit">Statistical Unit</option>
                        <option value="Civil Registration Unit">Civil Registration Unit</option>
                        <option value="National ID unit">National ID unit</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                          <span className="spinner-sm"></span>
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

          {/* Account Info Card */}
          <div className="card mt-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              <p className="text-sm text-gray-500 mt-0.5">Additional account details</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Account Created</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;