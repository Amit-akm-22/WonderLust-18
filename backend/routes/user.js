const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");

// Google Auth route
router.post("/google", wrapAsync(async (req, res) => {
  const { token } = req.body;

  try {
    // Fetch user info from Google using access token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const { name, email, picture } = await response.json();

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create a unique username from email
      const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      user = new User({
        email,
        username,
        isAdmin: email === process.env.ADMIN_EMAIL || email === "admin@wonderlust.com",
        // For passport-local-mongoose, we don't need a password for social login users
      });
      await user.save();
    }

    // Log the user in
    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ success: false, message: "Login failed" });
      res.status(200).json({ success: true, user });
    });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(400).json({ success: false, message: "Invalid Google token" });
  }
}));

// Registration route
router.post("/signup", wrapAsync(async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const isAdmin = email === "admin@wonderlust.com";;
    const newUser = new User({ email, username, isAdmin });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Login failed after registration" });
      }
      res.status(201).json({ success: true, message: "Registered successfully!", user: registeredUser });
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

    req.logIn(user, (err) => {
      if (err) {
        console.error("req.logIn Error:", err);
        return next(err);
      }
      console.log("Login Successful:", user.username);
      return res.status(200).json({ success: true, message: `Welcome back, ${user.username}!`, user });
    });
  })(req, res, next);
}));

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

// Status check route
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;
