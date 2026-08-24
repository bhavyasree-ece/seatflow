const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // Waitlist is maintained per seat category
    // Example: Premium, Standard
    seatCategory: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "notified",
        "booked",
        "cancelled",
        "expired",
      ],
      default: "waiting",
    },

    position: {
      type: Number,
      required: true,
    },

    // When the customer was notified
    notifiedAt: {
      type: Date,
      default: null,
    },

    // Time until which the customer can accept
    offerExpiresAt: {
      type: Date,
      default: null,
    },

    // Seat offered to the customer
    offeredSeat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

waitlistSchema.index({
  eventId: 1,
  seatCategory: 1,
  position: 1,
});

module.exports = mongoose.model("Waitlist", waitlistSchema);