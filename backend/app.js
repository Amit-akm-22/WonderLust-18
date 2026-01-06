const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
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
    "https://wonder-lust-18.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));


// Session configuration
const store = MongoStore.create({
  mongoUrl: LiveURL,
  touchAfter: 24 * 60 * 60,
});

store.on("error", (err) => {
  console.log("Session store error:", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "lax", // Good for local dev with credentials
  },
};

// Middleware
app.use(express.json()); // Essential for MERN stack to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global variables middleware (Simplified for API)
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

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

