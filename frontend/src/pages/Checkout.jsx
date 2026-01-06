import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, CreditCard, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import qrLogo from '../assets/QR.png';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { listing } = location.state || {};
    const [status, setStatus] = useState('pending'); // pending, processing, success
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session

    useEffect(() => {
        if (!listing) {
            navigate('/');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [listing, navigate]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePaymentComplete = () => {
        setStatus('processing');
        setTimeout(() => {
            setStatus('success');
        }, 3000);
    };

    if (!listing) return null;

    const basePrice = listing.price;
    const serviceFee = Math.round(basePrice * 0.12);
    const tax = Math.round((basePrice + serviceFee) * 0.18);
    const totalPrice = basePrice + serviceFee + tax;

    return (
        <div className="checkout-page">
            <div className="container">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="checkout-grid">
                    {/* Left Side: Order Summary */}
                    <div className="order-details-card glass">
                        <header className="summary-header">
                            <h2>Confirm and pay</h2>
                            <p className="timer">Price guarantee expires in <span className="pink-text">{formatTime(timeLeft)}</span></p>
                        </header>

                        <div className="listing-brief">
                            <img src={listing.image} alt={listing.title} className="small-preview" />
                            <div className="brief-info">
                                <h3>{listing.title}</h3>
                                <p>{listing.location}, {listing.country}</p>
                            </div>
                        </div>

                        <div className="price-breakdown">
                            <div className="price-row">
                                <span>₹{basePrice.toLocaleString('en-IN')} x 1 night</span>
                                <span>₹{basePrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="price-row">
                                <span>Wonderlust service fee</span>
                                <span>₹{serviceFee.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="price-row">
                                <span>Taxes (GST)</span>
                                <span>₹{tax.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="price-row total-row">
                                <span>Total (INR)</span>
                                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="security-badges">
                            <div className="badge">
                                <ShieldCheck size={18} className="pink-text" />
                                <span>Secure payment</span>
                            </div>
                            <div className="badge">
                                <ShieldCheck size={18} className="pink-text" />
                                <span>Price guarantee</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Payment Methods */}
                    <div className="payment-action-card glass">
                        <AnimatePresence mode="wait">
                            {status === 'pending' && (
                                <motion.div
                                    key="pending"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="qr-section"
                                >
                                    <h3>Scan to pay via UPI</h3>
                                    <p>Open any UPI app like Google Pay, PhonePe, or Paytm to scan.</p>

                                    <div className="qr-container">
                                        <QRCodeSVG
                                            value={`upi://pay?pa=${listing.upiId || '6264677098@pthdfc'}&pn=Wonderlust&am=${totalPrice}&cu=INR`}
                                            size={220}
                                            level={"H"}
                                            includeMargin={true}
                                            className="qr-code-img"
                                        />
                                    </div>

                                    <div className="upi-apps">
                                        <div className="upi-icon gpay" style={{ backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_%28GPay%29_Logo.svg)' }}></div>
                                        <div className="upi-icon phonepe" style={{ backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/e/e1/PhonePe_Logo.svg)' }}></div>
                                        <div className="upi-icon paytm" style={{ backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg)' }}></div>
                                    </div>

                                    <button onClick={handlePaymentComplete} className="simulate-payment-btn" id="simulate-btn">
                                        Verify Transaction
                                    </button>
                                </motion.div>
                            )}

                            {status === 'processing' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="status-view"
                                >
                                    <Loader2 className="spinner rotate pink-text" size={60} />
                                    <h3>Verifying your payment...</h3>
                                    <p>Please do not close this window or refresh the page.</p>
                                </motion.div>
                            )}

                            {status === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="status-view"
                                >
                                    <CheckCircle size={80} className="success-icon" />
                                    <h2>Booking Confirmed!</h2>
                                    <p>Your stay at <strong>{listing.title}</strong> is secured.</p>
                                    <p className="conf-id">Confirmation ID: #WL-{Math.random().toString(36).substring(7).toUpperCase()}</p>

                                    <button onClick={() => navigate('/')} className="primary-btn mt-4">
                                        Go to My Trips
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .checkout-page {
                    padding: 40px 0 80px;
                    background: #fdfdfd;
                    min-height: 90vh;
                }
                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                    color: #555;
                    margin-bottom: 30px;
                }
                .checkout-grid {
                    display: grid;
                    grid-template-columns: 1fr 450px;
                    gap: 60px;
                }
                .order-details-card {
                    padding: 40px;
                    border-radius: 24px;
                }
                .summary-header h2 { font-size: 32px; font-weight: 800; margin-bottom: 5px; }
                .timer { font-weight: 600; color: #777; font-size: 15px; }
                
                .listing-brief {
                    display: flex;
                    gap: 20px;
                    margin: 40px 0;
                    padding-bottom: 30px;
                    border-bottom: 1px solid #eee;
                }
                .small-preview {
                    width: 120px;
                    height: 100px;
                    object-fit: cover;
                    border-radius: 16px;
                }
                .brief-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 5px; }
                .brief-info p { color: #777; font-size: 14px; }

                .price-breakdown {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .price-row {
                    display: flex;
                    justify-content: space-between;
                    color: #444;
                    font-weight: 500;
                }
                .total-row {
                    margin-top: 15px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 18px;
                    font-weight: 800;
                    color: #222;
                }

                .security-badges {
                    display: flex;
                    gap: 30px;
                    margin-top: 40px;
                }
                .badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #666;
                }

                .payment-action-card {
                    padding: 40px;
                    border-radius: 24px;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
                }
                .qr-section h3 { font-size: 22px; font-weight: 800; margin-bottom: 10px; }
                .qr-section p { font-size: 14px; color: #777; margin-bottom: 30px; }
                
                .qr-container {
                    position: relative;
                    display: inline-block;
                    padding: 20px;
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border: 1px solid #f0f0f0;
                }
                .qr-code-img {
                    width: 100%;
                    max-width: 220px;
                    height: auto;
                    border-radius: 12px;
                }

                .upi-apps {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 30px;
                }
                .upi-icon {
                    width: 40px;
                    height: 40px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    opacity: 0.6;
                }
                
                .simulate-payment-btn {
                    width: 100%;
                    margin-top: 40px;
                    padding: 16px;
                    border-radius: 16px;
                    background: #222;
                    color: white;
                    font-weight: 700;
                    transition: var(--transition);
                }
                .simulate-payment-btn:hover {
                    background: #000;
                    transform: translateY(-2px);
                }

                .status-view {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 0;
                }
                .spinner.rotate {
                    animation: spin 2s linear infinite;
                    margin-bottom: 25px;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .success-icon {
                    color: #4ade80;
                    margin-bottom: 25px;
                }
                .conf-id {
                    background: #f0fdf4;
                    color: #166534;
                    padding: 8px 16px;
                    border-radius: 10px;
                    margin-top: 20px;
                    font-family: monospace;
                    font-weight: 700;
                }

                @media (max-width: 1100px) {
                    .checkout-grid {
                        grid-template-columns: 1fr;
                        gap: 30px;
                    }
                    .payment-action-card {
                        order: -1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Checkout;
