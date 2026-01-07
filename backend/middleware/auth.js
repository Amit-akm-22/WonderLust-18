const jwt = require("jsonwebtoken");
const User = require("../models/user");
// CRITICAL: Must match the secret in user.js
const JWT_SECRET = "wonderlust_ultimate_auth_secret_2026_safe_secure_stateless_jwt";

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[AuthMW] Request: ${req.method} ${req.originalUrl} | Token present: ${!!token}`);

    if (!token) {
        console.warn(`[AuthMW] No token for ${req.originalUrl}`);
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-salt -hash");

        if (!user) {
            console.error(`[AuthMW] User not found for ID: ${decoded.id}`);
            return res.status(401).json({ success: false, message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error(`[AuthMW] JWT Error for ${req.originalUrl}: ${err.message}`);
        return res.status(403).json({ success: false, message: "Token is invalid or expired" });
    }
};

module.exports = { authenticateToken };
