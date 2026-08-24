const express = require("express");

const Venue = require("../models/Venue");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET VENUES
router.get("/", async (req, res) => {
  try {
    const venues = await Venue.find({
      active: true,
    }).sort({
      name: 1,
    });

    res.json({
      success: true,
      count: venues.length,
      venues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get venues",
    });
  }
});

// CREATE VENUE
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const {
        name,
        location,
        capacity,
        description,
      } = req.body;

      if (
        !name ||
        !location ||
        !capacity
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, location and capacity are required",
        });
      }

      const venue = await Venue.create({
        name,
        location,
        capacity,
        description: description || "",
      });

      res.status(201).json({
        success: true,
        message: "Venue created successfully",
        venue,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create venue",
        error: error.message,
      });
    }
  }
);

// UPDATE VENUE
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const venue =
        await Venue.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!venue) {
        return res.status(404).json({
          success: false,
          message: "Venue not found",
        });
      }

      res.json({
        success: true,
        message: "Venue updated successfully",
        venue,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update venue",
        error: error.message,
      });
    }
  }
);

// DELETE VENUE
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const venue =
        await Venue.findByIdAndUpdate(
          req.params.id,
          {
            active: false,
          },
          {
            new: true,
          }
        );

      if (!venue) {
        return res.status(404).json({
          success: false,
          message: "Venue not found",
        });
      }

      res.json({
        success: true,
        message: "Venue deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete venue",
      });
    }
  }
);

module.exports = router;