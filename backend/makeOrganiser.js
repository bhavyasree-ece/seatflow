const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const ORGANISER_EMAIL = "gaganbhavya.1985@gmail.com";

async function makeOrganiser() {
  try {
    // Get MongoDB URL
    const MONGO_URI =
      process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!MONGO_URI) {
      console.error(
        "ERROR: MONGO_URI or MONGODB_URI is missing in .env"
      );
      process.exit(1);
    }

    // Connect MongoDB
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected.");

    // Find organiser account
    const user = await User.findOne({
      email: ORGANISER_EMAIL.toLowerCase(),
    });

    if (!user) {
      console.log(
        `No user found with email: ${ORGANISER_EMAIL}`
      );

      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("User found:");
    console.log("ID:", user._id.toString());
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Current role:", user.role);

    // Change ONLY the role
    user.role = "organiser";

    await user.save();

    console.log("--------------------------------");
    console.log("SUCCESS!");
    console.log("Organiser role updated.");
    console.log("Email:", user.email);
    console.log("New role:", user.role);
    console.log("--------------------------------");

    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
  } catch (error) {
    console.error("Error:", error.message);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

makeOrganiser();