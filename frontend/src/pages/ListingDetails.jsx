import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Star, MapPin, Calendar, User, Share, Heart, Trash2, Edit, Wifi, Coffee, Wind, Tv } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ListingDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comments: '' });
  const [position, setPosition] = useState([20.5937, 78.9629]); // Default India center
  const [mapKey, setMapKey] = useState(0); // For forcing map re-render when position changes

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (listing) {
      geocodeLocation();
    }
  }, [listing]);

  const fetchListing = async () => {
    try {
      const res = await axios.get(`/api/listings/${id}`);
      if (res.data.success) {
        setListing(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching listing", err);
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocation = async () => {
    try {
      const query = `${listing.location}, ${listing.country}`;
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, { withCredentials: false });
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        setMapKey(prev => prev + 1); // Component needs to remount to change center properly
      }
    } catch (err) {
      console.warn("Geocoding failed, using default position.", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await axios.delete(`/api/listings/${id}`);
        navigate('/');
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/reviews/${id}/review`, review);
      setReview({ rating: 5, comments: '' });
      fetchListing();
    } catch (err) {
      alert("Review submission failed. Make sure you are logged in.");
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (window.confirm("Delete this review?")) {
      try {
        await axios.delete(`/api/reviews/${id}/reviews/${reviewId}`);
        fetchListing();
      } catch (err) {
        alert("Only the author or an admin can delete reviews.");
      }
    }
  };

  if (loading) return <div className="loading">Finding listing details...</div>;
  if (!listing) return <div className="error">Listing not found</div>;

  const isAdmin = user && user.isAdmin;
  const isOwner = user && listing.owner && (user._id === listing.owner._id || user.isAdmin);

  return (
    <div className="listing-details-container">
      <div className="listing-card-main">
        <div className="image-wrapper">
          <img src={listing.image} alt={listing.title} className="main-image" />
        </div>

        <div className="listing-info-header">
          <div className="title-price-row">
            <h1 className="listing-title">{listing.title}</h1>
            <div className="price-tag">
              <span className="amount">₹{listing.price?.toLocaleString('en-IN')}</span>
              <span className="per-night"> / night</span>
            </div>
          </div>

          <div className="host-vcard">
            <div className="vcard-avatar">
              <User size={24} />
            </div>
            <div className="vcard-text">
              <span className="host-name">{listing.owner?.username || 'Amit'}</span>
              <span className="listed-date">Listed by Amit on {new Date(listing.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <button className="heart-btn-round"><Heart size={20} /></button>
          </div>

          <div className="location-info">
            <MapPin size={18} className="pin-icon" />
            <span>{listing.location}, {listing.country}</span>
          </div>

          <div className="description-section">
            <h3 className="section-title">Description</h3>
            <p className="description-text">{listing.description}</p>
          </div>

          <div className="amenities-section">
            <h3 className="section-title">Amenities</h3>
            <div className="amenities-grid">
              <div className="amenity-chip"><Wind size={16} /> 3 Bedrooms</div>
              <div className="amenity-chip"><Coffee size={16} /> 2 Bathrooms</div>
              <div className="amenity-chip"><User size={16} /> Sleeps 6</div>
              <div className="amenity-chip"><Wifi size={16} /> Free WiFi</div>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/" className="btn-secondary-outline">
              <Calendar size={18} /> Back to Listings
            </Link>

            {isOwner && (
              <Link to={`/listings/${id}/edit`} className="btn-edit-action">
                <Edit size={18} /> Edit Listing
              </Link>
            )}

            <button
              className="btn-book-now"
              onClick={() => {
                if (!user) navigate('/auth', { state: { from: location.pathname } });
                else navigate('/checkout', { state: { listing } });
              }}
            >
              Book the Listing
            </button>
          </div>
        </div>
      </div>

      <div className="location-map-card">
        <div className="card-header">
          <h3><MapPin size={22} className="pink-icon" /> Location</h3>
        </div>
        <div className="map-wrapper">
          <MapContainer key={mapKey} center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                <strong>{listing.title}</strong><br />
                {listing.location}, {listing.country}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <div className="reviews-card">
        <div className="reviews-header">
          <h3>
            <Star size={24} fill="var(--primary)" stroke="var(--primary)" />
            {listing.reviews && listing.reviews.length > 0
              ? ` ${(listing.reviews.reduce((acc, rev) => acc + rev.rating, 0) / listing.reviews.length).toFixed(1)} • ${listing.reviews.length} reviews`
              : " New"}
          </h3>
        </div>

        <div className="reviews-grid">
          {listing.reviews?.map((rev) => (
            <div key={rev._id} className="review-bubble">
              <div className="review-user-info">
                <div className="small-avatar"><User size={18} /></div>
                <div>
                  <h4>{rev.author?.username || 'Guest'}</h4>
                  <p>{new Date(rev.createdAt).toLocaleDateString()}</p>
                </div>
                {(isAdmin || (user && rev.author && user._id === rev.author._id)) && (
                  <button onClick={() => handleReviewDelete(rev._id)} className="delete-rev"><Trash2 size={16} /></button>
                )}
              </div>
              <p className="rev-comment">{rev.comments}</p>
            </div>
          ))}
        </div>

        {user ? (
          <form onSubmit={handleReviewSubmit} className="add-review-form">
            <h4>Leave a Review</h4>
            <div className="rate-selector">
              <label>Rating</label>
              <select value={review.rating} onChange={e => setReview({ ...review, rating: e.target.value })}>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <textarea
              placeholder="How was your stay?"
              value={review.comments}
              onChange={e => setReview({ ...review, comments: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        ) : (
          <div className="login-to-review">
            <p>Please <Link to="/auth" state={{ from: location.pathname }} className="login-link-inline">login</Link> to leave a review.</p>
          </div>
        )}
      </div>

      <style>{`
        .listing-details-container {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .listing-card-main {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
        }

        .image-wrapper {
          width: 100%;
          height: 500px;
          padding: 20px;
        }

        .main-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 15px;
        }

        .listing-info-header {
          padding: 30px;
        }

        .title-price-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .listing-title {
          font-size: 32px;
          color: var(--primary);
          font-weight: 800;
          margin: 0;
        }

        .price-tag {
          font-size: 24px;
          font-weight: 700;
        }

        .price-tag .amount {
          color: #333;
        }

        .price-tag .per-night {
          font-size: 16px;
          color: #888;
          font-weight: 500;
        }

        .host-vcard {
          background: #fff5f7;
          border-radius: 12px;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          position: relative;
        }

        .vcard-avatar {
          width: 45px;
          height: 45px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          border: 2px solid #ffeef1;
        }

        .vcard-text {
          display: flex;
          flex-direction: column;
        }

        .host-name {
          font-weight: 700;
          font-size: 18px;
        }

        .listed-date {
          font-size: 13px;
          color: #888;
        }

        .heart-btn-round {
          margin-left: auto;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 1px solid #ffeef1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          background: white;
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-weight: 500;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
        }

        .pin-icon { color: #666; }

        .section-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 15px;
          color: #333;
        }

        .description-text {
          font-size: 16px;
          line-height: 1.7;
          color: #555;
          margin-bottom: 35px;
        }

        .amenities-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 40px;
        }

        .amenity-chip {
          background: #fff1f2;
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }

        .btn-secondary-outline {
          padding: 12px 24px;
          border-radius: 8px;
          background: #64748b;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-edit-action {
          padding: 12px 24px;
          border-radius: 8px;
          background: #3b82f6;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-book-now {
          padding: 12px 24px;
          border-radius: 8px;
          background: white;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          font-weight: 600;
          flex-grow: 1;
        }

        .location-map-card {
           background: white;
           border-radius: 20px;
           padding: 25px;
           box-shadow: 0 10px 30px rgba(0,0,0,0.05);
           border: 1px solid #f0f0f0;
        }

        .location-map-card h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .pink-icon { color: var(--primary); }

        .map-wrapper {
          height: 400px;
          width: 100%;
          border-radius: 15px;
          overflow: hidden;
          background: #eee;
        }

        .reviews-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }

        .review-bubble {
          border: 1px solid #f0f0f0;
          padding: 20px;
          border-radius: 15px;
        }

        .review-user-info {
           display: flex;
           align-items: center;
           gap: 12px;
           margin-bottom: 12px;
        }

        .small-avatar {
          width: 36px;
          height: 36px;
          background: #f8f9fa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aaa;
        }

        .review-user-info h4 { margin: 0; font-size: 15px; }
        .review-user-info p { margin: 0; font-size: 12px; color: #888; }

        .add-review-form {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #f0f0f0;
        }

        .rate-selector { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
        .rate-selector select { padding: 8px; border-radius: 5px; border: 1px solid #ddd; }

        .add-review-form textarea {
          width: 100%;
          height: 100px;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #ddd;
          margin-bottom: 15px;
          resize: none;
        }

        .login-to-review {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
          color: #666;
          font-size: 16px;
        }

        .login-link-inline {
          color: var(--primary);
          font-weight: 700;
          text-decoration: underline;
        }

        @media (max-width: 1000px) {
          .listing-title { font-size: 28px; }
          .image-wrapper { height: 400px; }
        }

        @media (max-width: 768px) {
          .reviews-grid { grid-template-columns: 1fr; }
          .action-buttons { flex-direction: column; }
          .listing-info-header { padding: 20px; }
          .listing-title { font-size: 24px; }
          .price-tag { font-size: 20px; }
          .amenities-grid { gap: 8px; }
          .amenity-chip { font-size: 13px; padding: 6px 12px; }
          .image-wrapper { height: 300px; padding: 10px; }
          .map-wrapper { height: 300px; }
        }

        @media (max-width: 480px) {
           .listing-details-container { padding: 0 10px; margin-top: 20px; }
           .listing-title { font-size: 20px; }
           .image-wrapper { height: 250px; }
        }
      `}</style>
    </div>
  )
}

export default ListingDetails;
