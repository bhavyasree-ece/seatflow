const Event = require("../models/Event");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const Venue = require("../models/Venue");

// POST /api/organiser/events
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      venueId,
      date,
      pricing,
      image,
      layout,
    } = req.body;

    if (
      !title ||
      !venueId ||
      !date ||
      !pricing?.Premium ||
      !pricing?.Standard
    ) {
      return res.status(400).json({
        success: false,
        message:
          "title, venueId, date and pricing (Premium & Standard) are required.",
      });
    }

    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found.",
      });
    }

    const event = await Event.create({
      title,
      description,
      venue: venue.name,
      date,
      totalSeats: venue.capacity,
      availableSeats: venue.capacity,
      price: pricing.Standard,
      pricing: {
        Premium: pricing.Premium,
        Standard: pricing.Standard,
      },
      image: image || "",
      organiser: req.user.id,
    });

    const rows =
      layout && layout.length
        ? layout
        : defaultLayoutFromCapacity(venue.capacity);

    const seatDocs = [];
    let seatIndex = 0;

    for (const row of rows) {
      for (let number = 1; number <= row.seats; number++) {
        seatDocs.push({
          event: event._id,
          row: row.row,
          seatNumber: `${row.row}${number}`,
          seatIndex: seatIndex++,
          category: row.category,
          status: "available",
        });
      }
    }

    await Seat.insertMany(seatDocs);

    res.status(201).json({
      success: true,
      event,
      seatsCreated: seatDocs.length,
    });
  } catch (error) {
    console.error("Create organiser event error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function defaultLayoutFromCapacity(capacity) {
  const rows = Math.ceil(capacity / 10);
  const layout = [];

  for (let i = 0; i < rows; i++) {
    layout.push({
      row: String.fromCharCode(65 + i),
      seats: Math.min(10, capacity - i * 10),
      category:
        i < Math.ceil(rows * 0.3)
          ? "Premium"
          : "Standard",
    });
  }

  return layout;
}

// GET /api/organiser/events
exports.myEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organiser: req.user.id,
    }).sort({ date: 1 });

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get organiser events error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/organiser/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organiser: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const allowed = [
      "title",
      "description",
      "date",
      "image",
      "status",
      "pricing",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    }

    await event.save();

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Update organiser event error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/organiser/events/:id/summary
exports.eventSummary = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organiser: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const bookings = await Booking.find({
      event: event._id,
      status: "confirmed",
    });

    const cancelled = await Booking.countDocuments({
      event: event._id,
      status: "cancelled",
    });

    const byCategory = {};
    let totalRevenue = 0;

    for (const booking of bookings) {
      const category = booking.category || "Standard";

      if (!byCategory[category]) {
        byCategory[category] = {
          count: 0,
          revenue: 0,
        };
      }

      byCategory[category].count++;
      byCategory[category].revenue += booking.amount || 0;
      totalRevenue += booking.amount || 0;
    }

    res.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        totalSeats: event.totalSeats,
        availableSeats: event.availableSeats,
      },
      totalBookings: bookings.length,
      cancelledBookings: cancelled,
      totalRevenue,
      byCategory,
    });
  } catch (error) {
    console.error("Event summary error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/organiser/revenue
exports.revenueOverview = async (req, res) => {
  try {
    const events = await Event.find({
      organiser: req.user.id,
    });

    const eventIds = events.map((event) => event._id);

    const bookings = await Booking.find({
      event: { $in: eventIds },
      status: "confirmed",
    });

    const perEvent = events.map((event) => {
      const eventBookings = bookings.filter(
        (booking) =>
          String(booking.event) === String(event._id)
      );

      return {
        eventId: event._id,
        title: event.title,
        bookings: eventBookings.length,
        revenue: eventBookings.reduce(
          (sum, booking) => sum + (booking.amount || 0),
          0
        ),
      };
    });

    res.json({
      success: true,
      totalRevenue: perEvent.reduce(
        (sum, event) => sum + event.revenue,
        0
      ),
      totalBookings: perEvent.reduce(
        (sum, event) => sum + event.bookings,
        0
      ),
      perEvent,
    });
  } catch (error) {
    console.error("Revenue overview error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};