const nodemailer = require("nodemailer");

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==========================================
// SEND BOOKING CONFIRMATION EMAIL
// ==========================================

const sendBookingConfirmationEmail = async ({
  to,
  customerName,
  bookingId,
  eventName,
  eventDate,
  venue,
  seatNumber,
  amount,
  qrCodeDataUrl,
}) => {
  try {
    // Convert QR data URL into image buffer
    const base64Data = qrCodeDataUrl.replace(
      /^data:image\/png;base64,/,
      ""
    );

    const qrBuffer = Buffer.from(base64Data, "base64");

    const mailOptions = {
      from: `"SeatFlow" <${process.env.EMAIL_USER}>`,

      to,

      subject: `SeatFlow Booking Confirmation - ${eventName}`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 650px;
          margin: auto;
          padding: 30px;
          background: #f7f7f9;
          color: #222;
        ">

          <div style="
            background: #111827;
            padding: 25px;
            border-radius: 12px;
            color: white;
            text-align: center;
          ">
            <h1 style="margin: 0;">
              SeatFlow
            </h1>

            <p style="margin-bottom: 0;">
              Booking Confirmed
            </p>
          </div>

          <div style="
            background: white;
            margin-top: 20px;
            padding: 25px;
            border-radius: 12px;
          ">

            <h2>
              Hello ${customerName || "Customer"}!
            </h2>

            <p>
              Your ticket booking has been successfully confirmed.
            </p>

            <hr />

            <h3>Booking Details</h3>

            <p>
              <strong>Event:</strong>
              ${eventName}
            </p>

            <p>
              <strong>Date:</strong>
              ${new Date(eventDate).toLocaleString("en-IN")}
            </p>

            <p>
              <strong>Venue:</strong>
              ${venue}
            </p>

            <p>
              <strong>Seat:</strong>
              ${seatNumber}
            </p>

            <p>
              <strong>Amount:</strong>
              ₹${amount}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

            <hr />

            <div style="text-align: center;">

              <h3>Your Entry QR Code</h3>

              <p>
                Show this QR code at the venue.
              </p>

              <img
                src="cid:bookingqr"
                alt="Booking QR Code"
                style="
                  width: 250px;
                  height: 250px;
                "
              />

            </div>

            <hr />

            <p style="color: #666;">
              Thank you for booking with SeatFlow.
            </p>

          </div>

        </div>
      `,

      attachments: [
        {
          filename: "seatflow-booking-qr.png",
          content: qrBuffer,
          cid: "bookingqr",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      "Booking confirmation email sent:",
      info.messageId
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      "Email sending error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendBookingConfirmationEmail,
};