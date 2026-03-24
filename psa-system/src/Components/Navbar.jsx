import React, { useState, useEffect, useRef } from 'react';

const Navbar = ({ user, onLogout, onViewChange, menuItems }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const menuRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleProfileClick = () => {
        onViewChange('Profile');
        setShowUserMenu(false);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left side - Page Title */}
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500 hidden md:block">
                            {formatDate(currentDateTime)} | {formatTime(currentDateTime)}
                        </div>
                    </div>

                    {/* Right side - User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* User Dropdown */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#023e8a] to-[#023e8a]/80 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm font-semibold">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-700">
                                        {user?.fullName?.split(' ')[0] || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {user?.role || 'Employee'}
                                    </p>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-slide-up">
                                    <div className="p-4 border-b border-gray-200">
                                        <p className="font-semibold text-gray-900">{user?.fullName}</p>
                                        <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                                        <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
                                    </div>
                                    <div className="py-2">
                                        <button
                                            onClick={handleProfileClick}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            My Profile
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-200 py-2">
                                        <button
                                            onClick={onLogout}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;