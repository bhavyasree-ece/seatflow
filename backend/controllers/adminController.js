const Venue = require("../models/Venue");
const Event = require("../models/Event");
const User = require("../models/User");
const Booking = require("../models/Booking");

// POST /api/admin/venues
exports.createVenue = async (req, res) => {
  try {
    const { name, location, capacity, description, layout } = req.body;

    if (!name || !location || !capacity) {
      return res.status(400).json({
        success: false,
        message: "name, location and capacity are required.",
      });
    }

    const venue = await Venue.create({
      name,
      location,
      capacity,
      description,
      layout: layout || [],
    });

    res.status(201).json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error("Create venue error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/admin/venues
exports.listVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      venues,
    });
  } catch (error) {
    console.error("List venues error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/admin/venues/:id
exports.updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found.",
      });
    }

    const allowed = [
      "name",
      "location",
      "capacity",
      "description",
      "active",
      "layout",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        venue[key] = req.body[key];
      }
    }

    await venue.save();

    res.json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error("Update venue error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/admin/venues/:id
exports.deactivateVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found.",
      });
    }

    res.json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error("Deactivate venue error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/admin/users/:id/role
exports.setUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["customer", "organiser", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Set user role error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/admin/overview
exports.overview = async (req, res) => {
  try {
    const [venueCount, eventCount, userCount, bookings] =
      await Promise.all([
        Venue.countDocuments({ active: true }),
        Event.countDocuments(),
        User.countDocuments(),
        Booking.find({ status: "confirmed" }),
      ]);

    res.json({
      success: true,
      venues: venueCount,
      events: eventCount,
      users: userCount,
      confirmedBookings: bookings.length,
      totalRevenue: bookings.reduce(
        (sum, booking) => sum + (booking.amount || 0),
        0
      ),
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};