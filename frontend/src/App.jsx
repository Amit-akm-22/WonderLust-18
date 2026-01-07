import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Map, Heart, User, PlusCircle, Search, LogOut } from 'lucide-react'
import axios from 'axios'

// Pages
import AllListings from './pages/AllListings'
import ListingDetails from './pages/ListingDetails'
import NewListing from './pages/NewListing'
import EditListing from './pages/EditListing'
import Auth from './pages/Auth'
import LikedListings from './pages/LikedListings'
import Checkout from './pages/Checkout'

function App() {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage for snappy UI
    const storedUser = localStorage.getItem('user');
    console.log("App: Initializing user state from localStorage. Key 'user' exists:", !!storedUser);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log("App: Successfully parsed user from localStorage:", parsed);
        return parsed;
      } catch (e) {
        console.error("App: Failed to parse user JSON from localStorage", e);
        return null;
      }
    }
    return null;
  });
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const runInitialCheck = async () => {
      console.log("App: Starting initial checkAuth...");
      await checkAuth();
      setIsInitialCheckDone(true);
      console.log("App: Initial checkAuth complete.");
    };
    runInitialCheck();

    // Listen for auth failures from main.jsx interceptor
    const handleAuthFailure = () => {
      console.log("App: Auth failure detected, clearing state.");
      setUser(null);
    };
    window.addEventListener('auth-failure', handleAuthFailure);
    return () => window.removeEventListener('auth-failure', handleAuthFailure);
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token') || (user && user.token);
    console.log("App: Performing checkAuth. Token found:", !!token);

    if (!token && !localStorage.getItem('user')) {
      console.log("App: No token or user in storage, skipping status check");
      return;
    }

    try {
      const res = await axios.get('/api/users/status');
      console.log("App: Status check response:", res.data);
      if (res.data.isAuthenticated) {
        const userData = { ...res.data.user, token: token || res.data.token };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log("App: User authenticated as:", userData.username || userData.name);
      } else {
        console.warn("App: Status check says NOT authenticated. Cleaning up storage...");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (err) {
      console.error("App: Auth check request failed", err.message);

      // CRITICAL: Only clear state if it's a 401 Unauthorized or 403 Forbidden
      // If it's a 404 (User Not Found) or 500 (Server Error), we might want to be less aggressive
      if (err.response) {
        console.log("App: Error Status:", err.response.status);
        if (err.response.status === 401 || err.response.status === 403) {
          console.warn("App: Unauthorized access (401/403). Clearing session data.");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } else if (err.response.status === 404) {
          console.warn("App: User not found on server (404). This might happen with manual placeholder IDs.");
          // We'll clear it just to be safe and avoid infinite reload loops
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('/api/users/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error("Logout failed");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <div className="app">
      <nav className="navbar-premium glass">
        <div className="container nav-box">
          <Link to="/" className="branding">
            <div className="logo-circ"><Map size={24} /></div>
            <span>WonderLust</span>
          </Link>

          <div className="search-pill">
            <button className="search-term">Anywhere</button>
            <div className="search-divider"></div>
            <button className="search-term">Any week</button>
            <div className="search-divider"></div>
            <button className="search-term add-guests">Add guests</button>
            <button className="search-icon-btn"><Search size={16} /></button>
          </div>

          <div className="nav-actions">
            <div
              onClick={() => {
                if (!user) navigate('/auth', { state: { from: '/listings/new' } });
                else navigate('/listings/new');
              }}
              className="action-btn-link"
              style={{ cursor: 'pointer' }}
            >
              Host your home
            </div>

            <div
              onClick={() => {
                if (!user) navigate('/auth', { state: { from: '/liked' } });
                else navigate('/liked');
              }}
              className="wishlist-link"
              style={{ cursor: 'pointer' }}
            >
              <Heart size={20} />
            </div>

            <div className="user-profile-menu glass">
              {user ? (
                <>
                  <button className="profile-trigger">
                    <User size={20} />
                    <span className="user-name-text">{user.username || user.name || user.role || 'User'}</span>
                  </button>
                  <button onClick={handleLogout} className="logout-action-btn" title="Logout">
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <Link to="/auth" className="login-link">
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="main-viewport">
        {!isInitialCheckDone ? (
          <div className="loading-screen-full">
            <div className="loader-pink"></div>
            <p>Syncing your adventure...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<AllListings user={user} />} />
            <Route path="/listings/:id" element={<ListingDetails user={user} />} />
            <Route path="/listings/new" element={<NewListing />} />
            <Route path="/listings/:id/edit" element={<EditListing />} />
            <Route path="/auth" element={<Auth onLogin={checkAuth} />} />
            <Route path="/liked" element={<LikedListings />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        )}
      </main>

      {location.pathname !== '/auth' && location.pathname !== '/checkout' && (
        <footer className="footer-premium">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-col">
                <h4>Discover</h4>
                <Link to="/">Destinations</Link>
                <Link to="/">Adventure Types</Link>
                <Link to="/">Popular Routes</Link>
                <Link to="/">Trending Locations</Link>
                <Link to="/">Travel Guides</Link>
              </div>
              <div className="footer-col">
                <h4>Book & Plan</h4>
                <Link to="/">Accommodations</Link>
                <Link to="/">Flights</Link>
                <Link to="/">Tour Packages</Link>
                <Link to="/">Travel Insurance</Link>
                <Link to="/">Visa Information</Link>
              </div>
              <div className="footer-col">
                <h4>About Wonderlust</h4>
                <Link to="/">Our Story</Link>
                <Link to="/">Careers</Link>
                <Link to="/">Press</Link>
                <Link to="/">Investor Relations</Link>
                <Link to="/">Corporate Responsibility</Link>
              </div>
              <div className="footer-col">
                <h4>Support</h4>
                <Link to="/">Help Center</Link>
                <Link to="/">Customer Service</Link>
                <Link to="/">Cancel Booking</Link>
                <Link to="/">Refund Policy</Link>
                <Link to="/">Accessibility</Link>
              </div>
            </div>

            <div className="footer-bottom">
              <div className="footer-socials">
                <a href="#"><i className="fab fa-facebook"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-linkedin"></i></a>
                <a href="#"><i className="fab fa-youtube"></i></a>
              </div>
              <p className="copyright-text">© 2026 Wonderlust. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      )}

      <style>{`
                .loading-screen-full {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 70vh;
                    gap: 20px;
                    color: #666;
                    font-weight: 600;
                }

                .loader-pink {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .navbar-premium {
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .nav-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .branding {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--primary);
          font-size: 24px;
          font-weight: 800;
        }

        .logo-circ {
          background: var(--primary);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-pill {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #ddd;
          border-radius: 40px;
          padding: 8px 8px 8px 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
          transition: var(--transition);
        }

        .search-pill:hover {
          box-shadow: 0 2px 4px rgba(0,0,0,0.18);
        }

        .search-term {
          font-size: 14px;
          font-weight: 700;
          background: none;
          border: none;
          padding: 0 16px;
          cursor: pointer;
        }

        .add-guests {
          color: #717171;
          font-weight: 500;
        }

        .search-divider {
          width: 1px;
          height: 24px;
          background: #ddd;
        }

        .search-icon-btn {
          background: var(--primary);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .action-btn-link {
          font-weight: 700;
          font-size: 14px;
          padding: 10px 15px;
          border-radius: 20px;
        }

        .action-btn-link:hover {
          background: #f7f7f7;
        }

        .wishlist-link {
          color: #333;
        }

        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 25px;
          font-weight: 700;
          font-size: 14px;
          background: white;
          transition: var(--transition);
        }

        .profile-trigger:hover {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background: #f7f7f7;
        }

        .login-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 25px;
          font-weight: 700;
          font-size: 14px;
          color: #222;
          transition: var(--transition);
        }

        .login-link:hover {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background: #f7f7f7;
          border-color: #bbb;
        }

        .logout-action-btn {
          color: #888;
          padding: 5px;
        }

        .logout-action-btn:hover {
          color: var(--primary);
        }

        .main-viewport {
          min-height: 100vh;
          padding-top: 50px;
        }

        .footer-premium {
          background: var(--primary);
          color: white;
          padding: 80px 0 40px;
          margin-top: 100px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          margin-bottom: 60px;
        }

        .footer-col h4 {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer-col a {
          display: block;
          color: rgba(255,255,255,0.8);
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .footer-col a:hover {
          color: white;
          text-decoration: underline;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .footer-socials {
          display: flex;
          gap: 25px;
          font-size: 20px;
        }

        .copyright-text {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
        }

        @media (max-width: 1000px) {
          .search-pill { display: none; }
          .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .branding span { font-size: 20px; }
        }

        @media (max-width: 768px) {
          .nav-box { padding: 0 5px; }
          .user-name-text { display: none; }
          .action-btn-link { display: none; }
          .branding span { display: none; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .footer-socials { justify-content: center; }
          .main-viewport { padding-top: 30px; }
        }

        @media (max-width: 480px) {
           .nav-actions { gap: 12px; }
           .logo-circ { width: 32px; height: 32px; }
           .footer-premium { padding: 40px 0; }
        }
      `}</style>
    </div>
  )
}

export default App
