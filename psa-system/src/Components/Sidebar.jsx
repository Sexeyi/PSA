import React from 'react';
import Logout from './Logout';

const Sidebar = ({ onViewChange, currentView, onLogout }) => {
  const handleMenuClick = (view) => {
    onViewChange(view);
  };

  return (
    <div className="sidebar">
      <h2>PSA</h2>
      <ul>
        <li
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => handleMenuClick('dashboard')}
        >
          Dashboard
        </li>
        <li
          className={currentView === 'supplies' ? 'active' : ''}
          onClick={() => handleMenuClick('supplies')}
        >
          Supplies
        </li>
        <li
          className={currentView === 'request' ? 'active' : ''}
          onClick={() => handleMenuClick('request')}
        >
          Request
        </li>
        <li
          className={currentView === 'history' ? 'active' : ''}
          onClick={() => handleMenuClick('history')}
        >
          History
        </li>
        <li
          className={currentView === 'settings' ? 'active' : ''}
          onClick={() => handleMenuClick('settings')}
        >
          Profile
        </li>
        <li className="logout-btn" onClick={onLogout}>Logout</li>
      </ul>
    </div>
  );
};

export default Sidebar;
