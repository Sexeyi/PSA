import React from 'react';

const Logout = ({ onLogout }) => {
  return (
    <li className="logout-btn" onClick={onLogout}>
      Logout
    </li>
  );
};

export default Logout;
