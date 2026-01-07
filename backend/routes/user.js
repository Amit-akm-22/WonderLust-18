const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');

// CRITICAL: Hardcoding Client ID to bypass scrambled .env files
const GOOGLE_CLIENT_ID = "515420019164-ceijanqgk97lp75kraepoak0jsfpvaud.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// CRITICAL: Hardcoding a consistent secret to prevent 401/403 errors due to .env mismatches
const JWT_SECRET = "wonderlust_ultimate_auth_secret_2026_safe_secure_stateless_jwt";
const { authenticateToken } = require("../middleware/auth");

// Google Auth route - Handles ID Token verification
router.post("/google", wrapAsync(async (req, res) => {
  const { idToken } = req.body;

  console.log("[GoogleAuth] Received request. Token present:", !!idToken);
  console.log("[GoogleAuth] Using Client ID for verification:", GOOGLE_CLIENT_ID);

  try {
    // Verify the ID Token from the frontend
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("[GoogleAuth] Token verified. User email:", payload.email);

    const { sub, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account does not have an email" });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create a unique username from email
      const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      user = new User({
        email,
        username,
        isAdmin: email === process.env.ADMIN_EMAIL || email === "admin@wonderlust.com",
      });
      await user.save();
    }

    // Generate our JWT
    const tokenJWT = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    console.log("Google Login - JWT Generated for:", user.username);
    res.status(200).json({
      success: true,
      token: tokenJWT,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    console.error("Google Auth Token Verification Error:", err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
}));

// Registration route
router.post("/signup", wrapAsync(async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const isAdmin = email === "admin@wonderlust.com";;
    const newUser = new User({ email, username, isAdmin });
    const registeredUser = await User.register(newUser, password);

    // Generate JWT token
    const tokenJWT = jwt.sign({ id: registeredUser._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: "Registered successfully!",
      token: tokenJWT,
      user: {
        _id: registeredUser._id,
        username: registeredUser.username,
        email: registeredUser.email,
        isAdmin: registeredUser.isAdmin
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}));

// Login route
router.post("/login", wrapAsync(async (req, res, next) => {
  console.log("LOGIN ATTEMPT:", req.body);
  let { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  // If the user provided an email instead of a username, find the actual username
  if (username.includes("@")) {
    console.log("Email detected, searching for username...");
    try {
      const userByEmail = await User.findOne({ email: username });
      if (userByEmail) {
        console.log(`Found user: ${userByEmail.username}`);
        username = userByEmail.username;
      } else {
        console.log("No user found with this email");
      }
    } catch (dbErr) {
      console.error("DB error during email lookup:", dbErr);
    }
  }

  // Use the (possibly updated) username for passport authentication
  req.body.username = username;

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Passport Auth Error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login failed:", info ? info.message : "No info");
      return res.status(401).json({ success: false, message: info?.message || "Login failed" });
    }

    // Generate JWT token
    const tokenJWT = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    console.log("Login - JWT Generated for:", user.username);
    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token: tokenJWT,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  })(req, res, next);
}));

// Logout route - For JWT, this is handled on the client by deleting the token
router.get("/logout", (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully (Clear your token on client)" });
});

// Status check route - Now verifies JWT token
router.get("/status", authenticateToken, (req, res) => {
  res.json({ isAuthenticated: true, user: req.user });
});

module.exports = router;
