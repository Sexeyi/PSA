import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    name: 'PSA',
    email: 'psa.0912@example.com',
    role: 'Administrator',
    department: 'Admin and Finance',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({ ...user });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
    setUser(editForm);
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
    alert('Password changed successfully!');
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name.charAt(0)}
          </div>
          <h2>{user.name}</h2>
          <span className="profile-role">{user.role}</span>
        </div>
        <div className="profile-details">
          <div className="profile-detail">
            <label>Email:</label>
            <span>{user.email}</span>
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
                <label>Name:</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department:</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  required
                />
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
