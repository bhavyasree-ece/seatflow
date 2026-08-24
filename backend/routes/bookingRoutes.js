const express = require("express");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Event = require("../models/Event");

const { protect } = require("../middleware/authMiddleware");

const {
  offerSeatToNextWaitlistUser,
} = require("../services/waitlistService");

const router = express.Router();

// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ======================================================
// GET SEAT PRICE
// ======================================================

const getSeatPrice = (event, seat) => {
  const category = String(
    seat.category || ""
  ).toLowerCase();

  // ------------------------------------------
  // PREMIUM
  // ------------------------------------------

  if (category === "premium") {
    return Number(
      event.premiumPrice ??
        event.premiumTicketPrice ??
        event.premium ??
        event.prices?.premium ??
        0
    );
  }

  // ------------------------------------------
  // STANDARD
  // ------------------------------------------

  return Number(
    event.standardPrice ??
      event.standardTicketPrice ??
      event.standard ??
      event.prices?.standard ??
      event.price ??
      0
  );
};

// ======================================================
// BOOK A SEAT
// ======================================================

router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      const {
        eventId,
        seatId,
        paymentMethod,
        paymentStatus,
        amount,
      } = req.body;

      // ------------------------------------------
      // CHECK REQUIRED DATA
      // ------------------------------------------

      if (!eventId || !seatId) {
        return res.status(400).json({
          success: false,
          message:
            "eventId and seatId are required",
        });
      }

      // ------------------------------------------
      // FIND EVENT
      // ------------------------------------------

      const event =
        await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // ------------------------------------------
      // FIND SEAT
      // ------------------------------------------

      const seat =
        await Seat.findOne({
          _id: seatId,
          event: eventId,
        });

      if (!seat) {
        return res.status(404).json({
          success: false,
          message: "Seat not found",
        });
      }

      // ------------------------------------------
      // CHECK IF ALREADY BOOKED
      // ------------------------------------------

      if (seat.status === "booked") {
        return res.status(409).json({
          success: false,
          message:
            `Seat ${seat.seatNumber} is already booked`,
        });
      }

      // ------------------------------------------
      // CHECK LOCK
      // ------------------------------------------

      if (seat.status === "locked") {
        const lockStillValid =
          seat.lockedUntil &&
          new Date(seat.lockedUntil) >
            new Date();

        if (
          lockStillValid &&
          String(seat.lockedBy) !==
            String(req.user.id)
        ) {
          return res.status(409).json({
            success: false,
            message:
              `Seat ${seat.seatNumber} is currently held by another customer`,
          });
        }

        // ------------------------------------------
        // LOCK EXPIRED
        // ------------------------------------------

        if (!lockStillValid) {
          seat.status = "available";
          seat.lockedBy = null;
          seat.lockedUntil = null;
        }
      }

      // ==================================================
      // CALCULATE SEAT PRICE
      // ==================================================

      const seatPrice =
        getSeatPrice(event, seat);

      console.log(
        `Seat price for ${seat.seatNumber}: ₹${seatPrice}`
      );

      // ==================================================
      // AMOUNT PAID
      // ==================================================

      /*
        Payment.jsx sends:

        amount:
          totalAmount / selectedSeats.length

        So use that value when available.

        If it is not available, fall back to
        the actual seat price.
      */

      let totalAmount =
        Number(amount);

      if (
        !Number.isFinite(totalAmount) ||
        totalAmount < 0
      ) {
        totalAmount = seatPrice;
      }

      console.log(
        `Final booking amount for ${seat.seatNumber}: ₹${totalAmount}`
      );

      // ==================================================
      // CREATE BOOKING
      // ==================================================

      const booking =
        await Booking.create({
          user: req.user.id,

          event: eventId,

          seat: seatId,

          totalAmount:
            totalAmount,

          status:
            "confirmed",

          paymentStatus:
            paymentStatus === "paid"
              ? "paid"
              : "paid",

          paymentMethod:
            paymentMethod || "card",
        });

      // ==================================================
      // MARK SEAT AS BOOKED
      // ==================================================

      seat.status = "booked";

      seat.bookedBy =
        req.user.id;

      seat.lockedBy = null;

      seat.lockedUntil = null;

      await seat.save();

      // ==================================================
      // UPDATE EVENT AVAILABLE SEATS
      // ==================================================

      if (
        typeof event.availableSeats ===
        "number"
      ) {
        event.availableSeats =
          Math.max(
            0,
            event.availableSeats - 1
          );

        await event.save();
      }

      // ==================================================
      // QR CODE DATA
      // ==================================================

      const qrData =
        JSON.stringify({
          bookingId:
            booking._id.toString(),

          eventId:
            event._id.toString(),

          event:
            event.title,

          seat:
            seat.seatNumber,

          customer:
            req.user.email,

          amount:
            totalAmount,

          paymentStatus:
            "paid",

          status:
            "confirmed",
        });

      // ==================================================
      // GENERATE QR PNG
      // ==================================================

      const qrBuffer =
        await QRCode.toBuffer(
          qrData,
          {
            type: "png",
            width: 300,
            margin: 2,
          }
        );

      // ==================================================
      // GENERATE QR DATA URL
      // ==================================================

      const qrCode =
        await QRCode.toDataURL(
          qrData
        );

      // ==================================================
      // SEND EMAIL
      // ==================================================

      let emailSent = false;

      try {
        await transporter.sendMail({
          from:
            `"SeatFlow" <${process.env.EMAIL_USER}>`,

          to:
            req.user.email,

          subject:
            `SeatFlow Ticket Confirmation - ${event.title}`,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 650px;
              margin: auto;
              padding: 30px;
              background: #f5f3ff;
              border-radius: 12px;
            ">

              <h1 style="
                color:#7c3aed;
              ">
                SeatFlow
              </h1>

              <h2>
                Booking Confirmed 🎉
              </h2>

              <p>
                Hello ${
                  req.user.name ||
                  "Customer"
                },
              </p>

              <p>
                Your ticket has been
                successfully booked.
              </p>

              <hr />

              <h3>
                ${event.title}
              </h3>

              <p>
                <strong>Seat:</strong>
                ${seat.seatNumber}
              </p>

              <p>
                <strong>Category:</strong>
                ${seat.category || "Standard"}
              </p>

              <p>
                <strong>Amount Paid:</strong>
                ₹${totalAmount}
              </p>

              <p>
                <strong>Payment Status:</strong>
                PAID
              </p>

              <p>
                <strong>Payment Method:</strong>
                ${
                  paymentMethod ||
                  "card"
                }
              </p>

              <p>
                <strong>Venue:</strong>
                ${event.venue}
              </p>

              <p>
                <strong>Date:</strong>
                ${
                  event.date
                    ? new Date(
                        event.date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "Not available"
                }
              </p>

              <p>
                <strong>Booking ID:</strong>
                ${booking._id}
              </p>

              <hr />

              <p>
                Your QR ticket is
                attached to this email.
              </p>

              <p>
                Please show the QR code
                at the venue.
              </p>

              <p>
                Thank you for booking
                with SeatFlow.
              </p>

            </div>
          `,

          attachments: [
            {
              filename:
                `SeatFlow-${booking._id}.png`,

              content:
                qrBuffer,

              contentType:
                "image/png",
            },
          ],
        });

        emailSent = true;

        console.log(
          `Ticket email sent successfully to ${req.user.email}`
        );
      } catch (emailError) {
        console.error(
          "Email sending failed:",
          emailError.message
        );
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(201).json({
        success: true,

        message:
          "Seat booked successfully",

        booking,

        totalAmount:
          totalAmount,

        qrCode,

        email:
          req.user.email,

        emailSent,

        seat: {
          id:
            seat._id,

          seatNumber:
            seat.seatNumber,

          category:
            seat.category,

          status:
            seat.status,
        },

        event: {
          id:
            event._id,

          title:
            event.title,

          venue:
            event.venue,

          date:
            event.date,
        },
      });

    } catch (error) {
      console.error(
        "Booking error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Booking failed",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// GET MY BOOKINGS
// ======================================================

router.get(
  "/my",
  protect,
  async (req, res) => {
    try {
      const bookings =
        await Booking.find({
          user: req.user.id,
        })
          .populate("event")
          .populate("seat")
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,

        count:
          bookings.length,

        bookings,
      });

    } catch (error) {
      console.error(
        "Get bookings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to get bookings",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// CANCEL BOOKING
// ======================================================

router.put(
  "/:bookingId/cancel",
  protect,
  async (req, res) => {
    try {
      const {
        bookingId,
      } = req.params;

      // ------------------------------------------
      // FIND USER BOOKING
      // ------------------------------------------

      const booking =
        await Booking.findOne({
          _id: bookingId,
          user: req.user.id,
        });

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found",
        });
      }

      // ------------------------------------------
      // ALREADY CANCELLED
      // ------------------------------------------

      if (
        booking.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Booking is already cancelled",
        });
      }

      // ------------------------------------------
      // FIND SEAT
      // ------------------------------------------

      const seat =
        await Seat.findById(
          booking.seat
        );

      if (!seat) {
        return res.status(404).json({
          success: false,

          message:
            "Seat not found",
        });
      }

      // ------------------------------------------
      // FIND EVENT
      // ------------------------------------------

      const event =
        await Event.findById(
          booking.event
        );

      // ------------------------------------------
      // CANCEL BOOKING
      // ------------------------------------------

      booking.status =
        "cancelled";

      // If payment was made,
      // mark it refunded for now.
      booking.paymentStatus =
        "refunded";

      await booking.save();

      // ------------------------------------------
      // RELEASE SEAT
      // ------------------------------------------

      seat.status =
        "available";

      seat.bookedBy =
        null;

      seat.lockedBy =
        null;

      seat.lockedUntil =
        null;

      await seat.save();

      // ------------------------------------------
      // UPDATE EVENT SEATS
      // ------------------------------------------

      if (
        event &&
        typeof event.availableSeats ===
        "number"
      ) {
        event.availableSeats += 1;

        await event.save();
      }

      // ------------------------------------------
      // OFFER SEAT TO WAITLIST
      // ------------------------------------------

      let waitlistOffer = null;

      try {
        waitlistOffer =
          await offerSeatToNextWaitlistUser(
            seat
          );
      } catch (waitlistError) {
        console.error(
          "Waitlist offer error:",
          waitlistError.message
        );
      }

      // ------------------------------------------
      // RESPONSE
      // ------------------------------------------

      return res.json({
        success: true,

        message:
          "Booking cancelled successfully",

        booking,

        waitlistOffer,
      });

    } catch (error) {
      console.error(
        "Cancel booking error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to cancel booking",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;