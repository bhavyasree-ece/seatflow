const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ======================================================
// WAITLIST SERVICE
// ======================================================

const {
  releaseExpiredWaitlistOffers,
} = require("./services/waitlistService");

// ======================================================
// EXPRESS APP
// ======================================================

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://seatflow-1.onrender.com",
    ],
    credentials: true,
  })
);

// ======================================================
// ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");

const organiserRoutes = require("./routes/organiserRoutes");
const adminRoutes = require("./routes/adminRoutes");
const venueRoutes = require("./routes/venueRoutes");

// ======================================================
// CUSTOMER API ROUTES
// ======================================================

// DO NOT REMOVE THESE

app.use("/api/auth", authRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/seats", seatRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/waitlist", waitlistRoutes);

// ======================================================
// ORGANISER API ROUTES
// ======================================================

app.use("/api/organiser", organiserRoutes);

// ======================================================
// ADMIN API ROUTES
// ======================================================

app.use("/api/admin", adminRoutes);

// ======================================================
// VENUE API ROUTES
// ======================================================

app.use("/api/venues", venueRoutes);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SeatFlow backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SeatFlow API is healthy",

    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,

    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {
  console.error(
    "Global server error:",
    error
  );

  res.status(
    error.status || 500
  ).json({
    success: false,

    message:
      error.message ||
      "Internal server error",
  });
});

// ======================================================
// DATABASE CONFIGURATION
// ======================================================

const PORT =
  process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error(
    "ERROR: MONGO_URI or MONGODB_URI is missing in .env"
  );

  process.exit(1);
}

// ======================================================
// WAITLIST EXPIRY CHECKER
// ======================================================

let waitlistChecker = null;

const startWaitlistChecker = () => {
  console.log(
    "Starting waitlist expiry checker..."
  );

  // Check immediately once
  checkExpiredWaitlistOffers();

  // Then check every 30 seconds
  waitlistChecker = setInterval(
    checkExpiredWaitlistOffers,
    30 * 1000
  );
};

const checkExpiredWaitlistOffers = async () => {
  try {
    if (
      mongoose.connection.readyState !== 1
    ) {
      return;
    }

    const result =
      await releaseExpiredWaitlistOffers();

    if (result) {
      console.log(
        "Waitlist expiry check completed."
      );
    }
  } catch (error) {
    console.error(
      "Waitlist expiry checker error:",
      error.message
    );
  }
};

// ======================================================
// START SERVER
// ======================================================

const startServer = async () => {
  try {
    // --------------------------------------------------
    // CONNECT TO MONGODB
    // --------------------------------------------------

    await mongoose.connect(
      MONGO_URI
    );

    console.log(
      "MongoDB connected successfully"
    );

    // --------------------------------------------------
    // START WAITLIST CHECKER
    // --------------------------------------------------

    startWaitlistChecker();

    // --------------------------------------------------
    // START EXPRESS SERVER
    // --------------------------------------------------

    app.listen(
      PORT,
      () => {
        console.log(
          `SeatFlow backend running on port ${PORT}`
        );

        console.log(
          `API: http://localhost:${PORT}`
        );

        console.log(
          "Waitlist system is active."
        );
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

// ======================================================
// START APPLICATION
// ======================================================

startServer();

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

process.on(
  "SIGINT",
  async () => {
    console.log(
      "\nShutting down server..."
    );

    // Stop waitlist checker
    if (waitlistChecker) {
      clearInterval(
        waitlistChecker
      );
    }

    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error(
        "Error closing MongoDB:",
        error.message
      );
    }

    process.exit(0);
  }
);

process.on(
  "SIGTERM",
  async () => {
    console.log(
      "\nShutting down server..."
    );

    // Stop waitlist checker
    if (waitlistChecker) {
      clearInterval(
        waitlistChecker
      );
    }

    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error(
        "Error closing MongoDB:",
        error.message
      );
    }

    process.exit(0);
  }
);