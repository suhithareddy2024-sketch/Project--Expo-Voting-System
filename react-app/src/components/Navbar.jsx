import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';

export default function Navbar() {
  const { expoSettings, user, isAdminLoggedIn, logout } = useExpo();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleScrollTo = (sectionId) => {
    setNavOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top glass-nav">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-3 d-flex align-items-center" to="/">
          <i className="fa-solid fa-cube text-cyan me-2"></i>
          <span>{expoSettings.expoCategory}</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setNavOpen(!navOpen)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`} id="menu">
          <ul className="navbar-nav ms-auto align-items-center gap-1">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive && location.hash === '' ? 'active' : ''}`}
                onClick={() => setNavOpen(false)}
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className="nav-link btn btn-link border-0 text-decoration-none"
                onClick={() => handleScrollTo('projects')}
              >
                Projects
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className="nav-link btn btn-link border-0 text-decoration-none"
                onClick={() => handleScrollTo('leaderboard')}
              >
                Leaderboard
              </button>
            </li>
            {user && !isAdminLoggedIn && (
              <li className="nav-item ms-lg-2">
                <span className="badge bg-dark-glass text-cyan border border-cyan px-3 py-2 rounded-pill small">
                  <i className="fa-solid fa-user-check me-1"></i> {user.name || user.email}
                </span>
              </li>
            )}
            <li className="nav-item ms-lg-2">
              <NavLink
                to="/admin"
                className={`nav-link btn ${
                  isAdminLoggedIn ? 'btn-cyan text-dark' : 'btn-outline-cyan'
                } btn-sm px-3 rounded-pill`}
                onClick={() => setNavOpen(false)}
              >
                <i className="fa-solid fa-user-gear me-1"></i>{' '}
                {isAdminLoggedIn ? 'Admin Panel' : 'Admin Portal'}
              </NavLink>
            </li>
            {user && (
              <li className="nav-item ms-lg-1">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                  onClick={() => {
                    logout();
                    setNavOpen(false);
                  }}
                  title="Logout"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
