const express = require("express");

const Seat = require("../models/Seat");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const {
  generateSeats,
} = require("../services/seatService");

const router = express.Router();

// ==========================================
// CONFIGURATION
// ==========================================

// 10 minute seat hold
const HOLD_DURATION_MS =
  10 * 60 * 1000;

// ==========================================
// GENERATE SEATS FOR AN EVENT
// ==========================================

router.post(
  "/generate/:eventId",
  protect,
  authorizeRoles("organiser", "admin"),
  async (req, res) => {
    try {
      const result =
        await generateSeats(
          req.params.eventId
        );

      const seats = result.seats;

      // --------------------------------------
      // ALREADY GENERATED
      // --------------------------------------

      if (result.alreadyGenerated) {
        return res.status(200).json({
          success: true,
          alreadyGenerated: true,
          message:
            "Seats have already been generated for this event",
          count: seats.length,
          seats,
        });
      }

      // --------------------------------------
      // NEWLY GENERATED
      // --------------------------------------

      return res.status(201).json({
        success: true,
        alreadyGenerated: false,
        message:
          "Seats generated successfully",
        count: seats.length,
        seats,
      });

    } catch (error) {
      console.error(
        "Generate seats error:",
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET ALL SEATS FOR AN EVENT
// ==========================================

router.get(
  "/event/:eventId",
  async (req, res) => {
    try {
      const seats = await Seat.find({
        event: req.params.eventId,
      }).sort({
        row: 1,
        seatIndex: 1,
      });

      return res.json({
        success: true,
        count: seats.length,
        seats,
      });

    } catch (error) {
      console.error(
        "Get seats error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get seats",
        error: error.message,
      });
    }
  }
);

// ==========================================
// HOLD A SEAT
// ==========================================

router.post(
  "/hold/:seatId",
  protect,
  async (req, res) => {
    try {
      const { seatId } = req.params;

      const now = new Date();

      const lockedUntil = new Date(
        now.getTime() +
          HOLD_DURATION_MS
      );

      // --------------------------------------
      // ATOMIC SEAT HOLD
      // --------------------------------------

      const seat =
        await Seat.findOneAndUpdate(
          {
            _id: seatId,

            $or: [
              {
                status: "available",
              },
              {
                status: "locked",
                lockedUntil: {
                  $lte: now,
                },
              },
            ],
          },
          {
            $set: {
              status: "locked",
              lockedBy: req.user.id,
              lockedUntil:
                lockedUntil,
            },
          },
          {
            new: true,
          }
        );

      // --------------------------------------
      // SEAT COULD NOT BE HELD
      // --------------------------------------

      if (!seat) {
        const existingSeat =
          await Seat.findById(
            seatId
          );

        if (!existingSeat) {
          return res.status(404).json({
            success: false,
            message:
              "Seat not found",
          });
        }

        if (
          existingSeat.status ===
          "booked"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Seat is already booked",
          });
        }

        if (
          existingSeat.status ===
          "locked"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Seat is currently held by another customer",
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "Seat is not available",
        });
      }

      // --------------------------------------
      // SUCCESS
      // --------------------------------------

      return res.status(200).json({
        success: true,
        message:
          "Seat held successfully",

        seat: {
          id: seat._id,
          seatNumber:
            seat.seatNumber,
          status:
            seat.status,
          lockedBy:
            seat.lockedBy,
          lockedUntil:
            seat.lockedUntil,
        },

        holdDurationMinutes: 10,
      });

    } catch (error) {
      console.error(
        "Hold seat error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to hold seat",
        error: error.message,
      });
    }
  }
);

// ==========================================
// RELEASE A HELD SEAT
// ==========================================

router.put(
  "/release/:seatId",
  protect,
  async (req, res) => {
    try {
      const { seatId } = req.params;

      const seat =
        await Seat.findOneAndUpdate(
          {
            _id: seatId,
            status: "locked",
            lockedBy: req.user.id,
          },
          {
            $set: {
              status: "available",
              lockedBy: null,
              lockedUntil: null,
            },
          },
          {
            new: true,
          }
        );

      if (!seat) {
        const existingSeat =
          await Seat.findById(
            seatId
          );

        if (!existingSeat) {
          return res.status(404).json({
            success: false,
            message:
              "Seat not found",
          });
        }

        return res.status(403).json({
          success: false,
          message:
            "You do not hold this seat",
        });
      }

      return res.json({
        success: true,
        message:
          "Seat released successfully",
        seat,
      });

    } catch (error) {
      console.error(
        "Release seat error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to release seat",
        error: error.message,
      });
    }
  }
);

// ==========================================
// CHECK MY SEAT HOLD
// ==========================================

router.get(
  "/hold/:seatId",
  protect,
  async (req, res) => {
    try {
      const seat =
        await Seat.findById(
          req.params.seatId
        );

      if (!seat) {
        return res.status(404).json({
          success: false,
          message:
            "Seat not found",
        });
      }

      const isMine =
        seat.status === "locked" &&
        String(
          seat.lockedBy
        ) ===
          String(req.user.id);

      const isValid =
        isMine &&
        seat.lockedUntil &&
        new Date(
          seat.lockedUntil
        ) > new Date();

      return res.json({
        success: true,

        heldByMe:
          Boolean(isValid),

        lockedUntil:
          isValid
            ? seat.lockedUntil
            : null,

        seat: {
          id: seat._id,
          seatNumber:
            seat.seatNumber,
          status:
            seat.status,
        },
      });

    } catch (error) {
      console.error(
        "Check seat hold error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to check seat hold",
        error: error.message,
      });
    }
  }
);

module.exports = router;