import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  CreditCard,
  Clock3,
} from "lucide-react";

import "./BookingSummary.css";

function BookingSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const data = location.state || {};

  // ==========================================
  // DATA FROM SEAT SELECTION
  // ==========================================

  const event = data.event;

  const selectedSeats =
    data.selectedSeats || [];

  const heldSeats =
    data.heldSeats || [];

  const holdUntil =
    data.holdUntil || null;

  // ==========================================
  // IF DATA IS MISSING
  // ==========================================

  if (!event || selectedSeats.length === 0) {
    return (
      <div className="booking-summary-page">

        <div
          style={{
            maxWidth: "700px",
            margin: "100px auto",
            textAlign: "center",
            padding: "40px",
          }}
        >

          <h1>
            Booking information not found
          </h1>

          <p>
            Please select your seats again.
          </p>

          <button
            className="back-button"
            onClick={() =>
              navigate(`/events/${id}/seats`)
            }
          >
            <ArrowLeft size={20} />

            Back to Seats
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // SEAT HELPERS
  // ==========================================

  const getSeatNumber = (seat) => {
    if (typeof seat === "string") {
      return seat;
    }

    return seat?.seatNumber || "";
  };

  const seatNames = selectedSeats.map(
    getSeatNumber
  );

  // ==========================================
  // PRICE
  // ==========================================

  const pricePerSeat =
    Number(event.price || 0);

  const numberOfSeats =
    selectedSeats.length;

  const ticketAmount =
    numberOfSeats * pricePerSeat;

  const convenienceFee = 50;

  const totalAmount =
    ticketAmount + convenienceFee;

  // ==========================================
  // HOLD TIME
  // ==========================================

  const getRemainingMinutes = () => {
    if (!holdUntil) {
      return 10;
    }

    const remaining =
      new Date(holdUntil).getTime() -
      Date.now();

    if (remaining <= 0) {
      return 0;
    }

    return Math.ceil(
      remaining / 60000
    );
  };

  const remainingMinutes =
    getRemainingMinutes();

  // ==========================================
  // DATE
  // ==========================================

  const eventDate =
    event.date
      ? new Date(event.date)
      : null;

  const formattedDate =
    eventDate
      ? eventDate.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )
      : "Date unavailable";

  const formattedTime =
    eventDate
      ? eventDate.toLocaleTimeString(
          "en-IN",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        )
      : "";

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    navigate(
      `/events/${id}/seats`
    );
  };

  // ==========================================
  // PAYMENT
  // ==========================================

  const handlePayment = () => {
    navigate(
      `/events/${id}/payment`,
      {
        state: {
          event,
          selectedSeats,
          heldSeats,
          holdUntil,
          ticketAmount,
          convenienceFee,
          totalAmount,
        },
      }
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="booking-summary-page">

      {/* ======================================
          BACK
      ====================================== */}

      <button
        className="back-button"
        onClick={handleBack}
      >
        <ArrowLeft size={20} />

        Back to Seats
      </button>

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="summary-header">

        <span className="summary-label">
          BOOKING SUMMARY
        </span>

        <h1>
          Review your booking
        </h1>

        <p>
          Check your seats and payment
          details before continuing.
        </p>

      </div>

      {/* ======================================
          HOLD NOTICE
      ====================================== */}

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto 25px",
          padding: "16px 20px",
          borderRadius: "12px",
          border:
            "1px solid rgba(147, 90, 255, 0.35)",
          background:
            "rgba(147, 90, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >

        <Clock3 size={20} />

        <div>

          <strong>
            Your seats are temporarily held
          </strong>

          <div>
            You have approximately{" "}
            {remainingMinutes} minutes
            to complete payment.
          </div>

        </div>

      </div>

      {/* ======================================
          EVENT CARD
      ====================================== */}

      <section className="summary-event-card">

        <div className="summary-event-left">

          <span className="event-category">
            {event.category ||
              "Event"}
          </span>

          <h2>
            {event.title}
          </h2>

          <div className="summary-event-info">

            <div>

              <CalendarDays size={18} />

              <span>
                {formattedDate}
                {" · "}
                {formattedTime}
              </span>

            </div>

            <div>

              <MapPin size={18} />

              <span>
                {event.venue}
              </span>

            </div>

          </div>

        </div>

        <div className="summary-price">

          <span>
            Price per seat
          </span>

          <strong>
            ₹{pricePerSeat}
          </strong>

        </div>

      </section>

      {/* ======================================
          SELECTED SEATS
      ====================================== */}

      <section className="selected-seats-card">

        <div className="card-title">

          <Ticket size={22} />

          <h2>
            Selected Seats
          </h2>

        </div>

        <div className="selected-seat-list">

          {selectedSeats.map(
            (seat) => {

              const seatNumber =
                getSeatNumber(seat);

              return (
                <span
                  className="selected-seat"
                  key={
                    seat?._id ||
                    seatNumber
                  }
                >
                  {seatNumber}
                </span>
              );
            }
          )}

        </div>

        <div className="seat-count">

          <span>
            Number of seats
          </span>

          <strong>
            {numberOfSeats}
          </strong>

        </div>

      </section>

      {/* ======================================
          PRICE DETAILS
      ====================================== */}

      <section className="price-details-card">

        <h2>
          Price Details
        </h2>

        <div className="price-row">

          <span>
            Tickets ({numberOfSeats})
          </span>

          <strong>
            ₹{ticketAmount}
          </strong>

        </div>

        <div className="price-row">

          <span>
            Convenience fee
          </span>

          <strong>
            ₹{convenienceFee}
          </strong>

        </div>

        <div className="price-divider"></div>

        <div className="total-row">

          <span>
            Total Amount
          </span>

          <strong>
            ₹{totalAmount}
          </strong>

        </div>

      </section>

      {/* ======================================
          PAYMENT
      ====================================== */}

      <button
        className="payment-button"
        onClick={handlePayment}
      >

        <CreditCard size={22} />

        Proceed to Payment

      </button>

    </div>
  );
}

export default BookingSummary;