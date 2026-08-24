import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket,
  CalendarDays,
  MapPin,
  XCircle,
  ArrowLeft,
  Home,
} from "lucide-react";
import "./MyBookings.css";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("https://seatflow-ytk1.onrender.com/api/bookings/my", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load bookings"
          );
        }

        return data;
      })
      .then((data) => {
        setBookings(data.bookings || []);
      })
      .catch((error) => {
        console.error(
          "Get bookings error:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate]);

  const cancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ticket?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `https://seatflow-ytk1.onrender.com/api/bookings/${bookingId}/cancel`,
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
            "Failed to cancel booking"
        );
        return;
      }

      alert(
        "Ticket cancelled successfully."
      );

      // Refresh bookings
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                status: "cancelled",
              }
            : booking
        )
      );
    } catch (error) {
      console.error(
        "Cancel booking error:",
        error
      );

      alert(
        "Unable to cancel ticket."
      );
    }
  };

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="my-bookings-loading">
          Loading your bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">

      <div className="my-bookings-header">

        <button
          className="my-bookings-back"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <span className="my-bookings-label">
          SEATFLOW
        </span>

        <h1>My Bookings</h1>

        <p>
          View and manage all your tickets.
        </p>

      </div>

      {bookings.length === 0 ? (
        <div className="no-bookings">

          <Ticket size={55} />

          <h2>No bookings found</h2>

          <p>
            You haven't booked any tickets yet.
          </p>

          <button
            className="browse-events-btn"
            onClick={() => navigate("/")}
          >
            <Home size={20} />
            Browse Events
          </button>

        </div>
      ) : (
        <div className="bookings-list">

          {bookings.map((booking) => {

            const event = booking.event;
            const seat = booking.seat;

            return (
              <div
                className="my-booking-card"
                key={booking._id}
              >

                <div className="booking-card-top">

                  <div>
                    <span className="booking-type">
                      {seat?.category ||
                        "Ticket"}
                    </span>

                    <h2>
                      {event?.title ||
                        "Event"}
                    </h2>
                  </div>

                  <span
                    className={`booking-status-badge ${
                      booking.status
                    }`}
                  >
                    {booking.status}
                  </span>

                </div>

                <div className="booking-info-grid">

                  <div className="booking-info">

                    <CalendarDays size={20} />

                    <div>
                      <span>
                        Date
                      </span>

                      <strong>
                        {event?.date
                          ? new Date(
                              event.date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "N/A"}
                      </strong>
                    </div>

                  </div>

                  <div className="booking-info">

                    <MapPin size={20} />

                    <div>
                      <span>
                        Venue
                      </span>

                      <strong>
                        {event?.venue ||
                          "N/A"}
                      </strong>
                    </div>

                  </div>

                  <div className="booking-info">

                    <Ticket size={20} />

                    <div>
                      <span>
                        Seat
                      </span>

                      <strong>
                        {seat?.seatNumber ||
                          "N/A"}
                      </strong>
                    </div>

                  </div>

                </div>

                <div className="booking-card-bottom">

                  <div>
                    <span>
                      Booking ID
                    </span>

                    <strong>
                      {booking._id}
                    </strong>
                  </div>

                  {booking.status ===
                    "confirmed" && (
                    <button
                      className="cancel-booking-btn"
                      onClick={() =>
                        cancelBooking(
                          booking._id
                        )
                      }
                    >
                      <XCircle size={19} />
                      Cancel Ticket
                    </button>
                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default MyBookings;