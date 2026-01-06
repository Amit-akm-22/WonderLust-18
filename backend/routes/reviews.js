const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware/isLogin.js");
const wrapAsync = require("../utils/wrapAsync.js");

// Add a review - POST /api/reviews/:id/review
router.post("/:id/review", isLoggedIn, wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }
  const newReview = new Review(req.body);
  newReview.author = req.user._id;

  listing.reviews.push(newReview);
  await Promise.all([listing.save(), newReview.save()]);

  res.status(201).json({ success: true, message: "Review added!", data: newReview });
}));

// Delete a review - DELETE /api/reviews/:id/reviews/:reviewId
router.delete("/:id/reviews/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;

  await Review.findByIdAndDelete(reviewId);
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

  res.status(200).json({ success: true, message: "Review deleted!" });
}));

module.exports = router;
