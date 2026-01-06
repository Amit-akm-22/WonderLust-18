const Listing = require("../models/listing.js");
const User = require("../models/user.js");

module.exports = {
  // Index - List all listings
  index: async (req, res) => {
    try {
      const allListings = await Listing.find({}).sort({ _id: -1 });
      res.status(200).json({ success: true, data: allListings });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error loading listings" });
    }
  },

  // Create a new listing
  createListing: async (req, res) => {
    try {
      const newListing = new Listing(req.body);
      newListing.owner = req.user._id;
      await newListing.save();
      res.status(201).json({ success: true, message: "Listing created!", data: newListing });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Show a specific listing
  showListing: async (req, res) => {
    try {
      const listing = await Listing.findById(req.params.id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
      if (!listing) {
        return res.status(404).json({ success: false, message: "Listing not found" });
      }
      res.status(200).json({ success: true, data: listing });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error fetching listing" });
    }
  },

  // Update a listing
  updateListing: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedListing = await Listing.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedListing) {
        return res.status(404).json({ success: false, message: "Listing not found" });
      }
      res.status(200).json({ success: true, message: "Listing updated!", data: updatedListing });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Delete a listing
  deleteListing: async (req, res) => {
    try {
      const { id } = req.params;
      const listing = await Listing.findById(id);
      if (!listing) {
        return res.status(404).json({ success: false, message: "Listing not found" });
      }
      if (!listing.owner.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
      await Listing.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Listing deleted!" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error deleting listing" });
    }
  },

  // Add listing to user's liked listings
  likedListing: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const listing = await Listing.findById(id);
      if (!listing) {
        return res.status(404).json({ success: false, message: "Listing not found" });
      }

      const user = await User.findById(userId);
      if (user.likedListing.includes(id)) {
        return res.status(400).json({ success: false, message: "Already liked" });
      }

      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { likedListing: id } },
        { new: true }
      );

      res.status(200).json({ success: true, message: "Added to liked listings!" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  },
};
