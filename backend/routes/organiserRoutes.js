const express = require("express");
const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const ctrl = require("../controllers/organiserController");

// Organiser and admin can access these routes
router.use(
  protect,
  authorizeRoles("organiser", "admin")
);

// ================================
// EVENT MANAGEMENT
// ================================

// Create event
router.post("/events", ctrl.createEvent);

// Get organiser's events
router.get("/events", ctrl.myEvents);

// Update event
router.patch("/events/:id", ctrl.updateEvent);

// Event summary
router.get(
  "/events/:id/summary",
  ctrl.eventSummary
);

// Revenue overview
router.get(
  "/revenue",
  ctrl.revenueOverview
);

module.exports = router;