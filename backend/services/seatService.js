const Seat = require("../models/Seat");
const Event = require("../models/Event");

// ==========================================
// GENERATE SEATS FOR AN EVENT
// ==========================================

const generateSeats = async (eventId) => {
  // ------------------------------------------
  // FIND EVENT
  // ------------------------------------------

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  // ------------------------------------------
  // CHECK EXISTING SEATS
  // ------------------------------------------

  const existingSeats = await Seat.find({
    event: eventId,
  }).sort({
    row: 1,
    seatIndex: 1,
  });

  // If seats already exist, don't create duplicates.
  // Simply return the existing seats.
  if (existingSeats.length > 0) {
    return {
      seats: existingSeats,
      alreadyGenerated: true,
    };
  }

  // ------------------------------------------
  // TOTAL SEATS
  // ------------------------------------------

  const totalSeats = Number(event.totalSeats);

  if (!totalSeats || totalSeats <= 0) {
    throw new Error(
      "Event totalSeats is missing or invalid"
    );
  }

  // ------------------------------------------
  // SEAT CONFIGURATION
  // ------------------------------------------

  const seatsPerRow = 10;

  const totalRows = Math.ceil(
    totalSeats / seatsPerRow
  );

  const seats = [];

  // ------------------------------------------
  // CREATE SEATS
  // ------------------------------------------

  for (
    let rowIndex = 0;
    rowIndex < totalRows;
    rowIndex++
  ) {
    const row = String.fromCharCode(
      65 + rowIndex
    );

    for (
      let seatIndex = 1;
      seatIndex <= seatsPerRow;
      seatIndex++
    ) {
      if (seats.length >= totalSeats) {
        break;
      }

      // First 3 rows = Premium
      // Remaining rows = Standard

      const category =
        rowIndex < 3
          ? "Premium"
          : "Standard";

      seats.push({
        event: eventId,
        seatNumber: `${row}${seatIndex}`,
        row: row,
        seatIndex: seatIndex,
        category: category,
        status: "available",
      });
    }
  }

  // ------------------------------------------
  // SAVE SEATS
  // ------------------------------------------

  const createdSeats =
    await Seat.insertMany(seats);

  return {
    seats: createdSeats,
    alreadyGenerated: false,
  };
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  generateSeats,
};