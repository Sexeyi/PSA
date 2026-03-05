import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';

const Navbar = ({ user, onLogout, onViewChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleProfile = () => {
        setShowDropdown(false);
        if (onViewChange) onViewChange('Profile');
    };

    const handleLogout = () => {
        setShowDropdown(false);
        if (onLogout) onLogout();
    };

    // Get user initials
    const getInitials = () => {
        if (!user || !user.fullName) return 'U';
        const names = user.fullName.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return names[0][0].toUpperCase();
    };

    if (!user) return null;

    return (
        <div className="navbar">
            <div className="navbar-left">
                <div className="logo">PSA</div>
                <div className="nav-title">Requisition System</div>
            </div>

            <div className="navbar-right" ref={dropdownRef}>
                <div className="profile-section" onClick={toggleDropdown}>
                    <span className="user-name">{user.fullName}</span>
                    <div className="profile-icon">
                        {getInitials()}
                    </div>
                </div>

                {showDropdown && (
                    <div className="dropdown">
                        <div className="dropdown-item" onClick={handleProfile}>
                            Profile
                        </div>
                        <div className="dropdown-item logout" onClick={handleLogout}>
                            Logout
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;