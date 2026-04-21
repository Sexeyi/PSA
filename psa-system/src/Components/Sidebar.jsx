import React from 'react';
import Logo from '../assets/psa.png';
import './Sidebar.css';
import {
  LayoutDashboard,
  Settings,
  Users,
  UserCircle,
  ClipboardList,
  Package,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
  ShoppingCart,
  Truck,
  Bell,
  Calendar,
  HelpCircle,
  Home,
  Inbox,
  Archive,
  DollarSign,
  TrendingUp,
  Shield,
  Key,
  Mail,
  Clock,
  Lock,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  Upload,
  Printer,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  Share2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MessageSquare,
  Send,
  Paperclip,
  Image,
  Folder,
  File,
  FilePlus,
  FolderOpen,
  FolderPlus,
  Cloud,
  Database,
  Server,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Volume2,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  Droplet,
  Compass,
  Map,
  Navigation,
  Briefcase,
  Award,
  Trophy,
  Crown,
  Sparkles,
  Flame,
  Leaf,
  Flower,
  Mountain,
  Waves,
  Circle,
  Square,
  Triangle,
  Diamond,
  Heart,
  BadgeCheck,
  BadgeX,
  BadgeInfo,
  BadgeAlert,
  BadgeHelp
} from 'lucide-react';

const Sidebar = ({
  onViewChange,
  currentView,
  menuItems = [],
  userRole,
  user,
  collapsed = false,
  onToggleCollapse,
  onLogout
}) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleMenuClick = (view) => {
    if (view === 'Logout') {
      if (onLogout) onLogout();
      return;
    }
    onViewChange(view);
  };

  // Professional icon mapping for menu items
  const getIcon = (item) => {
    const itemLower = item.toLowerCase();
    const iconProps = { size: 18, strokeWidth: 1.5 };

    // Dashboard
    if (itemLower === 'dashboard') return <LayoutDashboard {...iconProps} />;

    // User Management
    if (itemLower === 'user management') return <Users {...iconProps} />;
    if (itemLower === 'users') return <Users {...iconProps} />;

    // Supplies / Inventory
    if (itemLower === 'supplies') return <Package {...iconProps} />;
    if (itemLower === 'inventory') return <Package {...iconProps} />;

    // Requests
    if (itemLower === 'request approval') return <CheckCircle {...iconProps} />;
    if (itemLower === 'requisitions') return <ClipboardList {...iconProps} />;
    if (itemLower === 'my requests') return <FileText {...iconProps} />;

    // Profile
    if (itemLower === 'profile') return <UserCircle {...iconProps} />;

    // Settings
    if (itemLower === 'settings') return <Settings {...iconProps} />;

    // Logout
    if (itemLower === 'logout') return <LogOut {...iconProps} />;

    // Default
    return <Circle {...iconProps} />;
  };

  // Get profile picture URL
  const getProfilePictureUrl = () => {
    if (user?.profilePicture) {
      const pictureUrl = user.profilePicture.startsWith('http')
        ? user.profilePicture
        : `${API_BASE_URL}${user.profilePicture}`;
      return pictureUrl;
    }
    return null;
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="psa-logo-container">
        <div className="logo-wrapper">
          <img src={Logo} alt="PSA Logo" className="psa-logo" />
          {!collapsed && (
            <div className="title-wrapper">
              <span className="title-text">Philippine Statistics Authority</span>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button className="sidebar-toggle" onClick={onToggleCollapse}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item}
            className={currentView === item ? 'active' : ''}
            onClick={() => handleMenuClick(item)}
            title={collapsed ? item : ''}
          >
            <span className="menu-icon">{getIcon(item)}</span>
            {!collapsed && <span className="menu-text">{item}</span>}
          </li>
        ))}
      </ul>

      {/* Logout button */}
      <div className="sidebar-logout">
        <li
          className="logout-item"
          onClick={() => handleMenuClick('Logout')}
          title={collapsed ? 'Logout' : ''}
        >
          <span className="menu-icon">{getIcon('Logout')}</span>
          {!collapsed && <span className="menu-text">Logout</span>}
        </li>
      </div>

      {/* User Profile Footer */}
      {userRole && (
        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="user-profile">
              <div className="user-avatar">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={user?.fullName || 'User'}
                    className="user-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || userRole.charAt(0);
                    }}
                  />
                ) : (
                  user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || userRole.charAt(0)
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.fullName || 'User'}</span>
                <span className="user-email">{user?.email || 'user@psa.gov.ph'}</span>
              </div>
            </div>
          ) : (
            <div className="user-profile-collapsed" title={user?.fullName || userRole}>
              <div className="user-avatar-small">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={user?.fullName || 'User'}
                    className="user-avatar-image-small"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || userRole.charAt(0);
                    }}
                  />
                ) : (
                  user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || userRole.charAt(0)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;