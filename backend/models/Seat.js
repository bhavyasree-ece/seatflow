const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },

    row: {
      type: String,
      required: true,
      trim: true,
    },

    seatIndex: {
      type: Number,
      required: true,
    },

    // ==========================================
    // SEAT CATEGORY
    // ==========================================

    category: {
      type: String,
      enum: ["Premium", "Standard"],
      default: "Standard",
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },

    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index(
  {
    event: 1,
    seatNumber: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Seat", seatSchema);