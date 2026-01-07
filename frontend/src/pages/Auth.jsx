import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Mail, Lock, User, ArrowRight, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Moving images for the left side
    const images = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=1000"
    ];
    const [currentImg, setCurrentImg] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImg((prev) => (prev + 1) % images.length);
        }, 5000);

        // Disable global scroll for clean non-scrolling page
        document.body.style.overflow = 'hidden';

        return () => {
            clearInterval(interval);
            document.body.style.overflow = 'auto'; // Re-enable on unmount
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            console.log("Google Login Success, credential received");
            const res = await axios.post('/api/users/google', { idToken: credentialResponse.credential });
            if (res.data.success) {
                const userData = { ...res.data.user, token: res.data.token };
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', res.data.token);
                onLogin();
                const from = location.state?.from || '/';
                navigate(from);
            }
        } catch (err) {
            console.error("Google Auth Error:", err);
            setError("Google authentication failed. Please try again.");
        }
    };

    const handleGoogleError = (err) => {
        console.error("Google Auth Component Error:", err);
        setError(
            <div className="google-origin-error" style={{ border: '2px solid #e53e3e', padding: '15px', borderRadius: '12px', background: '#fff' }}>
                <strong style={{ color: '#e53e3e', fontSize: '16px', display: 'block', marginBottom: '8px' }}>Google Login Blocked! 🛑</strong>
                <p>Google is blocking the login because <strong>localhost:5173</strong> is not authorized yet.</p>
                <div style={{ marginTop: '12px', padding: '15px', background: '#fef2f2', borderRadius: '12px', border: '2px dashed #ef4444' }}>
                    <p style={{ fontWeight: '800', fontSize: '14px', marginBottom: '8px', color: '#b91c1c' }}>REQUIRED ACTION:</p>
                    <ol style={{ textAlign: 'left', fontSize: '13px', marginLeft: '20px', color: '#444', lineHeight: '1.5' }}>
                        <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>Google Cloud Console</a></li>
                        <li>Click on your <strong>OAuth 2.0 Client ID</strong></li>
                        <li>Under <strong>"Authorized JavaScript origins"</strong>, add:
                            <div style={{ margin: '5px 0', padding: '5px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <code>http://localhost:5173</code><br />
                                <code>http://127.0.0.1:5173</code>
                            </div>
                        </li>
                        <li>Click <strong>SAVE</strong> and wait 2 minutes</li>
                        <li><strong>Refresh</strong> this page and try again!</li>
                    </ol>
                </div>
            </div>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/users/login' : '/api/users/signup';
        try {
            const res = await axios.post(endpoint, formData);
            if (res.data.success) {
                const userData = { ...res.data.user, token: res.data.token };
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', res.data.token); // Still keep 'token' for backward compat
                onLogin();
                // Redirect back to original target if exists
                const from = location.state?.from || '/';
                navigate(from);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed");
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-mega-card">
                {/* Left Side: Moving Hotel Images */}
                <div className="auth-visual-side">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentImg}
                            className="bg-img-slide"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 1.5 }}
                            style={{ backgroundImage: `url(${images[currentImg]})` }}
                        />
                    </AnimatePresence>
                    <div className="visual-overlay">
                        <div className="overlay-content">
                            <MapPin size={40} className="mb-4" />
                            <h1>Journey to the most beautiful places</h1>
                            <p>Join over 1 million travelers exploring the world with Wonderlust.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Credentials */}
                <div className="auth-form-side">
                    <div className="auth-form-container">
                        <div className="auth-tabs-premium">
                            <button
                                className={isLogin ? 'active' : ''}
                                onClick={() => setIsLogin(true)}
                            >
                                Sign In
                            </button>
                            <button
                                className={!isLogin ? 'active' : ''}
                                onClick={() => setIsLogin(false)}
                            >
                                Create Account
                            </button>
                        </div>

                        <header className="form-head">
                            <h2>{isLogin ? 'Welcome back' : 'Start your journey'}</h2>
                            <p>{isLogin ? 'Please enter your details to sign in.' : 'Get started by creating your account.'}</p>
                        </header>

                        {error && <div className="error-alert">{error}</div>}

                        <form onSubmit={handleSubmit} className="premium-form">
                            {!isLogin && (
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <div className="field-box">
                                        <Mail size={18} className="field-icon" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="alex@example.com"
                                            required
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label>{isLogin ? 'Username or Email' : 'Username'}</label>
                                <div className="field-box">
                                    <User size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder={isLogin ? 'alex_explorer' : 'alex_explorer'}
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <div className="field-box">
                                    <Lock size={18} className="field-icon" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={20} />
                            </button>
                        </form>

                        <div className="google-divider">
                            <span>OR</span>
                        </div>

                        <div className="google-auth-box">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="filled_blue"
                                shape="pill"
                                width="380"
                                text={isLogin ? 'signin_with' : 'signup_with'}
                            />
                        </div>

                        <p className="switch-footer">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? 'Register now' : 'Login here'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .auth-page-container {
                    padding: 40px 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #fdfdfd;
                    min-height: calc(100vh - 80px); 
                    overflow: hidden;
                }

                .auth-mega-card {
                    display: flex;
                    width: 100%;
                    max-width: 1250px;
                    height: 85vh;
                    max-height: 800px;
                    background: white;
                    border-radius: 40px;
                    overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.12);
                    border: 1px solid #f0f0f0;
                }

                .auth-visual-side {
                    flex: 1.1;
                    position: relative;
                    overflow: hidden;
                    background: #111;
                }

                .bg-img-slide {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                }

                .visual-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.7) 20%, transparent 70%);
                    display: flex;
                    align-items: flex-end;
                    padding: 50px;
                    color: white;
                }

                .overlay-content h1 {
                    font-size: 38px;
                    font-weight: 800;
                    max-width: 400px;
                    line-height: 1.2;
                    margin-bottom: 15px;
                }

                .overlay-content p {
                    font-size: 16px;
                    opacity: 0.9;
                    font-weight: 500;
                }

                .auth-form-side {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start; /* Start from top to handle scroll better */
                    padding: 40px 30px;
                    background: white;
                    overflow-y: auto;
                    height: 100%;
                }

                /* Custom scrollbar for form side */
                .auth-form-side::-webkit-scrollbar {
                    width: 6px;
                }
                .auth-form-side::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .auth-form-side::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 10px;
                }
                .auth-form-side::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                }

                .auth-form-container {
                    width: 100%;
                    max-width: 380px;
                    margin: auto 0; /* Centers vertically but allows scrolling from top */
                    padding: 20px 0;
                }

                .auth-tabs-premium {
                    display: flex;
                    gap: 24px;
                    margin-bottom: 30px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .auth-tabs-premium button {
                    font-weight: 700;
                    font-size: 16px;
                    color: #aaa;
                    padding-bottom: 12px;
                    position: relative;
                    transition: var(--transition);
                }

                .auth-tabs-premium button.active {
                    color: var(--primary);
                }

                .auth-tabs-premium button.active:after {
                    content: '';
                    position: absolute;
                    bottom: -1.5px;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: var(--primary);
                    border-radius: 10px;
                }

                .form-head h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; color: #222; }
                .form-head p { color: #888; font-size: 15px; margin-bottom: 35px; font-weight: 500; }

                .input-group { margin-bottom: 22px; }
                .input-group label { display: block; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; color: #666; }

                .field-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .field-icon {
                    position: absolute;
                    left: 18px;
                    color: #bbb;
                    transition: var(--transition);
                }

                .field-box input {
                    width: 100%;
                    padding: 16px 16px 16px 52px;
                    border: 2px solid #f5f5f5;
                    border-radius: 16px;
                    font-size: 15px;
                    font-family: inherit;
                    background: #fcfcfc;
                    transition: all 0.3s ease;
                }

                .field-box input:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: white;
                    box-shadow: 0 8px 20px rgba(255, 56, 92, 0.05);
                }
                
                .field-box input:focus + .field-icon {
                    color: var(--primary);
                }

                .auth-submit-btn {
                    width: 100%;
                    height: 60px;
                    background: var(--primary);
                    color: white;
                    border-radius: 16px;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 35px;
                    box-shadow: 0 12px 25px rgba(255, 56, 92, 0.2);
                    transition: all 0.3s ease;
                }

                .auth-submit-btn:hover {
                    background: var(--primary-hover);
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px rgba(255, 56, 92, 0.3);
                }

                .error-alert {
                    background: #fff5f5;
                    color: #e53e3e;
                    padding: 14px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    font-size: 14px;
                    font-weight: 600;
                    border-left: 4px solid #e53e3e;
                }

                .switch-footer {
                    margin-top: 35px;
                    text-align: center;
                    font-size: 14px;
                    color: #888;
                    font-weight: 500;
                }

                .switch-footer button {
                    color: var(--primary);
                    font-weight: 700;
                    margin-left: 6px;
                    transition: var(--transition);
                }
                
                .switch-footer button:hover {
                    text-decoration: underline;
                    opacity: 0.8;
                }

                .google-divider {
                    display: flex;
                    align-items: center;
                    margin: 25px 0;
                    color: #ccc;
                    font-size: 13px;
                    font-weight: 700;
                }
                .google-divider::before, .google-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #eee;
                }
                .google-divider span {
                    margin: 0 15px;
                }
                .google-auth-box {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                
                .google-custom-btn {
                    width: 100%;
                    height: 56px;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #444;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .google-custom-btn:hover {
                    background: #f8f8f8;
                    border-color: #d0d0d0;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
                }

                @media (max-width: 1000px) {
                    .auth-visual-side { display: none; }
                    .auth-mega-card { max-width: 500px; }
                }

                @media (max-width: 600px) {
                    .auth-page-container { padding: 40px 15px; }
                    .auth-form-side { padding: 30px; }
                    .form-head h2 { font-size: 26px; }
                }
            `}</style>
        </div>
    )
}

export default Auth
