import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  CheckCircle2,
  XCircle,
  Home,
  Loader2,
  Ban,
} from "lucide-react";

import "./Booking.css";

const API_URL = "http://https://seatflow-ytk1.onrender.com/api";

function Booking() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken")
    );
  };

  // ==========================================
  // FETCH MY BOOKINGS
  // ==========================================

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login to view your bookings.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/bookings/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load bookings"
        );
      }

      setBookings(data.bookings || []);

    } catch (error) {
      console.error(
        "Fetch bookings error:",
        error
      );

      setError(
        error.message ||
          "Unable to load bookings."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD BOOKINGS
  // ==========================================

  useEffect(() => {
    fetchBookings();
  }, []);

  // ==========================================
  // CANCEL BOOKING
  // ==========================================

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ticket?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Cancellation failed"
        );
      }

      alert(
        "Ticket cancelled successfully."
      );

      // Refresh booking history
      await fetchBookings();

    } catch (error) {
      console.error(
        "Cancel booking error:",
        error
      );

      setError(
        error.message ||
          "Unable to cancel booking."
      );

    } finally {
      setCancellingId(null);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-empty">

          <Loader2
            size={50}
            className="loading-icon"
          />

          <h1>
            Loading your bookings...
          </h1>

          <p>
            Please wait while we get
            your booking history.
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // NOT LOGGED IN / ERROR
  // ==========================================

  if (error && bookings.length === 0) {
    return (
      <div className="booking-page">

        <div className="booking-empty">

          <XCircle size={55} />

          <h1>
            Unable to load bookings
          </h1>

          <p>
            {error}
          </p>

          <button
            className="booking-primary-btn"
            onClick={() => navigate("/")}
          >
            <Home size={20} />
            Back to Home
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // NO BOOKINGS
  // ==========================================

  if (bookings.length === 0) {
    return (
      <div className="booking-page">

        <div className="booking-empty">

          <Ticket size={55} />

          <h1>
            No Bookings Yet
          </h1>

          <p>
            You haven't booked any
            tickets yet.
          </p>

          <button
            className="booking-primary-btn"
            onClick={() => navigate("/")}
          >
            <Home size={20} />
            Browse Events
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // BOOKING HISTORY
  // ==========================================

  return (
    <div className="booking-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="booking-header">

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <span className="section-label">
          SEATFLOW
        </span>

        <h1>
          My Bookings
        </h1>

        <p>
          View your booking history and
          manage your tickets.
        </p>

      </div>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div className="booking-error">
          <XCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================
          BOOKING COUNT
      ====================================== */}

      <div className="booking-count">

        <Ticket size={22} />

        <span>
          {bookings.length}{" "}
          {bookings.length === 1
            ? "Booking"
            : "Bookings"}
        </span>

      </div>

      {/* ======================================
          BOOKINGS
      ====================================== */}

      <div className="booking-list">

        {bookings.map((booking) => {

          const event = booking.event;
          const seat = booking.seat;

          const isCancelled =
            booking.status ===
            "cancelled";

          const eventDate =
            event?.date;

          return (
            <div
              className={`booking-card ${
                isCancelled
                  ? "booking-cancelled"
                  : ""
              }`}
              key={booking._id}
            >

              {/* =================================
                  EVENT HEADER
              ================================= */}

              <div className="booking-event-header">

                <div>

                  <span className="event-category">
                    {event?.category ||
                      "EVENT"}
                  </span>

                  <h2>
                    {event?.title ||
                      "Event"}
                  </h2>

                </div>

                <div className="booking-id">

                  <span>
                    Booking ID
                  </span>

                  <strong>
                    {booking._id}
                  </strong>

                </div>

              </div>

              {/* =================================
                  STATUS
              ================================= */}

              <div
                className={`booking-status ${
                  isCancelled
                    ? "status-cancelled"
                    : ""
                }`}
              >

                {isCancelled ? (
                  <XCircle size={28} />
                ) : (
                  <CheckCircle2
                    size={28}
                  />
                )}

                <div>

                  <strong>
                    {isCancelled
                      ? "Booking Cancelled"
                      : "Booking Confirmed"}
                  </strong>

                  <span>
                    {isCancelled
                      ? "This ticket has been cancelled."
                      : "Your ticket is confirmed."}
                  </span>

                </div>

              </div>

              {/* =================================
                  EVENT DETAILS
              ================================= */}

              <div className="booking-details-grid">

                <div className="booking-detail">

                  <CalendarDays
                    size={22}
                  />

                  <div>

                    <span>
                      Date & Time
                    </span>

                    <strong>
                      {formatDate(
                        eventDate
                      )}

                      {" · "}

                      {formatTime(
                        eventDate
                      )}
                    </strong>

                  </div>

                </div>

                <div className="booking-detail">

                  <MapPin size={22} />

                  <div>

                    <span>
                      Venue
                    </span>

                    <strong>
                      {event?.venue ||
                        "Venue unavailable"}
                    </strong>

                  </div>

                </div>

              </div>

              {/* =================================
                  SEAT
              ================================= */}

              <div className="booking-section">

                <h3>
                  Selected Seat
                </h3>

                <div className="seat-list">

                  <div className="seat-badge">

                    {seat?.seatNumber ||
                      "Seat"}

                  </div>

                </div>

              </div>

              {/* =================================
                  PRICE
              ================================= */}

              <div className="booking-section">

                <h3>
                  Booking Information
                </h3>

                <div className="price-row">

                  <span>
                    Booking Status
                  </span>

                  <strong
                    className={
                      isCancelled
                        ? "cancelled-text"
                        : "confirmed-text"
                    }
                  >
                    {isCancelled
                      ? "Cancelled"
                      : "Confirmed"}
                  </strong>

                </div>

                <div className="price-row">

                  <span>
                    Booked On
                  </span>

                  <strong>
                    {formatDate(
                      booking.createdAt
                    )}
                  </strong>

                </div>

              </div>

              {/* =================================
                  ACTIONS
              ================================= */}

              <div className="booking-card-actions">

                {!isCancelled && (
                  <button
                    className="cancel-booking-btn"
                    disabled={
                      cancellingId ===
                      booking._id
                    }
                    onClick={() =>
                      handleCancel(
                        booking._id
                      )
                    }
                  >

                    {cancellingId ===
                    booking._id ? (
                      <>
                        <Loader2
                          size={19}
                          className="loading-icon"
                        />

                        Cancelling...
                      </>
                    ) : (
                      <>
                        <Ban size={19} />

                        Cancel Ticket
                      </>
                    )}

                  </button>
                )}

              </div>

            </div>
          );
        })}

      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <div className="booking-actions">
        <button
  className="booking-cancel-btn"
  onClick={async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ticket?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://https://seatflow-ytk1.onrender.com/api/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Failed to cancel ticket."
        );
        return;
      }

      alert(
        "Ticket cancelled successfully."
      );

      localStorage.removeItem(
        "seatflowBooking"
      );

      navigate("/");
    } catch (error) {
      console.error(
        "Cancellation error:",
        error
      );

      alert(
        "Unable to cancel ticket. Please try again."
      );
    }
  }}
>
  Cancel Ticket
</button>

        <button
          className="booking-primary-btn"
          onClick={() => navigate("/")}
        >
          <Home size={20} />
          Browse More Events
        </button>

      </div>

      <p className="booking-footer">
        Thank you for booking with SeatFlow.
      </p>

    </div>
  );
}

export default Booking;