const Seat = require("../models/Seat");

// ==========================================
// RELEASE EXPIRED SEAT HOLDS
// ==========================================

const releaseExpiredSeatHolds = async () => {
  try {
    const now = new Date();

    const result = await Seat.updateMany(
      {
        status: "locked",
        lockedUntil: {
          $lte: now,
        },
      },
      {
        $set: {
          status: "available",
          lockedBy: null,
          lockedUntil: null,
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Released ${result.modifiedCount} expired seat hold(s)`
      );
    }
  } catch (error) {
    console.error("Error releasing expired seat holds:");
    console.error(error.message);
  }
};

// ==========================================
// START SEAT HOLD SCHEDULER
// ==========================================

const startSeatHoldScheduler = () => {
  // Check every 30 seconds
  setInterval(async () => {
    await releaseExpiredSeatHolds();
  }, 30 * 1000);

  console.log("Seat hold scheduler started");
};

module.exports = {
  releaseExpiredSeatHolds,
  startSeatHoldScheduler,
};