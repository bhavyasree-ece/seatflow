const mongoose = require("mongoose");
require("dotenv").config();

const Seat = require("./models/Seat");

const updateSeatCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const premiumResult = await Seat.updateMany(
      {
        row: {
          $in: ["A", "B", "C"],
        },
      },
      {
        $set: {
          category: "Premium",
        },
      }
    );

    const standardResult = await Seat.updateMany(
      {
        row: {
          $in: ["D", "E", "F", "G", "H", "I", "J"],
        },
      },
      {
        $set: {
          category: "Standard",
        },
      }
    );

    console.log(
      `Premium seats updated: ${premiumResult.modifiedCount}`
    );

    console.log(
      `Standard seats updated: ${standardResult.modifiedCount}`
    );

    await mongoose.disconnect();

    console.log("Seat categories updated successfully");
  } catch (error) {
    console.error("Error updating seat categories:");
    console.error(error.message);

    process.exit(1);
  }
};

updateSeatCategories();