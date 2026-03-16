import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        email: '',
        department: '',
        role: 'employee', // Changed to lowercase
        password: ''
    });

    // Department options based on your schema
    const departmentOptions = [
        'Finance and Admin Unit',
        'Statistical Unit',
        'Civil Registration Unit',
        'National ID unit'
    ];

    // Role options - using lowercase values but displaying with proper capitalization
    const roleOptions = [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'approver', label: 'Approver' },
        { value: 'employee', label: 'Employee' }
    ];

    // Fetch all users from MongoDB
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching users from MongoDB...');
            const response = await fetch('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch users');
            }

            const result = await response.json();
            console.log('API Response:', result);

            // Handle the response structure
            let usersData = [];
            if (result.data && Array.isArray(result.data)) {
                usersData = result.data;
            } else if (Array.isArray(result)) {
                usersData = result;
            } else if (result.users && Array.isArray(result.users)) {
                usersData = result.users;
            }

            setUsers(usersData);
            setError('');
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message || 'Failed to load users. Please try again.');

            if (error.message.includes('token') || error.message.includes('authentication')) {
                localStorage.clear();
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Open modal for adding new user
    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({
            fullName: '',
            employeeId: '',
            email: '',
            department: '',
            role: 'employee', // Changed to lowercase
            password: ''
        });
        setShowModal(true);
    };

    // Open modal for editing user
    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName || '',
            employeeId: user.employeeId || '',
            email: user.email || '',
            department: user.department || '',
            role: user.role || 'employee', // User role should already be lowercase from backend
            password: '' // Don't populate password for security
        });
        setShowModal(true);
    };

    // Generate a random password
    const generatePassword = () => {
        const length = 10;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    };

    // Validate form data
    const validateForm = () => {
        if (!formData.fullName.trim()) {
            setError('Full name is required');
            return false;
        }
        if (!formData.employeeId.trim()) {
            setError('Employee ID is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.department) {
            setError('Department is required');
            return false;
        }
        if (!formData.role) {
            setError('Role is required');
            return false;
        }
        if (!editingUser && !formData.password) {
            setError('Password is required for new users');
            return false;
        }
        return true;
    };

    // Save user (add or update) to MongoDB
    const handleSaveUser = async () => {
        try {
            // Validate form
            if (!validateForm()) {
                return;
            }

            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Prepare user data - ensure role is lowercase
            const userData = {
                fullName: formData.fullName.trim(),
                employeeId: formData.employeeId.trim(),
                email: formData.email.trim().toLowerCase(),
                department: formData.department,
                role: formData.role.toLowerCase(), // Ensure role is lowercase
            };

            // Add password only for new users or if changed
            if (!editingUser) {
                userData.password = formData.password || generatePassword();
            } else if (formData.password) {
                userData.password = formData.password;
            }

            // Determine the correct endpoint
            let url;
            if (editingUser) {
                // For updates, use PUT /api/users/:id
                url = `http://localhost:5000/api/users/${editingUser._id}`;
            } else {
                // For new users, use POST /api/users (not /register, as that's for public registration)
                url = 'http://localhost:5000/api/users';
            }

            const method = editingUser ? 'PUT' : 'POST';

            console.log(`${editingUser ? 'Updating' : 'Creating'} user:`, {
                ...userData,
                password: userData.password ? '[HIDDEN]' : undefined
            });

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Handle specific error for SuperAdmin constraint
                if (responseData.message && responseData.message.includes('only be one SuperAdmin')) {
                    throw new Error('There can only be one SuperAdmin in the system');
                }
                throw new Error(responseData.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
            }

            console.log('User saved successfully:', responseData);

            // Refresh user list
            await fetchUsers();
            setShowModal(false);
            setError('');

            // Show success message
            const message = editingUser
                ? 'User updated successfully!'
                : `User created successfully! ${!formData.password ? 'Password has been auto-generated.' : ''}`;
            alert(message);

        } catch (error) {
            console.error('Error saving user:', error);
            setError(error.message || `Failed to ${editingUser ? 'update' : 'create'} user. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Delete user from MongoDB
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Deleting user:', userId);

            const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to delete user');
            }

            console.log('User deleted successfully');

            // Refresh user list
            await fetchUsers();
            setError('');

            alert('User deleted successfully!');

        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.message || 'Failed to delete user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    // Helper function to get role display name
    const getRoleDisplayName = (role) => {
        const roleMap = {
            'superadmin': 'Super Admin',
            'admin': 'Admin',
            'approver': 'Approver',
            'employee': 'Employee'
        };
        return roleMap[role] || role;
    };

    // Helper function to get role badge class
    const getRoleBadgeClass = (role) => {
        return `role-badge role-${role}`;
    };

    if (loading && users.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading users from MongoDB...</p>
            </div>
        );
    }

    return (
        <div className="user-management">
            <div className="header">
                <h1>User Management</h1>
                <button className="btn-primary" onClick={handleAddUser} disabled={loading}>
                    + Add New User
                </button>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    No users found in MongoDB. Click "Add New User" to create one.
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.employeeId}</td>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>{user.department}</td>
                                    <td>
                                        <span className={getRoleBadgeClass(user.role)}>
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>{formatDate(user.updatedAt)}</td>
                                    <td className="actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEditUser(user)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteUser(user._id)}
                                            disabled={loading || user.role === 'superadmin'}
                                            title={user.role === 'superadmin' ? 'Cannot delete SuperAdmin' : ''}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button
                                className="close-btn"
                                onClick={() => !loading && setShowModal(false)}
                                disabled={loading}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Employee ID *</label>
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    placeholder="Enter employee ID"
                                    required
                                    disabled={loading || editingUser} // Disable editing for existing users
                                />
                                {editingUser && (
                                    <small className="help-text">Employee ID cannot be changed</small>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Department *</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Select Department</option>
                                    {departmentOptions.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading || (editingUser && editingUser.role === 'superadmin')}
                                >
                                    {roleOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {editingUser && editingUser.role === 'superadmin' && (
                                    <small className="help-text">SuperAdmin role cannot be changed</small>
                                )}
                            </div>

                            <div className="form-group">
                                <label>
                                    {editingUser ? 'New Password (leave empty to keep current)' : 'Password *'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder={editingUser ? "Enter new password" : "Enter password"}
                                    required={!editingUser}
                                    disabled={loading}
                                />
                                {!editingUser && (
                                    <small className="help-text">
                                        Password will be hashed before saving
                                    </small>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSaveUser}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;