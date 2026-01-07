import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'

// --- CRITICAL AXIOS CONFIGURATION (Must be at the very top) ---

// 1. Set Base URL
// In development, empty string uses Vite proxy (localhost:5173 -> localhost:8080)
// In production, it uses the provided API URL.
axios.defaults.baseURL = import.meta.env.MODE === 'development' ? '' : (import.meta.env.VITE_API_URL || '');

// 2. Token Sync Utility (Ensures 'token' and 'user' keys are consistent)
const syncTokens = () => {
    let token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token && storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed.token) {
                localStorage.setItem('token', parsed.token);
                token = parsed.token;
            }
        } catch (e) {
            console.error("Main: Failed to sync token from user object", e);
        }
    }
    return token;
};

// 3. Request Interceptor
axios.interceptors.request.use(
    (config) => {
        const token = syncTokens();
        if (token) {
            console.log(`[Axios Request] Attaching token to ${config.url}`);
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 4. Response Interceptor (Catch 401s globally)
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the server returns 401 Unauthorized or 403 Forbidden
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const currentPath = window.location.pathname;

            // Avoid clearing state if we are already on the Auth page to prevent loops
            if (currentPath !== '/auth') {
                console.warn(`[Axios Response] Unauthorized/Forbidden at ${error.config.url}. Clearing state.`);
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Notify the rest of the app to clear state immediately
                window.dispatchEvent(new Event('auth-failure'));
            }
        }
        return Promise.reject(error);
    }
);

// --- RENDER APP ---

// CRITICAL: Hardcoding Client ID to bypass scrambled .env files
const GOOGLE_CLIENT_ID = "515420019164-ceijanqgk97lp75kraepoak0jsfpvaud.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
