import { useState, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './Components/Sidebar'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ListOfSupplies from './pages/superadmin/ListOfSupplies'
import ApproveRequests from './pages/admin/ApproveRequests'
import RequestApproval from './pages/superadmin/RequestApproval'
import Profile from './Components/Profile'
import Login from './pages/auth/Login'
import SignIn from './pages/auth/SignIn'
import UserManagement from './pages/superadmin/UserManagement'
import MyRequests from './pages/employee/MyRequests'
import InventoryTable from './pages/admin/InventoryTable'

// Sidebar menu configuration based on role
const sidebarMenus = {
  superadmin: ["Dashboard", "Supplies", "User Management", "Request Approval", "Profile"],
  admin: ["Dashboard", "Requisitions", "Supplies", "Inventory", "Profile"],
  approver: ["Dashboard", "Requisitions", "Profile"],
  employee: ["Dashboard", "MyRequests", "Profile"]
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
        } else if (userRole === 'admin' || userRole === 'approver') {
          return <AdminDashboard user={user} />;
        } else {
          return <EmployeeDashboard user={user} />;
        }

      case 'Supplies':
        return <InventoryTable />;

      case 'Request Approval':
        return userRole === 'superadmin' ? <RequestApproval /> : <Navigate to="/dashboard" />;

      case 'User Management':
        return userRole === 'superadmin' ? <UserManagement /> : <Navigate to="/dashboard" />;

      case 'Requisitions':
        return (userRole === 'admin' || userRole === 'approver' || userRole === 'superadmin')
          ? <ApproveRequests user={user} />
          : <Navigate to="/dashboard" />;

      case 'MyRequests':
        return userRole === 'employee' ? <MyRequests user={user} /> : <Navigate to="/dashboard" />;

      case 'Profile':
        return <Profile user={user} onUpdate={setUser} />;

      case 'Inventory':
        return <ListOfSupplies />;

      default:
        if (userRole === 'superadmin') {
          return <SuperAdminDashboard user={user} />;
        } else if (userRole === 'admin' || userRole === 'approver') {
          return <AdminDashboard user={user} />;
        } else {
          return <EmployeeDashboard user={user} />;
        }
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        menuItems={menuItems}
        onViewChange={setCurrentView}
        currentView={currentView}
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        userRole={user?.role}
      />
      <div className="main-content" style={{
        flex: 1,
        marginLeft: sidebarExpanded ? '250px' : '70px',
        transition: 'margin-left 0.3s ease',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div style={{ padding: '20px' }}>
          {renderContent()}
        </div>
      </div>
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
  const [currentView, setCurrentView] = useState('Dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  // Data state
  const [supplies, setSupplies] = useState([])
  const [users, setUsers] = useState([])
  const [requisitions, setRequisitions] = useState([])

  // Get menu items based on user role
  const menuItems = useMemo(() => {
    if (user?.role) {
      const role = user.role.toLowerCase();
      return sidebarMenus[role] || sidebarMenus.employee;
    }
    return [];
  }, [user?.role]);

  // Derive view during render
  const derivedView = useMemo(() => {
    if (menuItems.length > 0 && !menuItems.includes(currentView)) {
      return menuItems[0];
    }
    return currentView;
  }, [menuItems, currentView]);

  // Update view if needed
  if (derivedView !== currentView) {
    setCurrentView(derivedView);
  }

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('Dashboard');
    setSupplies([]);
    setUsers([]);
    setRequisitions([]);
  }

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
  )
}

export default App;