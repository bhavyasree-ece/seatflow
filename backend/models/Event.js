const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    venue: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    // Kept for compatibility with your existing frontend
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Category-wise pricing
    pricing: {
      Premium: {
        type: Number,
        required: true,
        min: 0,
        default: 500,
      },

      Standard: {
        type: Number,
        required: true,
        min: 0,
        default: 300,
      },
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "upcoming",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);