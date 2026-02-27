import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiCheckCircle,
  FiLayers,
} from 'react-icons/fi';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const studentLinks = [
    { to: '/', label: 'Dashboard', icon: <FiHome /> },
    { to: '/attendance', label: 'My Attendance', icon: <FiCalendar /> },
  ];

  const adminLinks = [
    { to: '/', label: 'Dashboard', icon: <FiHome /> },
    { to: '/admin/batches', label: 'Manage Batches', icon: <FiLayers /> },
    { to: '/admin/students', label: 'Students', icon: <FiUsers /> },
    { to: '/admin/settings', label: 'Settings', icon: <FiSettings /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="app-layout">
      {/* Mobile topbar */}
      <div className="topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <FiMenu />
        </button>
        <h2>Attendance MS</h2>
        <div style={{ width: 28 }} />
      </div>

      {/* Overlay */}
      <div
        className={`overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2>📋 Attendance MS</h2>
            <button
              className="hamburger-btn"
              onClick={closeSidebar}
              style={{ display: sidebarOpen ? 'flex' : 'none' }}
            >
              <FiX />
            </button>
          </div>
          <p>Management System</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">
            {user?.role === 'admin' ? 'Administration' : 'Menu'}
          </div>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.name || 'User'}</div>
              <div className="role">{user?.role || 'student'}</div>
            </div>
          </div>
          <button className="nav-link" onClick={handleLogout}>
            <FiLogOut />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
