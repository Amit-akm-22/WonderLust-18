const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/isLogin");
const wrapAsync = require("../utils/wrapAsync.js");

// Route to get liked listings for the current user
router.get("/liked-listings", isLoggedIn, wrapAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "likedListing",
    populate: { path: "owner" },
  });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({ success: true, data: user.likedListing });
}));

// Route to toggle like/unlike a listing
router.post("/:id/toggle-like", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const isLiked = user.likedListing.includes(id);

  if (isLiked) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { likedListing: id } });
    res.status(200).json({ success: true, message: "Removed from liked listings", liked: false });
  } else {
    await User.findByIdAndUpdate(req.user._id, { $push: { likedListing: id } });
    res.status(200).json({ success: true, message: "Added to liked listings", liked: true });
  }
}));

module.exports = router;
