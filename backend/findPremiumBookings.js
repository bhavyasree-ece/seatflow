require("dotenv").config();

const mongoose = require("mongoose");

const Booking = require("./models/Booking");
const User = require("./models/User");
const Seat = require("./models/Seat");
const Event = require("./models/Event");

const EVENT_ID = "6a89d70b506b86f7f00ef7aa";

async function findPremiumBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected\n");

    const bookings = await Booking.find({
      event: EVENT_ID,
      status: "confirmed",
    })
      .populate("user", "name email")
      .populate("seat", "seatNumber category status")
      .populate("event", "title");

    const premiumBookings = bookings.filter(
      (booking) =>
        booking.seat &&
        booking.seat.category === "Premium"
    );

    if (premiumBookings.length === 0) {
      console.log("No confirmed Premium bookings found.");
    } else {
      console.log("Confirmed Premium bookings:\n");

      premiumBookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1}`);
        console.log("Booking ID:", booking._id);
        console.log("Customer:", booking.user?.name);
        console.log("Email:", booking.user?.email);
        console.log("Seat:", booking.seat?.seatNumber);
        console.log("Seat status:", booking.seat?.status);
        console.log("-----------------------------");
      });
    }

    await mongoose.disconnect();

    console.log("\nDone.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

findPremiumBookings();