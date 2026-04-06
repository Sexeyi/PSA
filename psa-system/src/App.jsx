import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ListOfSupplies from './pages/superadmin/ListOfSupplies';
import ApproveRequests from './pages/admin/ApproveRequests';
import RequestApproval from './pages/superadmin/RequestApproval';
import Profile from './Components/Profile';
import Login from './pages/auth/Login';
import SignIn from './pages/auth/SignIn';
import UserManagement from './pages/superadmin/UserManagement';
import MyRequests from './pages/employee/MyRequests';
import InventoryTable from './pages/admin/InventoryTable';

// Sidebar menu configuration based on role
const sidebarMenus = {
  superadmin: ['Dashboard', 'User Management', 'Supplies', 'Request Approval', 'Profile'],
  admin: ['Dashboard', 'Requisitions', 'Inventory', 'Profile'],
  employee: ['Dashboard', 'My Requests', 'Profile']
};

// MainContent component
function MainContent({
  currentView,
  sidebarExpanded,
  toggleSidebar,
  handleLogout,
  supplies,
  setSupplies,
  setCurrentView,
  user,
  menuItems,
  setUser
}) {
  const renderContent = () => {
    const userRole = user?.role?.toLowerCase() || 'employee';

    switch (currentView) {
      case 'Dashboard':
        if (userRole === 'superadmin') {
          return <SuperAdminDashboard user={user} />;
        } else if (userRole === 'admin') {
          return <AdminDashboard user={user} />;
        } else {
          return <EmployeeDashboard user={user} />;
        }

      case 'User Management':
        return userRole === 'superadmin' ? <UserManagement /> : <Navigate to="/dashboard" />;

      case 'Supplies':
        if (userRole === 'superadmin') {
          return <ListOfSupplies />;
        } else if (userRole === 'admin') {
          return <InventoryTable />;
        }
        return <Navigate to="/dashboard" />;

      case 'Request Approval':
        return userRole === 'superadmin' ? <RequestApproval /> : <Navigate to="/dashboard" />;

      case 'Requisitions':
        return userRole === 'admin' ? <ApproveRequests user={user} /> : <Navigate to="/dashboard" />;

      case 'My Requests':
        return userRole === 'employee' ? <MyRequests user={user} /> : <Navigate to="/dashboard" />;

      case 'Inventory':
        return userRole === 'admin' ? <InventoryTable /> : <Navigate to="/dashboard" />;

      case 'Profile':
        return <Profile user={user} onUpdate={setUser} />;

      default:
        if (userRole === 'superadmin') {
          return <SuperAdminDashboard user={user} />;
        } else if (userRole === 'admin') {
          return <AdminDashboard user={user} />;
        } else {
          return <EmployeeDashboard user={user} />;
        }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        menuItems={menuItems}
        onViewChange={setCurrentView}
        currentView={currentView}
        collapsed={!sidebarExpanded}
        onToggleCollapse={toggleSidebar}
        userRole={user?.role}
        user={user}
        onLogout={handleLogout}
      />
      <main style={{
        flex: 1,
        marginLeft: sidebarExpanded ? '260px' : '72px',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  });

  // User state
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user:', e);
        return null;
      }
    }
    return null;
  });

  // UI state
  const [currentView, setCurrentView] = useState('Dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Data state
  const [supplies, setSupplies] = useState([]);
  const [users, setUsers] = useState([]);
  const [requisitions, setRequisitions] = useState([]);

  // Get menu items based on user role
  const menuItems = useMemo(() => {
    if (user?.role) {
      const role = user.role.toLowerCase();
      return sidebarMenus[role] || sidebarMenus.employee;
    }
    return [];
  }, [user?.role]);

  // Validate current view is in menu items
  useEffect(() => {
    if (menuItems.length > 0 && !menuItems.includes(currentView)) {
      setCurrentView(menuItems[0]);
    }
  }, [menuItems, currentView]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    setCurrentView('Dashboard');
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('Dashboard');
    setSupplies([]);
    setUsers([]);
    setRequisitions([]);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignIn />} />
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <MainContent
                currentView={currentView}
                sidebarExpanded={sidebarExpanded}
                toggleSidebar={toggleSidebar}
                handleLogout={handleLogout}
                supplies={supplies}
                setSupplies={setSupplies}
                setCurrentView={setCurrentView}
                user={user}
                menuItems={menuItems}
                setUser={setUser}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;