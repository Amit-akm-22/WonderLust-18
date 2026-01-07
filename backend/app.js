const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cors = require("cors");
require('dotenv').config();

// MongoDB URL from environment variable
const LiveURL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/Wonderlust";

// Import models
const User = require("./models/user.js");

// Import routes
const listingRoutes = require("./routes/listing");
const reviewRoutes = require("./routes/reviews");
const UserRoutes = require("./routes/user");
const likedListingsRoutes = require("./routes/likedListings");

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://wonder-lust-18.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Debug Route
app.get("/api/debug/headers", (req, res) => {
  res.json({ headers: req.headers, auth: req.headers.authorization });
});

app.set("trust proxy", 1);

// Set security headers (Vite handles this in dev, Vercel/Render in prod)
app.use((req, res, next) => {
  // We remove the strict COOP header from API to avoid blocking Google popups on frontend
  // res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// JWT Authentication - stateless, no session needed
app.use(passport.initialize());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Database Connection
async function main() {
  try {
    await mongoose.connect(LiveURL);
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}
main();

// Mount routes
app.use("/api/listings", listingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/liked", likedListingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).json({ success: false, message });
});

// Server Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
