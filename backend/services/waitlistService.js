// ======================================================
// WAITLIST SERVICE
// ======================================================

require("dotenv").config();

const Waitlist = require("../models/Waitlist");
const Seat = require("../models/Seat");
const nodemailer = require("nodemailer");

// ======================================================
// EMAIL CONFIGURATION
// ======================================================

const emailUser = process.env.EMAIL_USER;

const emailPassword =
  process.env.EMAIL_PASSWORD ||
  process.env.EMAIL_PASS;

console.log(
  "Waitlist Email User Loaded:",
  Boolean(emailUser)
);

console.log(
  "Waitlist Email Password Loaded:",
  Boolean(emailPassword)
);

// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

// ======================================================
// VERIFY EMAIL
// ======================================================

const verifyEmailConfiguration = async () => {
  try {
    if (!emailUser || !emailPassword) {
      console.error(
        "❌ Waitlist email configuration is missing"
      );

      return false;
    }

    await transporter.verify();

    console.log(
      "✅ Waitlist email configuration verified"
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Waitlist email configuration failed:"
    );

    console.error(error.message);

    return false;
  }
};

verifyEmailConfiguration();

// ======================================================
// OFFER SEAT TO NEXT WAITLIST CUSTOMER
// ======================================================

const offerSeatToNextWaitlistUser = async (seat) => {

  try {

    if (!seat) {

      console.error(
        "❌ Cannot offer waitlist seat: seat missing"
      );

      return null;
    }

    // ==================================================
    // CHECK SEAT
    // ==================================================

    if (seat.status !== "available") {

      console.log(
        `Seat ${seat.seatNumber} is not available`
      );

      return null;
    }

    // ==================================================
    // FIND FIRST WAITING CUSTOMER
    // ==================================================

    const waitlistEntry =
      await Waitlist.findOne({

        eventId: seat.event,

        seatCategory: seat.category,

        status: "waiting",

      })
      .sort({
        position: 1,
        createdAt: 1,
      })
      .populate(
        "userId",
        "name email"
      );

    // ==================================================
    // NO CUSTOMER
    // ==================================================

    if (!waitlistEntry) {

      console.log(
        `No waiting customer for seat ${seat.seatNumber}`
      );

      return null;
    }

    // ==================================================
    // CUSTOMER DETAILS
    // ==================================================

    const customerId =
      waitlistEntry.userId &&
      waitlistEntry.userId._id
        ? waitlistEntry.userId._id
        : waitlistEntry.userId;

    const customerEmail =
      waitlistEntry.userId &&
      waitlistEntry.userId.email
        ? waitlistEntry.userId.email
        : null;

    const customerName =
      waitlistEntry.userId &&
      waitlistEntry.userId.name
        ? waitlistEntry.userId.name
        : "Customer";

    if (!customerId) {

      console.error(
        "❌ Waitlist customer ID missing"
      );

      return null;
    }

    if (!customerEmail) {

      console.error(
        "❌ Waitlist customer email missing"
      );

      return null;
    }

    // ==================================================
    // OFFER DURATION = 10 MINUTES
    // ==================================================

    const OFFER_DURATION =
      10 * 60 * 1000;

    const now = new Date();

    const offerExpiresAt =
      new Date(
        now.getTime() +
          OFFER_DURATION
      );

    // ==================================================
    // LOCK SEAT FOR CUSTOMER
    // ==================================================

    seat.status = "locked";

    seat.lockedBy = customerId;

    seat.lockedUntil =
      offerExpiresAt;

    seat.bookedBy = null;

    await seat.save();

    // ==================================================
    // UPDATE WAITLIST ENTRY
    // ==================================================

    waitlistEntry.status =
      "notified";

    waitlistEntry.notifiedAt =
      now;

    waitlistEntry.offerExpiresAt =
      offerExpiresAt;

    waitlistEntry.offeredSeat =
      seat._id;

    await waitlistEntry.save();

    // ==================================================
    // FRONTEND URL
    // ==================================================

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    ).replace(/\/+$/, "");

    /*
      IMPORTANT

      Previously:

      /waitlist

      was used here.

      That was sending the customer to a page
      that was not properly connected.

      Now we send the customer directly to
      the event seat page and tell the frontend
      which seat was offered.
    */

    const offerLink =
      `${frontendUrl}/events/${seat.event}/seats?waitlistSeat=${seat._id}`;

    // ==================================================
    // EMAIL SUBJECT
    // ==================================================

    const subject =
      "SeatFlow - Seat Available for You";

    // ==================================================
    // TEXT EMAIL
    // ==================================================

    const text = `
Hello ${customerName},

Good news!

A ${seat.category} seat is now available for your waitlist request.

Event seat: ${seat.seatNumber}
Category: ${seat.category}

This seat has been reserved for you for 10 minutes.

Please complete your booking before:

${offerExpiresAt.toLocaleString("en-IN")}

Book your seat now:

${offerLink}

If you do not complete the booking within 10 minutes,
the seat will be offered to the next customer on the waitlist.

Thank you,
SeatFlow
`;

    // ==================================================
    // HTML EMAIL
    // ==================================================

    const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
SeatFlow Waitlist Offer
</title>

</head>

<body
style="
margin:0;
padding:0;
background:#f4f1ff;
font-family:Arial,Helvetica,sans-serif;
"
>

<div
style="
max-width:650px;
margin:40px auto;
background:#ffffff;
border-radius:18px;
overflow:hidden;
border:1px solid #ddd6fe;
"
>

<!-- HEADER -->

<div
style="
background:#7c3aed;
padding:28px;
text-align:center;
"
>

<h1
style="
color:white;
margin:0;
font-size:32px;
"
>
SeatFlow
</h1>

</div>

<!-- CONTENT -->

<div
style="
padding:35px;
"
>

<h2
style="
color:#222;
margin-top:0;
"
>
🎉 Your Waitlist Seat is Available!
</h2>

<p
style="
color:#444;
font-size:16px;
line-height:1.6;
"
>

Hello
<strong>
${customerName}
</strong>,

</p>

<p
style="
color:#444;
font-size:16px;
line-height:1.6;
"
>

A seat has become available from your preferred
<strong>
${seat.category}
</strong>
category.

</p>

<!-- SEAT DETAILS -->

<div
style="
background:#f8f7ff;
padding:22px;
border-radius:12px;
margin:25px 0;
"
>

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
Offer expires:
</strong>

${offerExpiresAt.toLocaleString("en-IN")}

</p>

</div>

<p
style="
color:#7c3aed;
font-size:17px;
font-weight:bold;
"
>

⏰ You have 10 minutes to complete your booking.

</p>

<!-- BOOK NOW -->

<div
style="
text-align:center;
margin:30px 0;
"
>

<a
href="${offerLink}"

style="
display:inline-block;
padding:16px 30px;
background:#7c3aed;
color:white;
text-decoration:none;
border-radius:10px;
font-size:17px;
font-weight:bold;
"
>

BOOK NOW

</a>

</div>

<p
style="
color:#777;
font-size:13px;
line-height:1.6;
"
>

If you do not complete the booking before
the offer expires, the seat will automatically
be offered to the next customer on the waitlist.

</p>

<hr />

<p
style="
color:#888;
font-size:12px;
"
>

This is an automated email from SeatFlow.

</p>

</div>

</div>

</body>

</html>
`;

    // ==================================================
    // SEND EMAIL
    // ==================================================

    try {

      if (!emailUser || !emailPassword) {

        throw new Error(
          "EMAIL_USER or EMAIL_PASSWORD is missing"
        );
      }

      const mailResult =
        await transporter.sendMail({

          from:
            `"SeatFlow" <${emailUser}>`,

          to:
            customerEmail,

          subject,

          text,

          html,

        });

      console.log(
        "✅ WAITLIST EMAIL SENT"
      );

      console.log(
        `To: ${customerEmail}`
      );

      console.log(
        `Message ID: ${mailResult.messageId}`
      );

    } catch (emailError) {

      console.error(
        "❌ WAITLIST EMAIL FAILED"
      );

      console.error(
        emailError.message
      );

      /*
        IMPORTANT:

        We DO NOT release the seat if the email
        fails.

        The seat remains reserved for this
        customer for 10 minutes.
      */
    }

    // ==================================================
    // LOG
    // ==================================================

    console.log(
      "=========================================="
    );

    console.log(
      "WAITLIST OFFER CREATED"
    );

    console.log(
      `Seat: ${seat.seatNumber}`
    );

    console.log(
      `Customer: ${customerEmail}`
    );

    console.log(
      `Expires: ${offerExpiresAt.toISOString()}`
    );

    console.log(
      `Book URL: ${offerLink}`
    );

    console.log(
      "=========================================="
    );

    return waitlistEntry;

  } catch (error) {

    console.error(
      "❌ Waitlist seat offer error:"
    );

    console.error(
      error.message
    );

    throw error;
  }
};

// ======================================================
// RELEASE EXPIRED WAITLIST OFFERS
// ======================================================

const releaseExpiredWaitlistOffers =
  async () => {

    try {

      const now =
        new Date();

      const expiredOffers =
        await Waitlist.find({

          status: "notified",

          offerExpiresAt: {
            $lte: now,
          },

        });

      if (
        expiredOffers.length === 0
      ) {

        return;
      }

      console.log(
        `Found ${expiredOffers.length} expired waitlist offer(s)`
      );

      for (
        const waitlistEntry
        of expiredOffers
      ) {

        const seat =
          await Seat.findById(
            waitlistEntry.offeredSeat
          );

        // ==========================================
        // MARK OFFER EXPIRED
        // ==========================================

        waitlistEntry.status =
          "expired";

        await waitlistEntry.save();

        if (!seat) {

          continue;
        }

        // ==========================================
        // VERIFY LOCK OWNER
        // ==========================================

        const ownsLock =
          seat.status === "locked" &&
          String(
            seat.lockedBy
          ) ===
            String(
              waitlistEntry.userId
            );

        if (!ownsLock) {

          continue;
        }

        // ==========================================
        // RELEASE SEAT
        // ==========================================

        seat.status =
          "available";

        seat.lockedBy =
          null;

        seat.lockedUntil =
          null;

        seat.bookedBy =
          null;

        await seat.save();

        console.log(
          `Released expired waitlist seat ${seat.seatNumber}`
        );

        // ==========================================
        // FIND NEXT CUSTOMER
        // ==========================================

        const nextWaitlistEntry =
          await Waitlist.findOne({

            eventId:
              seat.event,

            seatCategory:
              seat.category,

            status:
              "waiting",

          }).sort({

            position: 1,

            createdAt: 1,

          });

        // ==========================================
        // OFFER TO NEXT CUSTOMER
        // ==========================================

        if (
          nextWaitlistEntry
        ) {

          await offerSeatToNextWaitlistUser(
            seat
          );

        } else {

          console.log(
            `No more waitlist customers for seat ${seat.seatNumber}`
          );

        }
      }

    } catch (error) {

      console.error(
        "❌ Release expired waitlist offers error:"
      );

      console.error(
        error.message
      );
    }
  };

// ======================================================
// EXPORT
// ======================================================

module.exports = {

  offerSeatToNextWaitlistUser,

  releaseExpiredWaitlistOffers,

};