import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MapPin, Globe, Image as ImageIcon, IndianRupee } from 'lucide-react'

function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        price: '',
        location: '',
        country: '',
        upiId: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            const res = await axios.get(`/api/listings/${id}`);
            if (res.data.success) {
                const { title, description, image, price, location, country, upiId } = res.data.data;
                setFormData({ title, description, image, price, location, country, upiId });
            }
        } catch (err) {
            console.error("Error fetching listing", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`/api/listings/${id}`, formData);
            if (res.data.success) {
                sessionStorage.removeItem('allListings'); // Clear cache to force refresh on home page
                navigate(`/listings/${id}`);
            }
        } catch (err) {
            alert("Error updating listing. Make sure you are the owner.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="new-listing">
            <div className="form-container glass card">
                <h1>Edit your listing</h1>
                <p className="subtitle">Update the details of your destination.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            required
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-section">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            required
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-section">
                        <label>Image URL</label>
                        <div className="input-with-icon">
                            <ImageIcon size={20} className="icon" />
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-section">
                            <label>Price (per night)</label>
                            <div className="input-with-icon">
                                <IndianRupee size={20} className="icon" />
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <label>Country</label>
                            <div className="input-with-icon">
                                <Globe size={20} className="icon" />
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <label>Location</label>
                        <div className="input-with-icon">
                            <MapPin size={20} className="icon" />
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                required
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary submit-btn">Update Listing</button>
                </form>
            </div>

            <style>{`
        .new-listing {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }
        .form-container {
          width: 100%;
          max-width: 800px;
          padding: 60px;
          border-radius: var(--radius);
        }
        h1 { font-size: 36px; font-weight: 800; margin-bottom: 12px; color: var(--dark); }
        .subtitle { color: var(--light); margin-bottom: 32px; }
        .form-section { margin-bottom: 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        label { display: block; font-weight: 700; font-size: 14px; margin-bottom: 8px; color: var(--dark); }
        input, textarea {
          width: 100%;
          padding: 16px 20px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-family: inherit;
          font-size: 16px;
          transition: var(--transition);
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(255, 56, 92, 0.1);
        }
        textarea { height: 120px; resize: vertical; }
        .input-with-icon { position: relative; }
        .input-with-icon .icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--light);
        }
        .input-with-icon input { padding-left: 44px; }
        .submit-btn { width: 100%; height: 60px; justify-content: center; font-size: 18px; margin-top: 32px; }
      `}</style>
        </div>
    )
}

export default EditListing
