const express = require("express");
const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const ctrl = require("../controllers/adminController");

// Only logged-in admin users can access these routes
router.use(protect, authorizeRoles("admin"));

// ================================
// VENUE MANAGEMENT
// ================================

// Create venue
router.post("/venues", ctrl.createVenue);

// Get all venues
router.get("/venues", ctrl.listVenues);

// Update venue
router.patch("/venues/:id", ctrl.updateVenue);

// Deactivate venue
router.delete("/venues/:id", ctrl.deactivateVenue);

// ================================
// USER MANAGEMENT
// ================================

// Get all users
router.get("/users", ctrl.listUsers);

// Change user role
router.patch("/users/:id/role", ctrl.setUserRole);

// ================================
// ADMIN OVERVIEW
// ================================

// Dashboard statistics
router.get("/overview", ctrl.overview);

module.exports = router;