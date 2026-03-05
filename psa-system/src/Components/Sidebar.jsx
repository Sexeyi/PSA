import React from 'react';
import Logo from '../assets/psa.png';
import './Sidebar.css';

const Sidebar = ({
  onViewChange,
  currentView,
  menuItems = [],
  userRole
}) => {
  const handleMenuClick = (view) => {
    onViewChange(view);
  };

  // Icon mapping for menu items
  const getIcon = (item) => {
    const icons = {
      'Dashboard': '📊',
      'System Settings': '⚙️',
      'Users': '👥',
      'Department Users': '👤',
      'Requisitions': '📝',
      'Supplies': '📦',
      'My Requests': '📋'
    };
    return icons[item] || '📌';
  };

  return (
    <div className="sidebar">
      <div className="psa-logo-container">
        <img src={Logo} alt="PSA Logo" className="psa-logo" />
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item}
            className={currentView === item ? 'active' : ''}
            onClick={() => handleMenuClick(item)}
          >
            <span className="menu-icon">{getIcon(item)}</span>
            <span className="menu-text">{item}</span>
          </li>
        ))}
      </ul>

      {userRole && (
        <div className="sidebar-footer">
          <span className="user-role">{userRole}</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;