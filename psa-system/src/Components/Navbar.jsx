import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const getInitials = () => {
        if (!user?.name) return 'U';
        return user.name.charAt(0).toUpperCase();
    };

    const getFirstName = () => {
        if (!user?.name) return 'User';
        return user.name.split(' ')[0];
    };

    const formatDate = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <div className="navbar-datetime">
                        <span>{formatDate()}</span>
                        <span className="navbar-time">{formatTime()}</span>
                    </div>
                </div>

                <div className="navbar-right" ref={menuRef}>
                    <button
                        className={`navbar-user-btn ${isOpen ? 'active' : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="navbar-avatar">
                            {getInitials()}
                        </div>
                        <span className="navbar-username">{getFirstName()}</span>
                        <svg
                            className={`navbar-chevron ${isOpen ? 'rotated' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isOpen && (
                        <div className="navbar-dropdown">
                            <div className="navbar-dropdown-header">
                                <p className="navbar-dropdown-name">{user?.name || 'User'}</p>
                                <p className="navbar-dropdown-email">{user?.email || 'user@example.com'}</p>
                                {user?.role && (
                                    <span className="navbar-dropdown-role">{user.role}</span>
                                )}
                            </div>
                            <button
                                className="navbar-logout-btn"
                                onClick={onLogout}
                            >
                                <svg className="navbar-logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;