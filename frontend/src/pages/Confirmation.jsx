import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  // ======================================================
  // GET DATA FROM PAYMENT PAGE
  // ======================================================

  const data =
    location.state || {};

  const booking =
    data.booking || null;

  const bookings =
    data.bookings ||
    (booking ? [booking] : []);

  // ======================================================
  // BOOKING ID
  // ======================================================

  const bookingId =
    data.bookingId ||
    booking?._id ||
    booking?.bookingId ||
    "Booking Confirmed";

  // ======================================================
  // EVENT
  // ======================================================

  const event =
    data.event ||
    booking?.event ||
    null;

  const eventTitle =
    event?.title ||
    booking?.event?.title ||
    "Your Event";

  // ======================================================
  // SEATS
  // ======================================================

  let seatNumbers = [];

  // First try selected seat labels
  if (
    Array.isArray(
      data.selectedSeatLabels
    ) &&
    data.selectedSeatLabels.length > 0
  ) {
    seatNumbers =
      data.selectedSeatLabels;
  }

  // Otherwise get seats from bookings
  if (
    seatNumbers.length === 0
  ) {
    seatNumbers =
      bookings
        .map((item) => {
          if (
            typeof item?.seat ===
            "string"
          ) {
            return item.seat;
          }

          return (
            item?.seat?.seatNumber ||
            item?.seatNumber ||
            null
          );
        })
        .filter(Boolean);
  }

  // ======================================================
  // AMOUNT PAID
  // ======================================================

  let amount = 0;

  // Best source:
  // Complete payment amount from Payment.jsx
  if (
    data.totalAmount !==
      undefined &&
    data.totalAmount !== null
  ) {
    amount =
      Number(data.totalAmount);
  }

  // Otherwise calculate from bookings
  else if (
    bookings.length > 0
  ) {
    amount =
      bookings.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.totalAmount || 0
          ),
        0
      );
  }

  // ======================================================
  // PAYMENT STATUS
  // ======================================================

  const paymentStatus =
    data.paymentStatus ||
    booking?.paymentStatus ||
    "paid";

  // ======================================================
  // PAYMENT METHOD
  // ======================================================

  const paymentMethod =
    data.paymentMethod ||
    booking?.paymentMethod ||
    "card";

  // ======================================================
  // EMAIL
  // ======================================================

  const email =
    data.email ||
    data.customerEmail ||
    booking?.email ||
    "";

  // ======================================================
  // QR CODE
  // ======================================================

  const qrCode =
    data.qrCode ||
    booking?.qrCode ||
    "";

  // ======================================================
  // EVENT DATE
  // ======================================================

  const eventDate =
    event?.date
      ? new Date(event.date)
      : null;

  const formattedDate =
    eventDate &&
    !isNaN(
      eventDate.getTime()
    )
      ? eventDate.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )
      : "";

  const formattedTime =
    eventDate &&
    !isNaN(
      eventDate.getTime()
    )
      ? eventDate.toLocaleTimeString(
          "en-IN",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        )
      : "";

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      style={{
        minHeight:
          "100vh",

        background:
          "linear-gradient(135deg, #100c1f, #090a12)",

        color:
          "white",

        padding:
          "40px 20px",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          width:
            "100%",

          maxWidth:
            "750px",

          background:
            "#171522",

          border:
            "1px solid #39354d",

          borderRadius:
            "24px",

          padding:
            "45px",

          boxShadow:
            "0 20px 70px rgba(0,0,0,0.4)",

          textAlign:
            "center",
        }}
      >
        {/* ==================================================
            SUCCESS ICON
        ================================================== */}

        <div
          style={{
            width:
              "80px",

            height:
              "80px",

            margin:
              "0 auto 25px",

            borderRadius:
              "50%",

            background:
              "linear-gradient(135deg, #7c3aed, #a855f7)",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            fontSize:
              "42px",
          }}
        >
          ✓
        </div>

        {/* ==================================================
            BRAND
        ================================================== */}

        <div
          style={{
            color:
              "#a78bfa",

            fontWeight:
              "700",

            letterSpacing:
              "3px",

            fontSize:
              "14px",

            marginBottom:
              "12px",
          }}
        >
          SEATFLOW
        </div>

        {/* ==================================================
            TITLE
        ================================================== */}

        <h1
          style={{
            fontSize:
              "38px",

            margin:
              "0 0 12px",
          }}
        >
          Booking Confirmed!
        </h1>

        <p
          style={{
            color:
              "#aaa7c5",

            fontSize:
              "17px",

            marginBottom:
              "35px",
          }}
        >
          Your ticket has been
          booked successfully.
        </p>

        {/* ==================================================
            BOOKING DETAILS
        ================================================== */}

        <div
          style={{
            background:
              "#11101a",

            border:
              "1px solid #39354d",

            borderRadius:
              "18px",

            padding:
              "25px",

            textAlign:
              "left",
          }}
        >
          <h2
            style={{
              marginTop:
                0,

              marginBottom:
                "25px",

              color:
                "#c4b5fd",
            }}
          >
            Booking Details
          </h2>

          <div
            style={{
              display:
                "grid",

              gap:
                "20px",
            }}
          >
            {/* BOOKING ID */}

            <div>
              <div
                style={{
                  color:
                    "#8f8ba5",

                  fontSize:
                    "14px",
                }}
              >
                Booking ID
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  fontSize:
                    "18px",

                  fontWeight:
                    "600",

                  wordBreak:
                    "break-all",
                }}
              >
                {bookingId}
              </div>
            </div>

            {/* EVENT */}

            <div>
              <div
                style={{
                  color:
                    "#8f8ba5",

                  fontSize:
                    "14px",
                }}
              >
                Event
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  fontSize:
                    "20px",

                  fontWeight:
                    "600",
                }}
              >
                {eventTitle}
              </div>
            </div>

            {/* DATE AND TIME */}

            {formattedDate && (
              <div>
                <div
                  style={{
                    color:
                      "#8f8ba5",

                    fontSize:
                      "14px",
                  }}
                >
                  Date & Time
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",

                    fontSize:
                      "17px",
                  }}
                >
                  {formattedDate}

                  {formattedTime &&
                    ` · ${formattedTime}`}
                </div>
              </div>
            )}

            {/* VENUE */}

            {event?.venue && (
              <div>
                <div
                  style={{
                    color:
                      "#8f8ba5",

                    fontSize:
                      "14px",
                  }}
                >
                  Venue
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",

                    fontSize:
                      "17px",
                  }}
                >
                  {event.venue}
                </div>
              </div>
            )}

            {/* SEATS */}

            <div>
              <div
                style={{
                  color:
                    "#8f8ba5",

                  fontSize:
                    "14px",
                }}
              >
                Seats
              </div>

              <div
                style={{
                  marginTop:
                    "8px",

                  display:
                    "flex",

                  flexWrap:
                    "wrap",

                  gap:
                    "8px",
                }}
              >
                {seatNumbers.length >
                0 ? (
                  seatNumbers.map(
                    (
                      seat,
                      index
                    ) => (
                      <span
                        key={
                          index
                        }
                        style={{
                          background:
                            "#2a2142",

                          color:
                            "#c4b5fd",

                          padding:
                            "7px 12px",

                          borderRadius:
                            "8px",

                          fontWeight:
                            "600",
                        }}
                      >
                        {seat}
                      </span>
                    )
                  )
                ) : (
                  <span
                    style={{
                      color:
                        "#aaa7c5",
                    }}
                  >
                    Seat details
                    available in
                    your email.
                  </span>
                )}
              </div>
            </div>

            {/* PAYMENT METHOD */}

            <div>
              <div
                style={{
                  color:
                    "#8f8ba5",

                  fontSize:
                    "14px",
                }}
              >
                Payment Method
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  fontSize:
                    "16px",

                  textTransform:
                    "uppercase",

                  fontWeight:
                    "600",
                }}
              >
                {paymentMethod}
              </div>
            </div>

            {/* PAYMENT STATUS */}

            <div>
              <div
                style={{
                  color:
                    "#8f8ba5",

                  fontSize:
                    "14px",
                }}
              >
                Payment Status
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  color:
                    "#4ade80",

                  fontWeight:
                    "700",
                }}
              >
                {paymentStatus.toUpperCase()}
              </div>
            </div>

            {/* ==================================================
                AMOUNT PAID
            ================================================== */}

            <div
              style={{
                borderTop:
                  "1px solid #39354d",

                paddingTop:
                  "20px",
              }}
            >
              <div
                style={{
                  color:
                    "#8f8ba5",

                  fontSize:
                    "14px",
                }}
              >
                Amount Paid
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  fontSize:
                    "30px",

                  fontWeight:
                    "700",

                  color:
                    "#c4b5fd",
                }}
              >
                ₹
                {Number(
                  amount || 0
                ).toFixed(2)}
              </div>
            </div>

            {/* EMAIL */}

            {email && (
              <div>
                <div
                  style={{
                    color:
                      "#8f8ba5",

                    fontSize:
                      "14px",
                  }}
                >
                  Confirmation Email
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",

                    fontSize:
                      "16px",

                    wordBreak:
                      "break-word",
                  }}
                >
                  {email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            QR CODE
        ================================================== */}

        {qrCode && (
          <div
            style={{
              marginTop:
                "30px",

              padding:
                "25px",

              background:
                "white",

              borderRadius:
                "16px",

              display:
                "inline-block",
            }}
          >
            <img
              src={
                qrCode
              }
              alt="SeatFlow Ticket QR Code"
              style={{
                width:
                  "220px",

                height:
                  "220px",

                display:
                  "block",
              }}
            />

            <p
              style={{
                color:
                  "#333",

                margin:
                  "12px 0 0",

                fontWeight:
                  "600",
              }}
            >
              Scan this QR code
              at the venue
            </p>
          </div>
        )}

        {/* ==================================================
            EMAIL MESSAGE
        ================================================== */}

        <p
          style={{
            color:
              "#8f8ba5",

            marginTop:
              "25px",
          }}
        >
          A confirmation email
          with your ticket details
          has been sent to your
          registered email address.
        </p>

        {/* ==================================================
            BUTTONS
        ================================================== */}

        <div
          style={{
            display:
              "flex",

            gap:
              "15px",

            marginTop:
              "30px",

            justifyContent:
              "center",

            flexWrap:
              "wrap",
          }}
        >
          <button
            onClick={() =>
              navigate("/")
            }
            style={{
              padding:
                "13px 25px",

              borderRadius:
                "10px",

              border:
                "1px solid #39354d",

              background:
                "#1d1b29",

              color:
                "white",

              cursor:
                "pointer",

              fontSize:
                "16px",
            }}
          >
            ← Back to Home
          </button>

          <button
            onClick={() =>
              navigate(
                "/my-bookings"
              )
            }
            style={{
              padding:
                "13px 25px",

              border:
                "none",

              borderRadius:
                "10px",

              background:
                "linear-gradient(135deg, #7c3aed, #9333ea)",

              color:
                "white",

              cursor:
                "pointer",

              fontSize:
                "16px",

              fontWeight:
                "600",
            }}
          >
            My Bookings
          </button>

          <button
            onClick={() =>
              navigate("/")
            }
            style={{
              padding:
                "13px 25px",

              borderRadius:
                "10px",

              border:
                "none",

              background:
                "#2a2142",

              color:
                "#c4b5fd",

              cursor:
                "pointer",

              fontSize:
                "16px",

              fontWeight:
                "600",
            }}
          >
            Book Another Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default Confirmation;