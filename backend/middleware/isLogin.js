const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

const { authenticateToken } = require("./auth");

module.exports.isLoggedIn = authenticateToken;

module.exports.isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (!req.user.isAdmin && !listing.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "You don't have permission to do that" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (!req.user.isAdmin && !review.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this review" });
    }

    next();
  } catch (err) {
    next(err);
  }
};
