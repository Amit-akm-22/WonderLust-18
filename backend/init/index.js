const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Listing = require(path.join(__dirname, "../models/listing.js"));
const initdata = require(path.join(__dirname, "data.js"));

const DB_URL = "mongodb+srv://amitakm18_db_user:VmnHq2TYYT2M269C@cluster0.nwxtt7a.mongodb.net/?appName=Cluster0";
console.log("Using hardcoded local database URL");

async function initializeDatabase() {
  if (!DB_URL) {
    console.error("❌ Error: mongoDB environment variable is not defined!");
    return;
  }
  try {
    await mongoose.connect(DB_URL);
    console.log("🗄️ Database connected successfully");

    // Clear existing data
    const deleteResult = await Listing.deleteMany({});
    console.log(`♻️ Cleared ${deleteResult.deletedCount} existing listings`);

    // Transform data - including adding owner field (dummy ID for initial seed)
    const transformedData = initdata.data.map((item) => ({
      ...item,
      owner: "67ea3be7602de8000ec1bdac", // Default owner ID
      image: typeof item.image === "object" ? item.image.url : item.image,
    }));

    // Insert new data
    const insertedListings = await Listing.insertMany(transformedData);
    console.log(`✅ Successfully inserted ${insertedListings.length} listings`);
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

initializeDatabase();
