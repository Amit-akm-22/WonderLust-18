import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Star, MapPin, Heart, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Edit } from 'lucide-react'

function AllListings({ user }) {
  // Initialize from cache if available to make it feel instant
  const [listings, setListings] = useState(() => {
    const cached = sessionStorage.getItem('allListings');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('allListings'));
  const [showTax, setShowTax] = useState(false);
  const [likedListings, setLikedListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
    if (user) {
      fetchLikedListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      const res = await axios.get('/api/listings');
      if (res.data.success) {
        setListings(res.data.data);
        // Update cache
        sessionStorage.setItem('allListings', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error("Error fetching listings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedListings = async () => {
    try {
      const res = await axios.get('/api/liked/liked-listings');
      if (res.data.success) {
        setLikedListings(res.data.data.map(l => l._id));
      }
    } catch (err) {
      console.error("Error fetching liked listings");
    }
  };

  const handleToggleLike = async (id, e) => {
    e.preventDefault();
    if (!user) return navigate('/auth', { state: { from: '/' } });

    try {
      const res = await axios.post(`/api/liked/${id}/toggle-like`);
      if (res.data.success) {
        if (res.data.liked) {
          setLikedListings(prev => [...prev, id]);
        } else {
          setLikedListings(prev => prev.filter(item => item !== id));
        }
      }
    } catch (err) {
      console.error("Like toggle failed");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const calculatePrice = (price) => {
    if (!price) return 0;
    if (showTax) {
      return price + (price * 0.18); // 18% tax
    }
    return price;
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loader"></div>
      <p>Finding perfect homes for you...</p>
    </div>
  );

  return (
    <div className="home-container">
      <header className="hero-section">
        <div className="hero-content">
          <motion.div
            className="greeting-box"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {user ? (
              <h3>{getGreeting()}, <span className="pink-text">{user.username}</span>. Welcome back!</h3>
            ) : (
              <h3>{getGreeting()}! Welcome to <span className="pink-text">Wonderlust</span>.</h3>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Find your next <span className="highlight">Adventure</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Explore unique stays and experiences around the world.
          </motion.p>
        </div>

        <div className="tax-toggle-bar glass">
          <div className="toggle-info">
            <span className="toggle-label">Display total before taxes</span>
          </div>
          <button
            className={`toggle-switch ${showTax ? 'active' : ''}`}
            onClick={() => setShowTax(!showTax)}
          >
            <div className="switch-handle"></div>
          </button>
        </div>
      </header>

      <div className="listing-grid">
        <AnimatePresence>
          {listings.map((listing, index) => (
            <motion.div
              key={listing._id}
              className="premium-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -10 }}
            >
              <div className="card-top">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="card-main-img"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  className={`wishlist-overlay-btn ${likedListings.includes(listing._id) ? 'liked' : ''}`}
                  onClick={(e) => handleToggleLike(listing._id, e)}
                >
                  <Heart size={20} fill={likedListings.includes(listing._id) ? "#ff385c" : "none"} stroke={likedListings.includes(listing._id) ? "#ff385c" : "white"} />
                </button>
              </div>

              <div className="card-body">
                <h3 className="card-title-main">{listing.title}</h3>

                <div className="card-location-row">
                  <MapPin size={16} className="pink-icon" />
                  <span>{listing.location}, {listing.country}</span>
                </div>

                <p className="card-desc-short">
                  {listing.description ? listing.description.substring(0, 90) + '...' : 'Stay in this incredible place with authentic vibes and great views...'}
                </p>

                <div className="card-footer-row">
                  <div className="price-box">
                    <span className="amount">₹{calculatePrice(listing.price).toLocaleString('en-IN')}</span>
                    <span className="per-night"> / night</span>
                    {showTax && <span className="tax-badge">inc. tax</span>}
                  </div>

                  <div className="card-actions">
                    {user?.isAdmin && (
                      <Link to={`/listings/${listing._id}/edit`} className="admin-edit-pill">
                        <Edit size={14} /> Edit
                      </Link>
                    )}
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user) {
                          navigate('/auth', { state: { from: `/listings/${listing._id}` } });
                        } else {
                          navigate(`/listings/${listing._id}`);
                        }
                      }}
                      className="view-details-action"
                      style={{ cursor: 'pointer' }}
                    >
                      View Details
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        .home-container {
          padding-bottom: 100px;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
        }

        .greeting-box {
          margin-bottom: 10px;
        }

        .greeting-box h3 {
          font-size: 18px;
          color: #666;
          font-weight: 600;
        }

        .pink-text { color: var(--primary); }

        .hero-content h1 {
          font-size: 56px;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin-bottom: 15px;
        }

        .hero-content .highlight {
          color: var(--primary);
          position: relative;
        }

        .hero-content p {
          font-size: 20px;
          color: #666;
          font-weight: 500;
        }

        .tax-toggle-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          border-radius: 20px;
          width: 500px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }

        .toggle-label {
          font-weight: 700;
          font-size: 15px;
          color: #444;
        }

        .toggle-switch {
          width: 50px;
          height: 28px;
          background: #e2e8f0;
          border-radius: 20px;
          position: relative;
          padding: 4px;
          transition: all 0.3s ease;
        }

        .toggle-switch.active {
          background: var(--primary);
        }

        .switch-handle {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .active .switch-handle {
          transform: translateX(22px);
        }

        .listing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 40px 30px;
        }

        .premium-card {
           background: white;
           border-radius: 25px;
           overflow: hidden;
           box-shadow: 0 10px 40px rgba(0,0,0,0.06);
           border: 1px solid #f0f0f0;
           transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .card-top {
          position: relative;
          height: 240px;
          overflow: hidden;
          margin: 10px;
          border-radius: 20px;
        }

        .card-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .premium-card:hover .card-main-img {
          transform: scale(1.1);
        }

        .wishlist-overlay-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0,0,0,0.1);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }

        .wishlist-overlay-btn.liked {
          background: white;
        }

        .card-body {
          padding: 20px 25px 25px;
        }

        .card-title-main {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-location-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .pink-icon { color: var(--primary); }

        .card-desc-short {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
          height: 45px;
          overflow: hidden;
        }

        .card-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #f5f5f5;
        }

        .price-box {
          display: flex;
          flex-direction: column;
        }

        .price-box .amount {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
        }

        .price-box .per-night {
          font-size: 14px;
          color: #666;
          font-weight: 600;
        }

        .tax-badge {
          font-size: 10px;
          background: #f0f0f0;
          color: #888;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
          margin-top: 4px;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-edit-pill {
           background: #f1f5f9;
           color: #475569;
           padding: 8px 12px;
           border-radius: 8px;
           font-size: 13px;
           font-weight: 700;
           display: flex;
           align-items: center;
           gap: 6px;
        }

        .view-details-action {
          border: 1px solid #333;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .view-details-action:hover {
          background: #333;
          color: white;
        }

        .loading-container {
          height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .loader {
          width: 48px;
          height: 48px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .hero-content h1 { font-size: 32px; }
          .hero-content p { font-size: 14px; }
          .tax-toggle-bar { width: 100%; max-width: 350px; padding: 10px 15px; }
          .listing-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .premium-card { border-radius: 15px; }
          .card-body { padding: 12px 15px 15px; }
          .card-title-main { font-size: 16px; margin-bottom: 4px; }
          .card-location-row { font-size: 11px; margin-bottom: 8px; }
          .card-desc-short { display: none; }
          .card-footer-row { padding-top: 10px; }
          .price-box .amount { font-size: 15px; }
          .price-box .per-night { font-size: 11px; }
          .view-details-action { padding: 6px 10px; font-size: 11px; border-radius: 6px; }
          .admin-edit-pill { padding: 5px 8px; font-size: 11px; border-radius: 6px; }
        }

        @media (max-width: 480px) {
          .listing-grid { gap: 10px; }
          .card-top { height: 160px; margin: 5px; border-radius: 12px; }
          .hero-content h1 { font-size: 26px; }
          .tax-toggle-bar { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default AllListings
