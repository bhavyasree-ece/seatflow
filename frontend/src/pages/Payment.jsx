import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = "https://seatflow-ytk1.onrender.com";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  const bookingData = location.state || {};

  const event = bookingData.event;

  const selectedSeats =
    bookingData.selectedSeats || [];

  const selectedSeatLabels =
    bookingData.selectedSeatLabels || [];

  const waitlistId =
    bookingData.waitlistId || null;

  const isWaitlistPayment =
    bookingData.isWaitlistPayment === true;

  // ======================================================
  // STATE
  // ======================================================

  const [paymentMethod, setPaymentMethod] =
    useState("card");

  const [cardNumber, setCardNumber] =
    useState("");

  const [expiry, setExpiry] =
    useState("");

  const [cvv, setCvv] =
    useState("");

  const [cardName, setCardName] =
    useState("");

  const [upiId, setUpiId] =
    useState("");

  const [walletNumber, setWalletNumber] =
    useState("");

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  // ======================================================
  // VALIDATE PAGE DATA
  // ======================================================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!event) {
      navigate("/events");
      return;
    }

    if (
      !selectedSeats.length &&
      !isWaitlistPayment
    ) {
      navigate("/events");
    }

    if (
      isWaitlistPayment &&
      !waitlistId
    ) {
      navigate("/waitlist");
    }
  }, [
    token,
    event,
    selectedSeats,
    isWaitlistPayment,
    waitlistId,
    navigate,
  ]);

  // ======================================================
  // PRICE CALCULATION
  // ======================================================

  const ticketPrice = useMemo(() => {
    if (!event) {
      return 0;
    }

    // For waitlist booking, use the event price.
    if (isWaitlistPayment) {
      return Number(event.price) || 0;
    }

    return (
      (Number(event.price) || 0) *
      selectedSeats.length
    );
  }, [
    event,
    selectedSeats.length,
    isWaitlistPayment,
  ]);

  const convenienceFee = useMemo(() => {
    return Math.round(
      ticketPrice * 0.05
    );
  }, [ticketPrice]);

  const totalAmount =
    ticketPrice + convenienceFee;

  // ======================================================
  // FORMAT CARD NUMBER
  // ======================================================

  const handleCardNumberChange = (
    e
  ) => {
    let value =
      e.target.value.replace(
        /\D/g,
        ""
      );

    value =
      value.substring(0, 16);

    value =
      value.replace(
        /(.{4})/g,
        "$1 "
      )
      .trim();

    setCardNumber(value);
  };

  // ======================================================
  // FORMAT EXPIRY
  // ======================================================

  const handleExpiryChange = (
    e
  ) => {
    let value =
      e.target.value.replace(
        /\D/g,
        ""
      );

    value =
      value.substring(0, 4);

    if (value.length >= 3) {
      value =
        value.substring(0, 2) +
        "/" +
        value.substring(2);
    }

    setExpiry(value);
  };

  // ======================================================
  // VALIDATE PAYMENT
  // ======================================================

  const validatePayment = () => {
    setError("");

    if (
      paymentMethod ===
      "card"
    ) {
      const cleanCard =
        cardNumber.replace(
          /\s/g,
          ""
        );

      if (
        cleanCard.length !==
        16
      ) {
        setError(
          "Please enter a valid 16-digit card number."
        );

        return false;
      }

      if (
        !/^\d{2}\/\d{2}$/.test(
          expiry
        )
      ) {
        setError(
          "Please enter expiry date in MM/YY format."
        );

        return false;
      }

      if (
        cvv.length !== 3 ||
        !/^\d{3}$/.test(cvv)
      ) {
        setError(
          "Please enter a valid 3-digit CVV."
        );

        return false;
      }

      if (
        !cardName.trim()
      ) {
        setError(
          "Please enter the cardholder name."
        );

        return false;
      }
    }

    if (
      paymentMethod ===
      "upi"
    ) {
      if (
        !upiId.trim() ||
        !upiId.includes("@")
      ) {
        setError(
          "Please enter a valid UPI ID."
        );

        return false;
      }
    }

    if (
      paymentMethod ===
      "wallet"
    ) {
      const cleanNumber =
        walletNumber.replace(
          /\D/g,
          ""
        );

      if (
        cleanNumber.length !==
        10
      ) {
        setError(
          "Please enter a valid 10-digit mobile number."
        );

        return false;
      }
    }

    return true;
  };

  // ======================================================
  // PAYMENT
  // ======================================================

  const handlePayment = async () => {
    if (processing) {
      return;
    }

    if (!validatePayment()) {
      return;
    }

    if (!token) {
      navigate("/login");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // ==================================================
      // WAITLIST PAYMENT
      // ==================================================

      if (isWaitlistPayment) {
        if (!waitlistId) {
          throw new Error(
            "Waitlist offer information is missing."
          );
        }

        const response =
          await fetch(
            `${API_URL}/api/waitlist/accept/${waitlistId}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                paymentConfirmed:
                  true,

                paymentMethod:
                  paymentMethod,

                totalAmount:
                  totalAmount,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Waitlist booking failed."
          );
        }

        // ----------------------------------------------
        // PAYMENT + BOOKING SUCCESS
        // ----------------------------------------------

        setSuccess(true);

        setTimeout(() => {
          navigate(
            "/confirmation",
            {
              state: {
                booking:
                  data.booking,

                event:
                  data.event ||
                  event,

                seat:
                  data.seat,

                qrCode:
                  data.qrCode,

                waitlistBooking:
                  true,

                emailSent:
                  data.emailSent,
              },
            }
          );
        }, 700);

        return;
      }

      // ==================================================
      // NORMAL BOOKING PAYMENT
      // ==================================================

      const bookings = [];

      for (
        const seatId
        of selectedSeats
      ) {
        const response =
          await fetch(
            `${API_URL}/api/bookings`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                eventId:
                  event._id,

                seatId:
                  seatId,

                paymentMethod:
                  paymentMethod,

                paymentStatus:
                  "paid",

                amount:
                  totalAmount /
                  selectedSeats.length,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Booking failed."
          );
        }

        bookings.push(
          data.booking
        );
      }

      // ----------------------------------------------
      // NORMAL BOOKING SUCCESS
      // ----------------------------------------------

      setSuccess(true);

      const firstBooking = bookings[0];

      setTimeout(() => {
        navigate("/confirmation", {
          state: {
            // Booking information
            bookings,
            booking: firstBooking,
            bookingId:
              firstBooking?._id ||
              firstBooking?.id ||
              firstBooking?.bookingId ||
              "",

            // Event information
            event,

            // Seat information
            selectedSeats,
            selectedSeatLabels,

            // QR code returned by the booking API
            qrCode:
              firstBooking?.qrCode ||
              "",

            // Email information
            email:
              firstBooking?.email ||
              "",
            customerEmail:
              firstBooking?.email ||
              "",
            emailSent:
              firstBooking?.emailSent ||
              false,

            // Payment information
            ticketAmount: ticketPrice,
            convenienceFee,
            totalAmount,
            paymentMethod,
            paymentStatus: "paid",

            // This is a normal booking
            waitlistBooking: false,
          },
        });
      }, 700);

    } catch (err) {
      console.error(
        "Payment error:",
        err
      );

      setError(
        err.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  // ======================================================
  // PAGE GUARD
  // ======================================================

  if (!event) {
    return null;
  }

  // ======================================================
  // SUCCESS SCREEN
  // ======================================================

  if (success) {
    return (
      <div className="payment-page">
        <style>{`
          .payment-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              linear-gradient(
                135deg,
                #f5f3ff,
                #ffffff
              );
            padding: 20px;
            font-family: Arial, sans-serif;
          }

          .success-card {
            background: white;
            width: 100%;
            max-width: 500px;
            padding: 45px 30px;
            border-radius: 20px;
            text-align: center;
            box-shadow:
              0 15px 40px
              rgba(0, 0, 0, 0.1);
          }

          .success-icon {
            width: 75px;
            height: 75px;
            margin: 0 auto 20px;
            border-radius: 50%;
            background: #dcfce7;
            color: #16a34a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            font-weight: bold;
          }

          .success-card h1 {
            color: #18181b;
            margin-bottom: 10px;
          }

          .success-card p {
            color: #71717a;
            line-height: 1.6;
          }
        `}</style>

        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Payment Successful
          </h1>

          <p>
            Your{" "}
            {isWaitlistPayment
              ? "waitlist booking"
              : "booking"}{" "}
            has been confirmed.
          </p>

          <p>
            Redirecting to your
            confirmation...
          </p>

        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN PAYMENT PAGE
  // ======================================================

  return (
    <div className="payment-page">

      <style>{`

        * {
          box-sizing: border-box;
        }

        .payment-page {
          min-height: 100vh;
          background:
            linear-gradient(
              135deg,
              #f8f7ff 0%,
              #ffffff 50%,
              #f3efff 100%
            );

          padding: 35px 20px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .payment-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .payment-header {
          margin-bottom: 28px;
        }

        .payment-header h1 {
          margin: 0;
          color: #18181b;
          font-size: 34px;
          font-weight: 800;
        }

        .payment-header p {
          margin-top: 8px;
          color: #71717a;
        }

        .payment-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.4fr)
            minmax(300px, 0.8fr);

          gap: 25px;

          align-items: start;
        }

        .payment-card,
        .summary-card {
          background: #ffffff;
          border-radius: 18px;
          box-shadow:
            0 10px 35px
            rgba(0, 0, 0, 0.07);
        }

        .payment-card {
          padding: 28px;
        }

        .summary-card {
          padding: 25px;
          position: sticky;
          top: 20px;
        }

        .section-title {
          margin: 0 0 20px;
          color: #18181b;
          font-size: 20px;
        }

        .waitlist-banner {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          color: #5b21b6;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 22px;
          line-height: 1.5;
          font-size: 14px;
        }

        .payment-methods {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);

          gap: 10px;

          margin-bottom: 25px;
        }

        .method-button {
          border: 1px solid #e4e4e7;
          background: #ffffff;
          padding: 14px 8px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          color: #52525b;
        }

        .method-button.active {
          border-color: #7c3aed;
          background: #f5f3ff;
          color: #6d28d9;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #3f3f46;
          font-size: 13px;
          font-weight: 700;
        }

        .form-group input {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #d4d4d8;
          border-radius: 9px;
          outline: none;
          font-size: 15px;
        }

        .form-group input:focus {
          border-color: #7c3aed;
          box-shadow:
            0 0 0 3px
            rgba(124, 58, 237, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 13px 15px;
          border-radius: 9px;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .pay-button {
          width: 100%;
          border: none;
          background: #7c3aed;
          color: white;
          padding: 16px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 8px;
        }

        .pay-button:hover {
          background: #6d28d9;
        }

        .pay-button:disabled {
          background: #a78bfa;
          cursor: not-allowed;
        }

        .secure-text {
          text-align: center;
          color: #71717a;
          font-size: 12px;
          margin-top: 13px;
        }

        .summary-title {
          margin: 0 0 20px;
          font-size: 20px;
          color: #18181b;
        }

        .event-name {
          color: #6d28d9;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 15px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin: 12px 0;
          font-size: 14px;
        }

        .summary-label {
          color: #71717a;
        }

        .summary-value {
          color: #18181b;
          font-weight: 700;
          text-align: right;
        }

        .summary-divider {
          border: none;
          border-top: 1px solid #e4e4e7;
          margin: 20px 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 20px;
          font-weight: 800;
          color: #18181b;
        }

        .total-price {
          color: #7c3aed;
        }

        .back-link {
          border: none;
          background: transparent;
          color: #6d28d9;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
        }

        @media (max-width: 800px) {

          .payment-layout {
            grid-template-columns: 1fr;
          }

          .summary-card {
            position: static;
            order: -1;
          }

        }

        @media (max-width: 500px) {

          .payment-page {
            padding: 20px 12px;
          }

          .payment-header h1 {
            font-size: 28px;
          }

          .payment-card,
          .summary-card {
            padding: 20px;
          }

          .payment-methods {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

      <div className="payment-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="payment-header">

          <button
            className="back-link"
            onClick={() =>
              navigate(
                isWaitlistPayment
                  ? "/waitlist"
                  : `/events/${event._id}`
              )
            }
          >
            ← Back
          </button>

          <h1>
            Complete Payment
          </h1>

          <p>
            Secure your seat by
            completing the payment.
          </p>

        </div>

        <div className="payment-layout">

          {/* ==================================================
              PAYMENT FORM
              ================================================== */}

          <div className="payment-card">

            {isWaitlistPayment && (
              <div className="waitlist-banner">

                🎉 <strong>
                  Waitlist Seat Available
                </strong>

                <br />

                Your offered seat is
                reserved for a limited
                time. Complete payment
                before the offer expires.

              </div>
            )}

            <h2 className="section-title">
              Payment Method
            </h2>

            {/* PAYMENT METHODS */}

            <div className="payment-methods">

              <button
                type="button"
                className={
                  paymentMethod ===
                  "card"
                    ? "method-button active"
                    : "method-button"
                }
                onClick={() =>
                  setPaymentMethod(
                    "card"
                  )
                }
              >
                💳 Card
              </button>

              <button
                type="button"
                className={
                  paymentMethod ===
                  "upi"
                    ? "method-button active"
                    : "method-button"
                }
                onClick={() =>
                  setPaymentMethod(
                    "upi"
                  )
                }
              >
                📱 UPI
              </button>

              <button
                type="button"
                className={
                  paymentMethod ===
                  "wallet"
                    ? "method-button active"
                    : "method-button"
                }
                onClick={() =>
                  setPaymentMethod(
                    "wallet"
                  )
                }
              >
                👛 Wallet
              </button>

            </div>

            {/* ==================================================
                CARD
                ================================================== */}

            {paymentMethod ===
              "card" && (

              <>

                <div className="form-group">

                  <label>
                    Card Number
                  </label>

                  <input
                    type="text"
                    value={
                      cardNumber
                    }
                    onChange={
                      handleCardNumberChange
                    }
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Expiry
                    </label>

                    <input
                      type="text"
                      value={
                        expiry
                      }
                      onChange={
                        handleExpiryChange
                      }
                      placeholder="MM/YY"
                      maxLength={5}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      CVV
                    </label>

                    <input
                      type="password"
                      value={
                        cvv
                      }
                      onChange={(e) =>
                        setCvv(
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              3
                            )
                        )
                      }
                      placeholder="123"
                      maxLength={3}
                    />

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Cardholder Name
                  </label>

                  <input
                    type="text"
                    value={
                      cardName
                    }
                    onChange={(e) =>
                      setCardName(
                        e.target.value
                      )
                    }
                    placeholder="Enter cardholder name"
                  />

                </div>

              </>
            )}

            {/* ==================================================
                UPI
                ================================================== */}

            {paymentMethod ===
              "upi" && (

              <div className="form-group">

                <label>
                  UPI ID
                </label>

                <input
                  type="text"
                  value={
                    upiId
                  }
                  onChange={(e) =>
                    setUpiId(
                      e.target.value
                    )
                  }
                  placeholder="example@upi"
                />

              </div>
            )}

            {/* ==================================================
                WALLET
                ================================================== */}

            {paymentMethod ===
              "wallet" && (

              <div className="form-group">

                <label>
                  Mobile Number
                </label>

                <input
                  type="text"
                  value={
                    walletNumber
                  }
                  onChange={(e) =>
                    setWalletNumber(
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          10
                        )
                    )
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />

              </div>
            )}

            {/* ==================================================
                ERROR
                ================================================== */}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* ==================================================
                PAY
                ================================================== */}

            <button
              type="button"
              className="pay-button"
              disabled={
                processing
              }
              onClick={
                handlePayment
              }
            >
              {processing
                ? "Processing Payment..."
                : `Pay ₹${totalAmount}`}
            </button>

            <div className="secure-text">
              🔒 Secure simulated payment
            </div>

          </div>

          {/* ==================================================
              ORDER SUMMARY
              ================================================== */}

          <div className="summary-card">

            <h2 className="summary-title">
              Booking Summary
            </h2>

            <div className="event-name">
              {event.title}
            </div>

            {event.venue && (
              <div className="summary-row">

                <span className="summary-label">
                  Venue
                </span>

                <span className="summary-value">
                  {event.venue}
                </span>

              </div>
            )}

            {event.date && (
              <div className="summary-row">

                <span className="summary-label">
                  Date
                </span>

                <span className="summary-value">
                  {new Date(
                    event.date
                  ).toLocaleDateString(
                    "en-IN"
                  )}
                </span>

              </div>
            )}

            <div className="summary-row">

              <span className="summary-label">
                Seat
              </span>

              <span className="summary-value">

                {isWaitlistPayment
                  ? (
                    bookingData
                      .selectedSeatLabels
                      ?.join(", ") ||
                    "Offered Seat"
                  )
                  : (
                    selectedSeatLabels
                      .join(", ") ||
                    "Selected seats"
                  )}

              </span>

            </div>

            <div className="summary-row">

              <span className="summary-label">
                Ticket Price
              </span>

              <span className="summary-value">
                ₹{ticketPrice}
              </span>

            </div>

            <div className="summary-row">

              <span className="summary-label">
                Convenience Fee
              </span>

              <span className="summary-value">
                ₹{convenienceFee}
              </span>

            </div>

            <hr className="summary-divider" />

            <div className="total-row">

              <span>
                Total
              </span>

              <span className="total-price">
                ₹{totalAmount}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Payment;