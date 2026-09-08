import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Flexible auth checker that matches Login.jsx keys ('userToken') and fallbacks
  const checkAuthStatus = () => {
    const token = sessionStorage.getItem('userToken') || sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId') || sessionStorage.getItem('id') || sessionStorage.getItem('_id');
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

    const hasToken = token && token !== 'undefined' && token !== 'null' && token.trim() !== '';
    const hasUserId = userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== '';

    const isReallyLoggedIn = Boolean(hasToken || hasUserId);

    return { loggedIn: isReallyLoggedIn, isAdmin: isReallyLoggedIn && isAdmin };
  };

  const [auth, setAuth] = useState(checkAuthStatus);

  useEffect(() => {
    // Re-verify auth state whenever location/route changes or events fire
    setAuth(checkAuthStatus());

    const handleAuthChange = () => setAuth(checkAuthStatus());
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [location]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.dispatchEvent(new Event('auth-change'));
    setAuth({ loggedIn: false, isAdmin: false });
    navigate('/auth');
  };

  const handleQuickSeed = async () => {
    try {
      await api.post('/db/seed');
      alert("Database seeded successfully with test accounts, runs, cars, and tracks!");
      window.location.reload();
    } catch (err) {
      alert("Seeding failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom">
      <div className="container">
        <Link className="navbar-brand" to="/">LapTracker</Link>
        <div className="navbar-nav ms-auto align-items-center">
          <Link className="nav-link" to="/leaderboard">Leaderboard</Link>
          <Link className="nav-link" to="/stopwatch">Stopwatch</Link>
          
          <button 
            className="btn btn-outline-warning btn-sm ms-2 me-2 text-uppercase fw-bold" 
            onClick={handleQuickSeed}
          >
            Seed DB
          </button>

          {auth.loggedIn ? (
            <>
              <Link className="nav-link" to="/profile">Profile</Link>
              
              {auth.isAdmin && (
                <Link className="nav-link text-warning fw-bold" to="/admin">Admin Panel</Link>
              )}

              <button 
                className="btn btn-outline-danger btn-sm ms-2 text-uppercase fw-bold" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link className="nav-link" to="/auth">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;