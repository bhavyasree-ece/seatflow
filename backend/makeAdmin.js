const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const ADMIN_EMAIL = "gbhavyasree2006@gmail.com";

async function makeAdmin() {
  try {
    const MONGO_URI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (!MONGO_URI) {
      console.error(
        "ERROR: MONGO_URI or MONGODB_URI is missing in .env"
      );
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected.");

    const user = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase(),
    });

    if (!user) {
      console.log(
        `No user found with email: ${ADMIN_EMAIL}`
      );

      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("User found:");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Current role:", user.role);

    user.role = "admin";

    await user.save();

    console.log("--------------------------------");
    console.log("SUCCESS!");
    console.log("Admin role updated.");
    console.log("Email:", user.email);
    console.log("New role:", user.role);
    console.log("--------------------------------");

    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
  } catch (error) {
    console.error(
      "Error:",
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

makeAdmin();