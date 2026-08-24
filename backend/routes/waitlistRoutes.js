const express = require("express");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const Waitlist = require("../models/Waitlist");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Event = require("../models/Event");

const { protect } = require("../middleware/authMiddleware");

const {
  releaseExpiredWaitlistOffers,
} = require("../services/waitlistService");

const router = express.Router();

// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,

    pass:
      process.env.EMAIL_PASSWORD ||
      process.env.EMAIL_PASS,
  },
});

// ======================================================
// HELPER: RENUMBER ACTIVE WAITLIST
// ======================================================

const renumberWaitlist = async (
  eventId,
  seatCategory
) => {
  try {
    const activeEntries =
      await Waitlist.find({
        eventId,
        seatCategory,
        status: {
          $in: [
            "waiting",
            "notified",
          ],
        },
      }).sort({
        createdAt: 1,
      });

    for (
      let i = 0;
      i < activeEntries.length;
      i++
    ) {
      const newPosition = i + 1;

      if (
        activeEntries[i].position !==
        newPosition
      ) {
        activeEntries[i].position =
          newPosition;

        await activeEntries[i].save();
      }
    }

    return activeEntries;
  } catch (error) {
    console.error(
      "Renumber waitlist error:",
      error.message
    );

    throw error;
  }
};

// ======================================================
// JOIN WAITLIST
// ======================================================

router.post(
  "/join",
  protect,
  async (req, res) => {
    try {
      const {
        eventId,
        seatCategory,
        quantity,
      } = req.body || {};

      // ------------------------------------------------
      // VALIDATE REQUEST
      // ------------------------------------------------

      if (
        !eventId ||
        !seatCategory
      ) {
        return res.status(400).json({
          success: false,
          message:
            "eventId and seatCategory are required",
        });
      }

      const requestedQuantity =
        Number(quantity) || 1;

      if (
        requestedQuantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Quantity must be at least 1",
        });
      }

      // ------------------------------------------------
      // CHECK EVENT
      // ------------------------------------------------

      const event =
        await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found",
        });
      }

      // ==================================================
      // IMPORTANT:
      // PROCESS EXPIRED OFFERS BEFORE CHECKING
      // WHETHER USER IS ALREADY ON THE WAITLIST.
      //
      // This prevents an expired "notified" entry from
      // blocking the customer from joining again.
      // ==================================================

      try {
        await releaseExpiredWaitlistOffers();
      } catch (expiryError) {
        console.error(
          "Expired waitlist processing warning:",
          expiryError.message
        );

        // Continue with the request.
        // A scheduler may also process the offer.
      }

      // ------------------------------------------------
      // RENUMBER ACTIVE ENTRIES
      // ------------------------------------------------

      await renumberWaitlist(
        eventId,
        seatCategory
      );

      // ------------------------------------------------
      // CHECK EXISTING ACTIVE ENTRY
      // ------------------------------------------------

      const existingEntry =
        await Waitlist.findOne({
          userId: req.user.id,

          eventId,

          seatCategory,

          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        });

      if (existingEntry) {
        return res.status(409).json({
          success: false,

          message:
            "You are already on this waitlist",

          position:
            existingEntry.position,
        });
      }

      // ------------------------------------------------
      // FIND CURRENT ACTIVE COUNT
      // ------------------------------------------------

      const activeCount =
        await Waitlist.countDocuments({
          eventId,

          seatCategory,

          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        });

      // ------------------------------------------------
      // ASSIGN NEXT POSITION
      // ------------------------------------------------

      const position =
        activeCount + 1;

      // ------------------------------------------------
      // CREATE WAITLIST ENTRY
      // ------------------------------------------------

      const waitlistEntry =
        await Waitlist.create({
          userId:
            req.user.id,

          eventId,

          seatCategory,

          quantity:
            requestedQuantity,

          status:
            "waiting",

          position,
        });

      console.log(
        `User ${req.user.id} joined ${seatCategory} waitlist at position #${position}`
      );

      return res.status(201).json({
        success: true,

        message:
          "Successfully joined the waitlist",

        waitlist:
          waitlistEntry,

        position,
      });
    } catch (error) {
      console.error(
        "Join waitlist error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to join waitlist",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// GET MY WAITLIST
// ======================================================

router.get(
  "/my",
  protect,
  async (req, res) => {
    try {
      // ------------------------------------------------
      // PROCESS EXPIRED OFFERS FIRST
      // ------------------------------------------------

      try {
        await releaseExpiredWaitlistOffers();
      } catch (expiryError) {
        console.error(
          "Expired offer processing warning:",
          expiryError.message
        );
      }

      // ------------------------------------------------
      // FIND USER ACTIVE ENTRIES
      // ------------------------------------------------

      const activeEntries =
        await Waitlist.find({
          userId: req.user.id,

          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        });

      // ------------------------------------------------
      // RENUMBER EACH ACTIVE QUEUE
      // ------------------------------------------------

      for (
        const entry of activeEntries
      ) {
        await renumberWaitlist(
          entry.eventId,
          entry.seatCategory
        );
      }

      // ------------------------------------------------
      // GET ALL USER WAITLIST ENTRIES
      // ------------------------------------------------

      const entries =
        await Waitlist.find({
          userId: req.user.id,
        })
          .populate("eventId")
          .populate("offeredSeat")
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,

        count:
          entries.length,

        waitlist:
          entries,
      });
    } catch (error) {
      console.error(
        "Get my waitlist error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to get waitlist",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// GET EVENT WAITLIST
// ======================================================

router.get(
  "/event/:eventId/category/:seatCategory",
  protect,
  async (req, res) => {
    try {
      const {
        eventId,
        seatCategory,
      } = req.params;

      // ------------------------------------------------
      // PROCESS EXPIRED OFFERS
      // ------------------------------------------------

      try {
        await releaseExpiredWaitlistOffers();
      } catch (expiryError) {
        console.error(
          "Expired offer processing warning:",
          expiryError.message
        );
      }

      // ------------------------------------------------
      // RENUMBER
      // ------------------------------------------------

      await renumberWaitlist(
        eventId,
        seatCategory
      );

      // ------------------------------------------------
      // GET ACTIVE ENTRIES
      // ------------------------------------------------

      const entries =
        await Waitlist.find({
          eventId,

          seatCategory,

          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        })
          .populate(
            "userId",
            "name email"
          )
          .populate("offeredSeat")
          .sort({
            position: 1,
          });

      return res.json({
        success: true,

        count:
          entries.length,

        waitlist:
          entries,
      });
    } catch (error) {
      console.error(
        "Get event waitlist error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to get event waitlist",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// ACCEPT WAITLIST OFFER
// ======================================================

router.post(
  "/accept/:waitlistId",
  protect,
  async (req, res) => {
    try {
      const {
        waitlistId,
      } = req.params;

      const {
        paymentConfirmed,
        paymentMethod,
        totalAmount,
      } = req.body || {};

      // ------------------------------------------------
      // PAYMENT CHECK
      // ------------------------------------------------

      if (
        paymentConfirmed !== true
      ) {
        return res.status(402).json({
          success: false,

          message:
            "Payment is required before confirming this waitlist booking",
        });
      }

      // ------------------------------------------------
      // FIND WAITLIST ENTRY
      // ------------------------------------------------

      const waitlistEntry =
        await Waitlist.findOne({
          _id:
            waitlistId,

          userId:
            req.user.id,

          status:
            "notified",
        });

      if (!waitlistEntry) {
        return res.status(404).json({
          success: false,

          message:
            "Waitlist offer not found or already expired",
        });
      }

      // ------------------------------------------------
      // CHECK OFFER EXPIRY
      // ------------------------------------------------

      const now =
        new Date();

      if (
        !waitlistEntry.offerExpiresAt ||
        new Date(
          waitlistEntry.offerExpiresAt
        ) <= now
      ) {
        waitlistEntry.status =
          "expired";

        await waitlistEntry.save();

        await renumberWaitlist(
          waitlistEntry.eventId,
          waitlistEntry.seatCategory
        );

        return res.status(410).json({
          success: false,

          message:
            "This waitlist offer has expired",
        });
      }

      // ------------------------------------------------
      // FIND EVENT
      // ------------------------------------------------

      const event =
        await Event.findById(
          waitlistEntry.eventId
        );

      if (!event) {
        return res.status(404).json({
          success: false,

          message:
            "Event not found",
        });
      }

      // ------------------------------------------------
      // FIND OFFERED SEAT
      // ------------------------------------------------

      const seat =
        await Seat.findById(
          waitlistEntry.offeredSeat
        );

      if (!seat) {
        return res.status(404).json({
          success: false,

          message:
            "Offered seat no longer exists",
        });
      }

      // ------------------------------------------------
      // VERIFY SEAT LOCK
      // ------------------------------------------------

      const seatBelongsToUser =
        seat.status ===
          "locked" &&
        String(
          seat.lockedBy
        ) ===
          String(
            req.user.id
          );

      const seatLockValid =
        seat.lockedUntil &&
        new Date(
          seat.lockedUntil
        ) > now;

      if (
        !seatBelongsToUser ||
        !seatLockValid
      ) {
        waitlistEntry.status =
          "expired";

        await waitlistEntry.save();

        await renumberWaitlist(
          waitlistEntry.eventId,
          waitlistEntry.seatCategory
        );

        return res.status(409).json({
          success: false,

          message:
            "The offered seat is no longer available",
        });
      }

      // ------------------------------------------------
      // PREVENT DUPLICATE BOOKING
      // ------------------------------------------------

      const existingBooking =
        await Booking.findOne({
          user:
            req.user.id,

          event:
            event._id,

          seat:
            seat._id,

          status:
            "confirmed",
        });

      if (existingBooking) {
        return res.status(409).json({
          success: false,

          message:
            "This seat is already booked by you",
        });
      }

      // ------------------------------------------------
      // CREATE BOOKING
      // ------------------------------------------------

      const booking =
        await Booking.create({
          user:
            req.user.id,

          event:
            event._id,

          seat:
            seat._id,

          status:
            "confirmed",
        });

      // ------------------------------------------------
      // MARK SEAT BOOKED
      // ------------------------------------------------

      seat.status =
        "booked";

      seat.bookedBy =
        req.user.id;

      seat.lockedBy =
        null;

      seat.lockedUntil =
        null;

      await seat.save();

      // ------------------------------------------------
      // UPDATE EVENT AVAILABLE SEATS
      // ------------------------------------------------

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

      // ------------------------------------------------
      // MARK WAITLIST BOOKED
      // ------------------------------------------------

      waitlistEntry.status =
        "booked";

      await waitlistEntry.save();

      // ------------------------------------------------
      // RENUMBER REMAINING QUEUE
      // ------------------------------------------------

      const remainingEntries =
        await renumberWaitlist(
          waitlistEntry.eventId,
          waitlistEntry.seatCategory
        );

      // ------------------------------------------------
      // CREATE QR DATA
      // ------------------------------------------------

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

          status:
            "confirmed",
        });

      // ------------------------------------------------
      // GENERATE QR
      // ------------------------------------------------

      const qrBuffer =
        await QRCode.toBuffer(
          qrData,
          {
            type:
              "png",

            width:
              300,

            margin:
              2,
          }
        );

      const qrCode =
        await QRCode.toDataURL(
          qrData
        );

      // ------------------------------------------------
      // SEND CONFIRMATION EMAIL
      // ------------------------------------------------

      let emailSent =
        false;

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
              font-family: Arial, Helvetica, sans-serif;
              max-width: 650px;
              margin: 30px auto;
              padding: 35px;
              background: #f5f3ff;
              border-radius: 18px;
              border: 1px solid #ddd6fe;
              color: #222;
            ">

              <h1 style="
                color: #7c3aed;
                margin-top: 0;
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
                Your waitlist seat has been
                successfully booked after
                payment.
              </p>

              <div style="
                background: #ffffff;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                border: 1px solid #e5e7eb;
              ">

                <p>
                  <strong>
                    Event:
                  </strong>
                  ${event.title}
                </p>

                <p>
                  <strong>
                    Seat:
                  </strong>
                  ${seat.seatNumber}
                </p>

                <p>
                  <strong>
                    Category:
                  </strong>
                  ${seat.category}
                </p>

                <p>
                  <strong>
                    Venue:
                  </strong>
                  ${
                    event.venue ||
                    "N/A"
                  }
                </p>

                <p>
                  <strong>
                    Booking ID:
                  </strong>
                  ${booking._id}
                </p>

                <p>
                  <strong>
                    Payment method:
                  </strong>
                  ${
                    paymentMethod ||
                    "Simulated Payment"
                  }
                </p>

                <p>
                  <strong>
                    Amount paid:
                  </strong>
                  ₹${
                    totalAmount ||
                    event.price
                  }
                </p>

              </div>

              <p>
                Your QR ticket is attached
                to this email.
              </p>

              <p>
                Please show the QR code
                at the venue.
              </p>

              <p>
                Thank you for using
                SeatFlow.
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

        emailSent =
          true;

        console.log(
          `Waitlist booking email sent to ${req.user.email}`
        );

      } catch (
        emailError
      ) {
        console.error(
          "Waitlist booking email failed:"
        );

        console.error(
          emailError.message
        );
      }

      // ------------------------------------------------
      // FINAL RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success:
          true,

        message:
          "Payment successful and waitlist booking confirmed",

        booking,

        event,

        seat: {
          _id:
            seat._id,

          seatNumber:
            seat.seatNumber,

          category:
            seat.category,

          status:
            seat.status,
        },

        waitlist:
          waitlistEntry,

        payment: {
          confirmed:
            true,

          method:
            paymentMethod ||
            "simulated",

          amount:
            totalAmount ||
            event.price,
        },

        qrCode,

        email:
          req.user.email,

        emailSent,

        remainingWaitlist:
          remainingEntries.map(
            (entry) => ({
              id:
                entry._id,

              position:
                entry.position,

              status:
                entry.status,
            })
          ),
      });

    } catch (error) {
      console.error(
        "Accept waitlist offer error:"
      );

      console.error(
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to confirm waitlist booking",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// CANCEL WAITLIST ENTRY
// ======================================================

router.delete(
  "/:waitlistId",
  protect,
  async (req, res) => {
    try {
      const {
        waitlistId,
      } = req.params;

      const waitlistEntry =
        await Waitlist.findOne({
          _id:
            waitlistId,

          userId:
            req.user.id,

          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        });

      if (!waitlistEntry) {
        return res.status(404).json({
          success:
            false,

          message:
            "Active waitlist entry not found",
        });
      }

      // ------------------------------------------------
      // SAVE EVENT/CATEGORY
      // ------------------------------------------------

      const eventId =
        waitlistEntry.eventId;

      const seatCategory =
        waitlistEntry.seatCategory;

      // ------------------------------------------------
      // RELEASE OFFERED SEAT
      // ------------------------------------------------

      if (
        waitlistEntry.status ===
          "notified" &&
        waitlistEntry.offeredSeat
      ) {
        const seat =
          await Seat.findById(
            waitlistEntry.offeredSeat
          );

        if (
          seat &&
          seat.status ===
            "locked" &&
          String(
            seat.lockedBy
          ) ===
            String(
              req.user.id
            )
        ) {
          seat.status =
            "available";

          seat.lockedBy =
            null;

          seat.lockedUntil =
            null;

          seat.bookedBy =
            null;

          await seat.save();
        }
      }

      // ------------------------------------------------
      // CANCEL ENTRY
      // ------------------------------------------------

      waitlistEntry.status =
        "cancelled";

      await waitlistEntry.save();

      // ------------------------------------------------
      // RENUMBER REMAINING QUEUE
      // ------------------------------------------------

      const remainingEntries =
        await renumberWaitlist(
          eventId,
          seatCategory
        );

      return res.json({
        success:
          true,

        message:
          "Waitlist entry cancelled",

        waitlist:
          waitlistEntry,

        remainingWaitlist:
          remainingEntries.map(
            (entry) => ({
              id:
                entry._id,

              position:
                entry.position,

              status:
                entry.status,
            })
          ),
      });

    } catch (error) {
      console.error(
        "Cancel waitlist error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to cancel waitlist",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports =
  router;