const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ListingController = require("../controllers/listings.js");
const { isLoggedIn, isOwner } = require("../middleware/isLogin.js");

// Index - GET /api/listings
router.get("/", wrapAsync(ListingController.index));

// Create listing - POST /api/listings
router.post("/", isLoggedIn, wrapAsync(ListingController.createListing));

// Show listing - GET /api/listings/:id
router.get("/:id", wrapAsync(ListingController.showListing));

// Like listing - GET /api/listings/:id/like
router.get("/:id/like", isLoggedIn, wrapAsync(ListingController.likedListing));

// Update listing - PUT /api/listings/:id
router.put("/:id", isLoggedIn, isOwner, wrapAsync(ListingController.updateListing));

// Delete listing - DELETE /api/listings/:id
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(ListingController.deleteListing));

module.exports = router;
