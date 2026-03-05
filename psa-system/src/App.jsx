import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './Components/Sidebar'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ListOfSupplies from './pages/superadmin/ListOfSupplies'
import ApproveRequests from './pages/admin/ApproveRequests'
import Profile from './Components/Profile'
import Login from './pages/auth/Login'
import SignIn from './pages/auth/SignIn'
import Navbar from './Components/Navbar'
import UserManagement from './pages/superadmin/UserManagement'
import MyRequests from './pages/employee/MyRequests'

// Sidebar menu configuration based on role
const sidebarMenus = {
  SuperAdmin: ["Dashboard", "Supplies", "User Management"],
  Admin: ["Dashboard", "Requisitions", "Supplies"],
  Employee: ["Dashboard", "MyRequests"]
};

// MainContent component declared outside of App
function MainContent({
  currentView,
  sidebarExpanded,
  toggleSidebar,
  handleLogout,
  supplies,
  setSupplies,
  setCurrentView,
  user,
  menuItems
}) {
  // Debug props
  useEffect(() => {
    console.log('🔄 MainContent received:', { user, menuItems, currentView });
  }, [user, menuItems, currentView]);

  const renderContent = () => {
    const userRole = user?.role || 'Employee';
    console.log('🎯 Rendering for role:', userRole, 'View:', currentView);

    switch (currentView) {
      case 'Dashboard':
        // Return different dashboard based on role
        if (userRole === 'SuperAdmin') {
          return <SuperAdminDashboard
            totalSupplies={supplies?.length || 0}
            userRole={userRole}
            user={user}
          />;
        } else if (userRole === 'Admin') {
          return <AdminDashboard user={user} />;
        } else {
          return <EmployeeDashboard user={user} />;
        }

      case 'Supplies':
        return <ListOfSupplies
          supplies={supplies || []}
          setSupplies={setSupplies}
          userRole={userRole}
        />;

      case 'User Management':
        return userRole === 'SuperAdmin' ? <UserManagement /> : <Navigate to="/dashboard" />;

      case 'Requisitions':
        return userRole === 'Admin' ? <ApproveRequests /> : <Navigate to="/dashboard" />;

      case 'MyRequests':
        return userRole === 'Employee' ? <MyRequests user={user} /> : <Navigate to="/dashboard" />;

      case 'Profile':
        return <Profile user={user} />;

      default:
        if (userRole === 'SuperAdmin') {
          return <SuperAdminDashboard
            totalSupplies={supplies?.length || 0}
            userRole={userRole}
            user={user}
          />;
        } else if (userRole === 'Admin') {
          return <AdminDashboard user={user} />;
        } else {
          return <EmployeeDashboard user={user} />;
        }
    }
  };
  return (
    <div className="app-container" style={{ display: 'flex' }}>
      <Sidebar
        menuItems={menuItems}
        onViewChange={setCurrentView}
        currentView={currentView}
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        userRole={user?.role}
      />
      <div className="main-content" style={{ flex: 1, marginLeft: sidebarExpanded ? '250px' : '70px', transition: 'margin-left 0.3s' }}>
        <Navbar
          user={user}
          onLogout={handleLogout}
          onViewChange={setCurrentView}
          menuItems={menuItems}
        />
        {renderContent()}
      </div>
    </div>
  );
}

function App() {
  // Debug initial load
  console.log('🚀 App initializing...');

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔑 Initial auth check - Token:', !!token, 'User:', !!user);
    return !!(token && user);
  });

  // User state
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log('👤 Initial user from localStorage:', parsed);
        return parsed;
      } catch (e) {
        console.error('❌ Error parsing user:', e);
        return null;
      }
    }
    return null;
  });

  // UI state
  const [currentView, setCurrentView] = useState('Dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  // Data state - initialized as empty arrays
  const [supplies, setSupplies] = useState([])
  const [users, setUsers] = useState([])
  const [requisitions, setRequisitions] = useState([])

  // Get menu items based on user role
  const [menuItems, setMenuItems] = useState([])

  // Debug effect to log state changes
  useEffect(() => {
    console.log('📊 App state updated:', {
      isLoggedIn,
      user: user ? { ...user, password: undefined } : null,
      userRole: user?.role,
      menuItems,
      currentView,
      suppliesCount: supplies.length
    });
  }, [isLoggedIn, user, menuItems, currentView, supplies]);

  // Update menu items when user changes
  useEffect(() => {
    if (user?.role) {
      console.log('🎯 Updating menu for role:', user.role);
      console.log('📋 Available menus:', sidebarMenus);

      const items = sidebarMenus[user.role] || sidebarMenus.employee;
      console.log('✅ Selected menu items:', items);

      setMenuItems(items);

      // Set default view based on role
      if (!items.includes(currentView)) {
        console.log('🔄 Setting default view to:', items[0]);
        setCurrentView(items[0]);
      }
    } else {
      console.log('⚠️ No user role found, clearing menu items');
      setMenuItems([]);
    }
  }, [user]);

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          console.log('📦 Loading user from localStorage:', parsed);
          setUser(parsed);
        } catch (e) {
          console.error('❌ Error parsing user from localStorage:', e);
        }
      }

      // These should ideally come from API, not localStorage
      const savedSupplies = localStorage.getItem('supplies');
      if (savedSupplies) {
        setSupplies(JSON.parse(savedSupplies));
      }

      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }

      const savedRequisitions = localStorage.getItem('requisitions');
      if (savedRequisitions) {
        setRequisitions(JSON.parse(savedRequisitions));
      }
    };

    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn]);

  const handleLogin = (userData, token) => {
    console.log('🔐 handleLogin called with userData:', userData);
    console.log('🎭 User role:', userData.role);

    // Save to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    // Update state
    setIsLoggedIn(true);
    setUser(userData);

    console.log(`✅ User logged in: ${userData.email} with role: ${userData.role}`);
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  const handleLogout = () => {
    console.log('👋 Logging out...');
    // Clear all localStorage
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setMenuItems([]);
    setCurrentView('Dashboard');
    console.log('✅ Logout complete, localStorage cleared');
  }

  // Remove these localStorage saves if data should come from API
  useEffect(() => {
    if (supplies.length > 0) {
      localStorage.setItem('supplies', JSON.stringify(supplies));
    }
  }, [supplies]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (requisitions.length > 0) {
      localStorage.setItem('requisitions', JSON.stringify(requisitions));
    }
  }, [requisitions]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />
        <Route
          path="/signup"
          element={<SignIn />}
        />
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