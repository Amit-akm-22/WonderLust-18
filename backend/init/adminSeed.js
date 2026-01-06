require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const DB_URL = process.env.mongoDB;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@wonderlust.com";
const ADMIN_USER = "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

async function seedAdmin() {
    try {
        await mongoose.connect(DB_URL);
        console.log("Connected to DB");

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("Admin already exists!");
            process.exit(0);
        }

        const newAdmin = new User({
            email: ADMIN_EMAIL,
            username: ADMIN_USER,
            isAdmin: true
        });

        await User.register(newAdmin, ADMIN_PASS);
        console.log("✅ Admin user created successfully!");
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Username: ${ADMIN_USER}`);
        console.log(`Password: ${ADMIN_PASS}`);

    } catch (err) {
        console.error("❌ Error creating admin:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seedAdmin();
