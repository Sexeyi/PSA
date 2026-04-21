import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

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
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Helper function to get user ID from various possible structures - memoized
  const getUserId = useCallback((userData) => {
    if (!userData) return null;
    return userData._id ||
      userData.id ||
      userData.userId ||
      (userData.data && userData.data._id) ||
      (userData.user && userData.user._id) ||
      null;
  }, []);

  // Helper function to get user name - memoized
  const getUserName = useCallback((userData) => {
    if (!userData) return '';
    return userData.fullName ||
      userData.name ||
      (userData.data && userData.data.fullName) ||
      (userData.user && userData.user.fullName) ||
      '';
  }, []);

  // Helper function to get user email - memoized
  const getUserEmail = useCallback((userData) => {
    if (!userData) return '';
    return userData.email ||
      (userData.data && userData.data.email) ||
      (userData.user && userData.user.email) ||
      '';
  }, []);

  // Helper function to get user department - memoized
  const getUserDepartment = useCallback((userData) => {
    if (!userData) return '';
    return userData.department ||
      (userData.data && userData.data.department) ||
      (userData.user && userData.user.department) ||
      '';
  }, []);

  // Helper function to get user role - memoized
  const getUserRole = useCallback((userData) => {
    if (!userData) return '';
    return userData.role ||
      (userData.data && userData.data.role) ||
      (userData.user && userData.user.role) ||
      '';
  }, []);

  // Get current user - memoized to prevent recreation
  const currentUser = useMemo(() => {
    try {
      // First try the prop
      if (user) {
        const userId = getUserId(user);
        if (userId) {
          return {
            id: userId,
            fullName: getUserName(user),
            email: getUserEmail(user),
            department: getUserDepartment(user),
            role: getUserRole(user),
            profilePicture: user.profilePicture || (user.data && user.data.profilePicture) || null,
            rawData: user
          };
        }
      }

      // Then try localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const userId = getUserId(parsedUser);
        if (userId) {
          return {
            id: userId,
            fullName: getUserName(parsedUser),
            email: getUserEmail(parsedUser),
            department: getUserDepartment(parsedUser),
            role: getUserRole(parsedUser),
            profilePicture: parsedUser.profilePicture || (parsedUser.data && parsedUser.data.profilePicture) || null,
            rawData: parsedUser
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }, [user, getUserId, getUserName, getUserEmail, getUserDepartment, getUserRole]);

  // Initialize form data only once when currentUser is available
  useEffect(() => {
    if (currentUser && !initialized) {
      console.log('Initializing form data for user:', currentUser);
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
        employeeId: currentUser.employeeId || currentUser.id?.slice(-6) || '',
        role: currentUser.role || ''
      });

      // Load profile picture if exists
      if (currentUser.profilePicture) {
        const pictureUrl = currentUser.profilePicture.startsWith('http')
          ? currentUser.profilePicture
          : `${API_BASE_URL}${currentUser.profilePicture}`;
        setProfilePictureUrl(pictureUrl);
      }

      setInitialized(true);
    }
  }, [currentUser, API_BASE_URL, initialized]);

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

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentUser || !currentUser.id) {
      setMessage({ type: 'error', text: 'Please refresh the page and try again' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a valid image file (JPEG, PNG, or GIF)' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/profile-picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const pictureUrl = `${API_BASE_URL}${data.profilePicture}?t=${Date.now()}`;
        setProfilePictureUrl(pictureUrl);
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });

        // IMPORTANT: Update the user in localStorage with the new profile picture
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.profilePicture = data.profilePicture;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('Updated user in localStorage with profile picture:', parsedUser);
        }

        // Also update the user state in the parent component
        if (onUpdate) {
          const updatedUser = { ...currentUser.rawData, profilePicture: data.profilePicture };
          onUpdate(updatedUser);
        }

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        setMessage({ type: 'error', text: error.message || 'Failed to upload profile picture' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    if (!currentUser || !currentUser.id) {
      setMessage({ type: 'error', text: 'Please refresh the page and try again' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProfilePictureUrl('');
        setMessage({ type: 'success', text: 'Profile picture removed successfully!' });

        // Update user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.profilePicture = null;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }

        if (onUpdate) onUpdate({ ...currentUser.rawData, profilePicture: null });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json().catch(() => ({ message: 'Remove failed' }));
        setMessage({ type: 'error', text: error.message || 'Failed to remove profile picture' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!currentUser || !currentUser.id) {
      setMessage({ type: 'error', text: 'Please refresh the page and try again' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
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

        // Preserve profile picture and update localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const mergedUser = { ...parsedUser, ...updatedUser };
          if (currentUser.profilePicture) {
            mergedUser.profilePicture = currentUser.profilePicture;
          }
          localStorage.setItem('user', JSON.stringify(mergedUser));
        }

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

    if (!currentUser || !currentUser.id) {
      setMessage({ type: 'error', text: 'Please refresh the page and try again' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

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
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/change-password`, {
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

  // Show loading while initializing
  if (!initialized && currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no user found, show message
  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-wrapper">
          <div className="profile-error-content">
            <div className="error-icon">🔍</div>
            <h2>Unable to Load Profile</h2>
            <p>We couldn't find your profile information. Please try logging out and logging back in.</p>
            <div className="button-group" style={{ justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  navigate('/login');
                }}
                className="btn btn-primary"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Refresh Page
              </button>
            </div>
          </div>
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
          {/* Profile Header with Avatar */}
          <div className="profile-card-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={formData.fullName || 'Profile'}
                    className="profile-avatar-image"
                    onError={() => setProfilePictureUrl('')}
                  />
                ) : (
                  <div className="profile-avatar">
                    <span>{formData.fullName?.charAt(0) || formData.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                  </div>
                )}
                <div className="profile-avatar-actions">
                  <button
                    className="avatar-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    title="Upload profile picture"
                  >
                    +
                  </button>
                  {profilePictureUrl && (
                    <button
                      className="avatar-remove-btn"
                      onClick={handleRemoveProfilePicture}
                      disabled={uploadingPicture}
                      title="Remove profile picture"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleProfilePictureUpload}
                  style={{ display: 'none' }}
                />
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
                  <button onClick={() => setIsChangingPassword(true)} className="btn btn-secondary">
                    Change Password
                  </button>
                  <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : isChangingPassword ? (
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Current Password <span className="required">*</span></label>
                  <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password <span className="required">*</span></label>
                  <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password <span className="required">*</span></label>
                  <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="form-input" />
                </div>
                <div className="button-group">
                  <button type="button" onClick={() => setIsChangingPassword(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Changing...' : 'Change Password'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="info-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} className="form-select">
                      <option value="">Select Department</option>
                      <option value="Finance and Admin Unit">Finance and Admin Unit</option>
                      <option value="Statistical Unit">Statistical Unit</option>
                      <option value="Civil Registration Unit">Civil Registration Unit</option>
                      <option value="National ID unit">National ID unit</option>
                    </select>
                  </div>
                </div>
                <div className="button-group">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
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