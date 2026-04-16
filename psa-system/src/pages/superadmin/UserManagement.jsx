import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [filterRole, setFilterRole] = useState('all');
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        email: '',
        department: '',
        role: 'employee',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});

    const departmentOptions = [
        'Finance and Admin Unit',
        'Statistical Unit',
        'Civil Registration Unit',
        'National ID unit'
    ];

    const roleOptions = [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'employee', label: 'Employee' }
    ];

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_BASE_URL}/api/users`, {
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
            setError(error.message || 'Failed to load users');

            if (error.message.includes('token') || error.message.includes('authentication')) {
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '/login';
                }, 2000);
            }
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    }, [formErrors]);

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        } else if (formData.fullName.length < 2) {
            errors.fullName = 'Full name must be at least 2 characters';
        }

        if (!formData.employeeId.trim()) {
            errors.employeeId = 'Employee ID is required';
        } else if (!/^[A-Z0-9-]+$/i.test(formData.employeeId)) {
            errors.employeeId = 'Employee ID should contain only letters, numbers, and hyphens';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.department) {
            errors.department = 'Department is required';
        }

        if (!formData.role) {
            errors.role = 'Role is required';
        }

        if (!editingUser && !formData.password) {
            errors.password = 'Password is required for new users';
        } else if (!editingUser && formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        } else if (editingUser && formData.password && formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, editingUser]);

    const generatePassword = useCallback(() => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        setFormData(prev => ({ ...prev, password }));
    }, []);

    const handleSaveUser = useCallback(async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const userData = {
                fullName: formData.fullName.trim(),
                employeeId: formData.employeeId.trim(),
                email: formData.email.trim().toLowerCase(),
                department: formData.department,
                role: formData.role.toLowerCase(),
            };

            if (!editingUser) {
                userData.password = formData.password || generatePassword();
            } else if (formData.password) {
                userData.password = formData.password;
            }

            const url = editingUser
                ? `${API_BASE_URL}/api/users/${editingUser._id}`
                : `${API_BASE_URL}/api/users`;
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (responseData.message && responseData.message.includes('only be one SuperAdmin')) {
                    throw new Error('There can only be one SuperAdmin in the system');
                }
                throw new Error(responseData.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
            }

            await fetchUsers();
            setShowModal(false);
            setSuccess(editingUser ? 'User updated successfully!' : `User created successfully!`);

            setTimeout(() => setSuccess(''), 3000);

            if (!editingUser && !formData.password) {
                alert(`User created! Temporary password: ${generatePassword()}`);
            }

        } catch (error) {
            console.error('Error saving user:', error);
            setError(error.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
        } finally {
            setLoading(false);
        }
    }, [formData, editingUser, validateForm, fetchUsers, API_BASE_URL, generatePassword]);

    const handleDeleteUser = useCallback(async (userId, userRole) => {
        if (userRole === 'superadmin') {
            setError('Cannot delete SuperAdmin user');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
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

            await fetchUsers();
            setSuccess('User deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    }, [fetchUsers, API_BASE_URL]);

    const handleAddUser = useCallback(() => {
        setEditingUser(null);
        setFormData({
            fullName: '',
            employeeId: '',
            email: '',
            department: '',
            role: 'employee',
            password: ''
        });
        setFormErrors({});
        setShowModal(true);
    }, []);

    const handleEditUser = useCallback((user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName || '',
            employeeId: user.employeeId || '',
            email: user.email || '',
            department: user.department || '',
            role: user.role || 'employee',
            password: ''
        });
        setFormErrors({});
        setShowModal(true);
    }, []);

    const formatDate = useCallback((dateString) => {
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
    }, []);

    const getRoleBadge = useCallback((role) => {
        const roleMap = {
            superadmin: { label: 'Super Admin', class: 'badge-superadmin' },
            admin: { label: 'Admin', class: 'badge-admin' },
            employee: { label: 'Employee', class: 'badge-employee' }
        };
        const config = roleMap[role] || { label: role, class: 'badge-default' };
        return <span className={`role-badge ${config.class}`}>{config.label}</span>;
    }, []);

    const filteredUsers = useMemo(() => {
        let filtered = [...users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.fullName?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.employeeId?.toLowerCase().includes(term) ||
                user.department?.toLowerCase().includes(term)
            );
        }

        if (filterRole !== 'all') {
            filtered = filtered.filter(user => user.role === filterRole);
        }

        return filtered;
    }, [users, searchTerm, filterRole]);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    if (loading && users.length === 0) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading users...</p>
            </div>
        );
    }

    return (
        <div className="user-management-container">
            <div className="user-management-wrapper">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">User Management</h1>
                        <p className="page-subtitle">Manage system users, roles, and permissions</p>
                    </div>
                    <button className="btn-primary" onClick={handleAddUser} disabled={loading}>
                        <span className="btn-icon">+</span>
                        Add New User
                    </button>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-message">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span className="alert-icon">✓</span>
                        <span className="alert-message">{success}</span>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="filters-section">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name, email, employee ID, or department..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
                            onClick={() => { setFilterRole('all'); setCurrentPage(1); }}
                        >
                            All
                        </button>
                        {roleOptions.map(role => (
                            <button
                                key={role.value}
                                className={`filter-btn ${filterRole === role.value ? 'active' : ''}`}
                                onClick={() => { setFilterRole(role.value); setCurrentPage(1); }}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="table-card">
                    <div className="table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            <div className="empty-content">
                                                <span className="empty-icon">👥</span>
                                                <p className="empty-title">No users found</p>
                                                <p className="empty-description">
                                                    {searchTerm ? 'Try adjusting your search' : 'Click "Add New User" to create one'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map(user => (
                                        <tr key={user._id} className="user-row">
                                            <td className="employee-id">{user.employeeId}</td>
                                            <td className="full-name">{user.fullName}</td>
                                            <td className="email">{user.email}</td>
                                            <td className="department">{user.department}</td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td className="date">{formatDate(user.createdAt)}</td>
                                            <td className="actions">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEditUser(user)}
                                                    disabled={loading}
                                                    title="Edit user"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteUser(user._id, user.role)}
                                                    disabled={loading || user.role === 'superadmin'}
                                                    title={user.role === 'superadmin' ? 'Cannot delete SuperAdmin' : 'Delete user'}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <div className="pagination-info">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                            </div>
                            <div className="pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    Previous
                                </button>
                                <span className="pagination-page">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add/Edit User Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
                        <div className="modal-container" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h2>
                                <button
                                    className="modal-close"
                                    onClick={() => !loading && setShowModal(false)}
                                    disabled={loading}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">
                                        Employee ID <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="employeeId"
                                        value={formData.employeeId}
                                        onChange={handleInputChange}
                                        placeholder="e.g., PSA-2024-001"
                                        className={`form-input ${formErrors.employeeId ? 'error' : ''}`}
                                        disabled={loading || editingUser}
                                    />
                                    {editingUser && (
                                        <p className="form-hint">Employee ID cannot be changed</p>
                                    )}
                                    {formErrors.employeeId && (
                                        <p className="form-error">{formErrors.employeeId}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Full Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        className={`form-input ${formErrors.fullName ? 'error' : ''}`}
                                        disabled={loading}
                                    />
                                    {formErrors.fullName && (
                                        <p className="form-error">{formErrors.fullName}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Email <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="user@psa.gov.ph"
                                        className={`form-input ${formErrors.email ? 'error' : ''}`}
                                        disabled={loading}
                                    />
                                    {formErrors.email && (
                                        <p className="form-error">{formErrors.email}</p>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Department <span className="required">*</span>
                                        </label>
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className={`form-select ${formErrors.department ? 'error' : ''}`}
                                            disabled={loading}
                                        >
                                            <option value="">Select Department</option>
                                            {departmentOptions.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        {formErrors.department && (
                                            <p className="form-error">{formErrors.department}</p>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Role <span className="required">*</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className={`form-select ${formErrors.role ? 'error' : ''}`}
                                            disabled={loading || (editingUser && editingUser.role === 'superadmin')}
                                        >
                                            {roleOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {editingUser && editingUser.role === 'superadmin' && (
                                            <p className="form-hint">SuperAdmin role cannot be changed</p>
                                        )}
                                        {formErrors.role && (
                                            <p className="form-error">{formErrors.role}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        {editingUser ? 'New Password' : 'Password'} {!editingUser && <span className="required">*</span>}
                                    </label>
                                    <div className="password-wrapper">
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder={editingUser ? "Leave empty to keep current" : "Enter password"}
                                            className={`form-input ${formErrors.password ? 'error' : ''}`}
                                            disabled={loading}
                                        />
                                        {!editingUser && (
                                            <button
                                                type="button"
                                                className="generate-password"
                                                onClick={generatePassword}
                                                disabled={loading}
                                            >
                                                Generate
                                            </button>
                                        )}
                                    </div>
                                    {formErrors.password && (
                                        <p className="form-error">{formErrors.password}</p>
                                    )}
                                    {!editingUser && (
                                        <p className="form-hint">Minimum 6 characters. Password will be hashed before saving.</p>
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
                                    {loading ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            {editingUser ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        editingUser ? 'Update User' : 'Create User'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;