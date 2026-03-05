import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data from localStorage (from login)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setEditForm(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const openEditModal = () => {
    setEditForm({ ...user });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    // Update user in state and localStorage
    setUser(editForm);
    localStorage.setItem('user', JSON.stringify(editForm));

    alert('Profile updated successfully!');
    setIsEditModalOpen(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    // Here you would call your API to change password
    alert('Password changed successfully!');
    setIsPasswordModalOpen(false);
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!user) {
    return null;
  }

  const departments = [
    'Finance and Admin Unit',
    'Statistical Unit',
    'Civil Registration Unit',
    'National ID unit',
  ];

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2>{user.fullName}</h2>
          <span className="profile-role">{user.role}</span>
        </div>
        <div className="profile-details">
          <div className="profile-detail">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>
          <div className="profile-detail">
            <label>Employee ID:</label>
            <span>{user.employeeId}</span>
          </div>
          <div className="profile-detail">
            <label>Department:</label>
            <span>{user.department}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={openEditModal}>Edit Profile</button>
          <button className="change-password-btn" onClick={openPasswordModal}>Change Password</button>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={closeEditModal}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={editForm.fullName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  disabled
                  className="disabled-input"
                />
                <small className="field-note">Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Employee ID:</label>
                <input
                  type="text"
                  value={editForm.employeeId || ''}
                  disabled
                  className="disabled-input"
                />
                <small className="field-note">Employee ID cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Department:</label>
                <select
                  value={editForm.department || ''}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Role:</label>
                <input
                  type="text"
                  value={editForm.role || ''}
                  disabled
                  className="disabled-input"
                />
                <small className="field-note">Role cannot be changed</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={closePasswordModal}>&times;</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password:</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password:</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closePasswordModal}>Cancel</button>
                <button type="submit" className="save-btn">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;