require("dotenv").config();

const mongoose = require("mongoose");
const Waitlist = require("./models/Waitlist");

const EVENT_ID = "6a89d70b506b86f7f00ef7aa";

async function clearPremiumWaitlist() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const result = await Waitlist.deleteMany({
      eventId: EVENT_ID,
      seatCategory: "Premium",
    });

    console.log(
      `Deleted ${result.deletedCount} Premium waitlist entries`
    );

    await mongoose.disconnect();

    console.log("Premium waitlist cleared successfully");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

clearPremiumWaitlist();