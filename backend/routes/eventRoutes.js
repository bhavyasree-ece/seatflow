const express = require("express");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// CREATE EVENT
// ORGANISER + ADMIN
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("organiser", "admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        venue,
        date,
        totalSeats,
        price,
        premiumPrice,
        standardPrice,
        image,
      } = req.body;

      if (
        !title ||
        !venue ||
        !date ||
        !totalSeats
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title, venue, date and totalSeats are required",
        });
      }

      const premium =
        premiumPrice !== undefined
          ? Number(premiumPrice)
          : Number(price || 500);

      const standard =
        standardPrice !== undefined
          ? Number(standardPrice)
          : Number(price || 300);

      const event = await Event.create({
        title: title.trim(),
        description: description || "",
        venue: venue.trim(),
        date,
        totalSeats: Number(totalSeats),
        availableSeats: Number(totalSeats),

        // Compatibility with old frontend
        price: standard,

        pricing: {
          Premium: premium,
          Standard: standard,
        },

        image: image || "",
      });

      return res.status(201).json({
        success: true,
        message: "Event created successfully",
        event,
      });
    } catch (error) {
      console.error("Create event error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create event",
        error: error.message,
      });
    }
  }
);

// ======================================================
// GET ALL EVENTS
// PUBLIC
// ======================================================

router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({
      date: 1,
    });

    return res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get events",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE EVENT
// PUBLIC
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(
      req.params.id
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get event",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE EVENT
// ORGANISER + ADMIN
// ======================================================

router.put(
  "/:id",
  protect,
  authorizeRoles("organiser", "admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        venue,
        date,
        price,
        premiumPrice,
        standardPrice,
        image,
        status,
      } = req.body;

      const updateData = {};

      if (title !== undefined)
        updateData.title = title;

      if (description !== undefined)
        updateData.description = description;

      if (venue !== undefined)
        updateData.venue = venue;

      if (date !== undefined)
        updateData.date = date;

      if (image !== undefined)
        updateData.image = image;

      if (status !== undefined)
        updateData.status = status;

      if (price !== undefined)
        updateData.price = Number(price);

      if (
        premiumPrice !== undefined ||
        standardPrice !== undefined
      ) {
        const existing =
          await Event.findById(req.params.id);

        if (!existing) {
          return res.status(404).json({
            success: false,
            message: "Event not found",
          });
        }

        updateData.pricing = {
          Premium:
            premiumPrice !== undefined
              ? Number(premiumPrice)
              : existing.pricing?.Premium || 500,

          Standard:
            standardPrice !== undefined
              ? Number(standardPrice)
              : existing.pricing?.Standard || 300,
        };
      }

      const event =
        await Event.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      return res.json({
        success: true,
        message: "Event updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update event error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update event",
        error: error.message,
      });
    }
  }
);

// ======================================================
// DELETE EVENT
// ADMIN ONLY
// ======================================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const event =
        await Event.findByIdAndDelete(
          req.params.id
        );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      await Seat.deleteMany({
        event: req.params.id,
      });

      await Booking.deleteMany({
        event: req.params.id,
      });

      return res.json({
        success: true,
        message:
          "Event and related seats deleted successfully",
      });
    } catch (error) {
      console.error("Delete event error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete event",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ORGANISER — BOOKING SUMMARY
// ======================================================

router.get(
  "/:id/summary",
  protect,
  authorizeRoles("organiser", "admin"),
  async (req, res) => {
    try {
      const eventId = req.params.id;

      const event =
        await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const bookings =
        await Booking.find({
          event: eventId,
          status: "confirmed",
        }).populate(
          "seat",
          "seatNumber category"
        );

      const totalBookings =
        bookings.length;

      const premiumBookings =
        bookings.filter(
          (b) =>
            b.seat?.category ===
            "Premium"
        ).length;

      const standardBookings =
        bookings.filter(
          (b) =>
            b.seat?.category ===
            "Standard"
        ).length;

      const premiumPrice =
        event.pricing?.Premium ||
        event.price ||
        0;

      const standardPrice =
        event.pricing?.Standard ||
        event.price ||
        0;

      const revenue =
        premiumBookings * premiumPrice +
        standardBookings * standardPrice;

      return res.json({
        success: true,
        event: {
          id: event._id,
          title: event.title,
          venue: event.venue,
          date: event.date,
        },
        summary: {
          totalSeats: event.totalSeats,
          availableSeats:
            event.availableSeats,
          totalBookings,
          premiumBookings,
          standardBookings,
          revenue,
        },
      });
    } catch (error) {
      console.error(
        "Booking summary error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get booking summary",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ORGANISER — REVENUE
// ======================================================

router.get(
  "/:id/revenue",
  protect,
  authorizeRoles("organiser", "admin"),
  async (req, res) => {
    try {
      const event =
        await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const bookings =
        await Booking.find({
          event: event._id,
          status: "confirmed",
        }).populate(
          "seat",
          "category"
        );

      const premiumPrice =
        event.pricing?.Premium ||
        event.price ||
        0;

      const standardPrice =
        event.pricing?.Standard ||
        event.price ||
        0;

      let premiumCount = 0;
      let standardCount = 0;

      bookings.forEach((booking) => {
        if (
          booking.seat?.category ===
          "Premium"
        ) {
          premiumCount++;
        }

        if (
          booking.seat?.category ===
          "Standard"
        ) {
          standardCount++;
        }
      });

      const premiumRevenue =
        premiumCount * premiumPrice;

      const standardRevenue =
        standardCount * standardPrice;

      return res.json({
        success: true,
        eventId: event._id,
        eventTitle: event.title,
        revenue: {
          premiumTickets: premiumCount,
          premiumRevenue,
          standardTickets: standardCount,
          standardRevenue,
          totalRevenue:
            premiumRevenue +
            standardRevenue,
        },
      });
    } catch (error) {
      console.error(
        "Revenue error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to calculate revenue",
        error: error.message,
      });
    }
  }
);

module.exports = router;