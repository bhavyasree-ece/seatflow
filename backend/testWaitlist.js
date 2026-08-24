require("dotenv").config();

const mongoose = require("mongoose");
const Seat = require("./models/Seat");

const EVENT_ID = "6a89d70b506b86f7f00ef7aa";

async function makePremiumSoldOut() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const result = await Seat.updateMany(
      {
        event: EVENT_ID,
        category: "Premium",
        status: "available",
      },
      {
        $set: {
          status: "booked",
          lockedBy: null,
          lockedUntil: null,
          bookedBy: null,
        },
      }
    );

    console.log(
      `Changed ${result.modifiedCount} Premium seats to booked`
    );

    const remaining = await Seat.countDocuments({
      event: EVENT_ID,
      category: "Premium",
      status: "available",
    });

    console.log(
      `Remaining Premium seats: ${remaining}`
    );

    await mongoose.disconnect();

    console.log("Done");
  } catch (error) {
    console.error(
      "Test error:",
      error.message
    );

    process.exit(1);
  }
}

makePremiumSoldOut();