const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // EVENT
    // ==========================================

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // ==========================================
    // SEAT
    // ==========================================

    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },

    // ==========================================
    // TOTAL AMOUNT
    // ==========================================

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // BOOKING STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet"],
      default: "card",
    },

    // ==========================================
    // PAYMENT ID
    // ==========================================

    paymentId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Booking",
  bookingSchema
);