import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SilkFashionLogo: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="luxury-silk-logo"
  >
    <defs>
      <linearGradient id="goldSilkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff3b0" />
        <stop offset="30%" stopColor="#facc15" />
        <stop offset="70%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id="crestBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#701a2d" />
        <stop offset="100%" stopColor="#3d0312" />
      </linearGradient>
      <filter id="royalGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#ca8a04" floodOpacity="0.45" />
      </filter>
    </defs>

    {/* Luxury Royal Diamond Crest */}
    <rect
      x="5"
      y="5"
      width="38"
      height="38"
      rx="10"
      fill="url(#crestBg)"
      stroke="url(#goldSilkGrad)"
      strokeWidth="2"
      filter="url(#royalGlow)"
    />

    {/* Elegant Flowing Saree Pallu & Loom Weave Motif */}
    <path
      d="M13 33C16 25 22 20 28 19C34 18 36 13 33 11C30 9 26 11 23 15C20 19 16 27 14 33Z"
      fill="url(#goldSilkGrad)"
    />
    <path
      d="M17 35C21 29 27 25 33 24C36 23 37 20 35 18C33 16 29 17 25 21C22 25 18 31 17 35Z"
      fill="#fff3b0"
      opacity="0.85"
    />
    <path
      d="M13 34C18 35 25 33 30 29C33 27 34 25 33 23"
      stroke="url(#goldSilkGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Spindle Star Gem Accents */}
    <circle cx="33" cy="13" r="2" fill="#fff3b0" />
    <circle cx="15" cy="33" r="1.5" fill="#facc15" />
  </svg>
);

export const Navbar: React.FC = () => {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav id="main-nav" data-testid="main-nav" className="site-navbar">
      <div className="navbar-container">
        {/* Tier 1: Brand Identity Row with Luxury SVG Logo */}
        <div className="navbar-brand-row">
          <div
            className="navbar-brand cursor-pointer"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >
            <SilkFashionLogo size={34} />
            <span className="brand-title" id="brand-title" data-testid="brand-title">
              Silk &amp; Fashion
            </span>
          </div>
        </div>

        {/* Tier 2: Navigation Links & User Session Row */}
        {userEmail && (
          <div className="navbar-links-row">
            <div className="navbar-menu">
              <NavLink
                to="/"
                id="nav-dashboard"
                data-testid="nav-dashboard"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Home
              </NavLink>
              <NavLink
                to="/inventory"
                id="nav-inventory"
                data-testid="nav-inventory"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Inventory
              </NavLink>
              <NavLink
                to="/production"
                id="nav-production"
                data-testid="nav-production"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Production
              </NavLink>
              <NavLink
                to="/purchase"
                id="nav-purchase"
                data-testid="nav-purchase"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Purchase
              </NavLink>
              <NavLink
                to="/sales"
                id="nav-sales"
                data-testid="nav-sales"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Sales
              </NavLink>
              <NavLink
                to="/customers"
                id="nav-customers"
                data-testid="nav-customers"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Customers
              </NavLink>
              <NavLink
                to="/guide"
                id="nav-guide"
                data-testid="nav-guide"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Guide
              </NavLink>
              <NavLink
                to="/history"
                id="nav-history"
                data-testid="nav-history"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                History
              </NavLink>
              <NavLink
                to="/settings"
                id="nav-settings"
                data-testid="nav-settings"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Settings
              </NavLink>
            </div>

            <div className="nav-user-section">
              <span id="user-display" data-testid="user-display" className="user-email-tag">
                {userEmail}
              </span>
              <button
                id="logout-btn"
                data-testid="logout-btn"
                type="button"
                onClick={handleLogout}
                className="btn-logout"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
