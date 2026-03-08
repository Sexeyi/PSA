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
        email: '',
        role: 'employee',
        department: '',
        employeeId: '',
        status: 'active'
    });

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            // Handle both array response and paginated response
            setUsers(data.data || data);
            setError('');
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users. Please try again.');
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
            email: '',
            role: 'employee',
            department: '',
            employeeId: '',
            status: 'active'
        });
        setShowModal(true);
    };

    // Open modal for editing user
    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role || 'employee',
            department: user.department || '',
            employeeId: user.employeeId || '',
            status: user.status || 'active'
        });
        setShowModal(true);
    };

    // Save user (add or update)
    const handleSaveUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = editingUser
                ? `http://localhost:5000/api/users/${editingUser.id}`
                : 'http://localhost:5000/api/users';

            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to save user');
            }

            // Refresh user list
            await fetchUsers();
            setShowModal(false);
            setError('');
        } catch (error) {
            console.error('Error saving user:', error);
            setError('Failed to save user. Please try again.');
        }
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            // Refresh user list
            await fetchUsers();
            setError('');
        } catch (error) {
            console.error('Error deleting user:', error);
            setError('Failed to delete user. Please try again.');
        }
    };

    // Update user status
    const handleStatusChange = async (userId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Refresh user list
            await fetchUsers();
            setError('');
        } catch (error) {
            console.error('Error updating status:', error);
            setError('Failed to update status. Please try again.');
        }
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    return (
        <div className="user-management">
            <div className="header">
                <h1>User Management</h1>
                <button className="btn-primary" onClick={handleAddUser}>
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
                            <th>Role</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="no-data">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.employeeId || 'N/A'}</td>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.department}</td>
                                    <td>
                                        <select
                                            value={user.status || 'active'}
                                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                            className={`status-select status-${user.status || 'active'}`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </td>
                                    <td className="actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEditUser(user)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteUser(user.id)}
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
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    placeholder="Enter employee ID"
                                />
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
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        <option value="superadmin">Super Admin</option>
                                        <option value="admin">Admin</option>
                                        <option value="employee">Employee</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Department *</label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Finance and Admin Unit">Finance and Admin Unit</option>
                                        <option value="Statistical Unit">Statistical Unit</option>
                                        <option value="Registry Unit">Registry Unit</option>
                                        <option value="National ID Unit">National ID Unit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            {!editingUser && (
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input
                                        type="password"
                                        value="Auto-generated"
                                        disabled
                                    />
                                    <small>Password will be auto-generated.</small>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveUser}>
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;