import { useState, useEffect, useCallback } from 'react'
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
        console.log('📦 Rendering ListOfSupplies with supplies:', supplies);
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
      <div className="main-content" style={{
        flex: 1,
        marginLeft: sidebarExpanded ? '250px' : '70px',
        transition: 'margin-left 0.3s',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <Navbar
          user={user}
          onLogout={handleLogout}
          onViewChange={setCurrentView}
          menuItems={menuItems}
        />
        <div style={{ padding: '20px' }}>
          {renderContent()}
        </div>
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

  // Update menu items when user changes - FIXED to avoid warning
  useEffect(() => {
    if (user?.role) {
      console.log('🎯 Updating menu for role:', user.role);
      console.log('📋 Available menus:', sidebarMenus);

      const items = sidebarMenus[user.role] || sidebarMenus.Employee;
      console.log('✅ Selected menu items:', items);

      // Use a timeout to break the synchronous state update
      const timeoutId = setTimeout(() => {
        setMenuItems(items);
      }, 0);

      // Set default view based on role
      if (!items.includes(currentView)) {
        setTimeout(() => {
          console.log('🔄 Setting default view to:', items[0]);
          setCurrentView(items[0]);
        }, 0);
      }

      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => {
        setMenuItems([]);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [user, currentView]); // Added currentView dependency

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
        try {
          setSupplies(JSON.parse(savedSupplies));
        } catch (e) {
          console.error('Error parsing supplies:', e);
        }
      }

      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        try {
          setUsers(JSON.parse(savedUsers));
        } catch (e) {
          console.error('Error parsing users:', e);
        }
      }

      const savedRequisitions = localStorage.getItem('requisitions');
      if (savedRequisitions) {
        try {
          setRequisitions(JSON.parse(savedRequisitions));
        } catch (e) {
          console.error('Error parsing requisitions:', e);
        }
      }
    };

    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn]);

  // Fetch supplies from API when component mounts
  useEffect(() => {
    const fetchSupplies = async () => {
      if (!isLoggedIn || !user) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/inventories', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Fetched supplies from API:', data);
          setSupplies(data);
        }
      } catch (error) {
        console.error('Error fetching supplies:', error);
      }
    };

    fetchSupplies();
  }, [isLoggedIn, user]);

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
    setSupplies([]);
    setUsers([]);
    setRequisitions([]);
    console.log('✅ Logout complete, localStorage cleared');
  }

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