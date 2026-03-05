import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Sidebar from './Components/Sidebar'
import Dashboard from './Components/Dashboard'
import ListOfSupplies from './Components/ListOfSupplies'
import RequestForm from './Components/RequestForm'
import History from './Components/History'
import Profile from './Components/Profile'
import Login from './Components/Login'
import SignIn from './Components/SignIn'

// MainContent component declared outside of App
function MainContent({ currentView, sidebarExpanded, toggleSidebar, handleLogout, supplies, setSupplies, historyData, setHistoryData, setCurrentView }) {
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard totalSupplies={supplies.length} />
      case 'supplies':
        return <ListOfSupplies supplies={supplies} setSupplies={setSupplies} />
      case 'request':
        return <RequestForm onRequestSubmit={setHistoryData} />
      case 'history':
        return <History historyData={historyData} />
      case 'settings':
        return <Profile />
      default:
        return <Dashboard totalSupplies={supplies.length} />
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        onViewChange={setCurrentView}
        currentView={currentView}
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [historyData, setHistoryData] = useState([
    {
      id: 1,
      requester: 'Nicole Young',
      department: 'Admin Department',
      date: '2024-01-15',
      type: 'Request',
      items: [
        { name: 'Laptop', quantity: 2, status: 'Approved' },
        { name: 'Mouse', quantity: 5, status: 'Approved' }
      ],
      status: 'Completed'
    },
    {
      id: 2,
      requester: 'Jasmine',
      department: 'HR Department',
      date: '2024-01-14',
      type: 'Request',
      items: [
        { name: 'Printer Paper', quantity: 10, status: 'Pending' }
      ],
      status: 'Pending'
    },
    {
      id: 3,
      requester: 'JM',
      department: 'Finance Department',
      date: '2024-01-13',
      type: 'Return',
      items: [
        { name: 'Calculator', quantity: 1, status: 'Completed' }
      ],
      status: 'Completed'
    },
    {
      id: 4,
      requester: 'Ella',
      department: 'Finance Department',
      date: '2024-01-12',
      type: 'Request',
      items: [
        { name: 'Projector', quantity: 1, status: 'Approved' },
        { name: 'Whiteboard Markers', quantity: 20, status: 'Approved' }
      ],
      status: 'Completed'
    },
    {
      id: 5,
      requester: 'Daryll',
      department: 'Statistical Department',
      date: '2024-01-11',
      type: 'Request',
      items: [
        { name: 'Safety Gloves', quantity: 50, status: 'Approved' }
      ],
      status: 'Completed'
    }
  ])
  const [supplies, setSupplies] = useState([
    {
      id: 1,
      name: 'Pens',
      unit: 'Office Supplies',
      unitPrice: 1.50,
      totalAmount: 150.00,
      inventoryDec31: 100,
      adjustments: 0,
      totalInventory: 100,
      issuances: 0,
      balances: 100,
    },
    {
      id: 2,
      name: 'Paper',
      unit: 'Office Supplies',
      unitPrice: 5.00,
      totalAmount: 2500.00,
      inventoryDec31: 500,
      adjustments: 0,
      totalInventory: 500,
      issuances: 0,
      balances: 500,
    },
    {
      id: 3,
      name: 'Cleaning Spray',
      unit: 'Cleaning Supplies',
      unitPrice: 3.00,
      totalAmount: 150.00,
      inventoryDec31: 50,
      adjustments: 0,
      totalInventory: 50,
      issuances: 0,
      balances: 50,
    },
  ])

  const handleLogin = (email, role) => {
    setIsLoggedIn(true);
    console.log(`[APP] User logged in: ${email} with role: ${role}`);
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignIn />} />
        <Route
          path="/*"
          element={isLoggedIn ? (
            <MainContent
              currentView={currentView}
              sidebarExpanded={sidebarExpanded}
              toggleSidebar={toggleSidebar}
              handleLogout={handleLogout}
              supplies={supplies}
              setSupplies={setSupplies}
              historyData={historyData}
              setHistoryData={setHistoryData}
              setCurrentView={setCurrentView}
            />
          ) : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  )
}

export default App
