import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { MapPin, Heart, ArrowRight, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function LikedListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLikedListings();
    }, []);

    const fetchLikedListings = async () => {
        try {
            const res = await axios.get('/api/liked/liked-listings');
            if (res.data.success) {
                setListings(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching liked listings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id, e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`/api/liked/${id}/toggle-like`);
            if (res.data.success) {
                setListings(prev => prev.filter(l => l._id !== id));
            }
        } catch (err) {
            console.error("Remove from wishlist failed");
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loader"></div>
            <p>Gathering your favorites...</p>
        </div>
    );

    return (
        <div className="wishlist-container">
            <header className="wishlist-header">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    Your <span className="highlight">Wishlist</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {listings.length} {listings.length === 1 ? 'place' : 'places'} you've saved for your next adventure.
                </motion.p>
            </header>

            <AnimatePresence>
                {listings.length === 0 ? (
                    <motion.div
                        className="empty-wishlist"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="empty-illust">
                            <Heart size={64} className="heart-faded" />
                        </div>
                        <h3>No saved places yet</h3>
                        <p>When you find a place you love, click the heart icon to save it here for later.</p>
                        <Link to="/" className="explore-btn">
                            Explore Destinations <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="listing-grid">
                        {listings.map((listing, index) => (
                            <motion.div
                                key={listing._id}
                                className="premium-card"
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -10 }}
                            >
                                <Link to={`/listings/${listing._id}`}>
                                    <div className="card-top">
                                        <img src={listing.image} alt={listing.title} className="card-main-img" />
                                        <button
                                            className="remove-wishlist-btn"
                                            onClick={(e) => handleRemove(listing._id, e)}
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="card-body">
                                        <h3 className="card-title-main">{listing.title}</h3>

                                        <div className="card-location-row">
                                            <MapPin size={16} className="pink-icon" />
                                            <span>{listing.location}, {listing.country}</span>
                                        </div>

                                        <div className="card-footer-row">
                                            <div className="price-box">
                                                <span className="amount">₹{listing.price?.toLocaleString('en-IN')}</span>
                                                <span className="per-night"> / night</span>
                                            </div>

                                            <span className="view-details-action">
                                                View Details
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .wishlist-container {
                    padding-bottom: 100px;
                }

                .wishlist-header {
                    margin-bottom: 60px;
                }

                .wishlist-header h1 {
                    font-size: 48px;
                    font-weight: 800;
                    margin-bottom: 10px;
                    letter-spacing: -1px;
                }

                .wishlist-header .highlight {
                    color: var(--primary);
                }

                .wishlist-header p {
                    font-size: 18px;
                    color: #666;
                    font-weight: 500;
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

                .remove-wishlist-btn {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: white;
                    color: #ff385c;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                    z-index: 10;
                }

                .remove-wishlist-btn:hover {
                    background: #ff385c;
                    color: white;
                    transform: scale(1.1);
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
                    margin-bottom: 20px;
                }

                .pink-icon { color: var(--primary); }

                .card-footer-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px solid #f5f5f5;
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

                .view-details-action {
                    border: 1px solid #333;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .premium-card:hover .view-details-action {
                    background: #333;
                    color: white;
                }

                .empty-wishlist {
                    text-align: center;
                    padding: 100px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .heart-faded {
                    color: #f1f5f9;
                    fill: #f1f5f9;
                }

                .empty-wishlist h3 {
                    font-size: 28px;
                    font-weight: 800;
                }

                .empty-wishlist p {
                    color: #666;
                    max-width: 400px;
                    font-size: 18px;
                }

                .explore-btn {
                    background: var(--primary);
                    color: white;
                    padding: 15px 30px;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: var(--transition);
                }

                .explore-btn:hover {
                    background: var(--primary-hover);
                    transform: translateY(-2px);
                }

                .loading-container {
                    height: 60vh;
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
                    .wishlist-header h1 { font-size: 32px; }
                    .wishlist-header p { font-size: 14px; }
                    .listing-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
                    .premium-card { border-radius: 15px; }
                    .card-body { padding: 12px 15px 15px; }
                    .card-title-main { font-size: 16px; margin-bottom: 4px; }
                    .card-location-row { font-size: 11px; margin-bottom: 12px; }
                    .price-box .amount { font-size: 15px; }
                    .price-box .per-night { font-size: 11px; }
                    .view-details-action { padding: 6px 10px; font-size: 11px; border-radius: 6px; }
                    .remove-wishlist-btn { width: 32px; height: 32px; }
                }

                @media (max-width: 480px) {
                    .wishlist-header h1 { font-size: 26px; }
                    .card-top { height: 160px; margin: 5px; border-radius: 12px; }
                    .listing-grid { gap: 10px; }
                }
            `}</style>        </div>
    )
}

export default LikedListings
