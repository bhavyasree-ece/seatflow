import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Clock3,
  Ticket,
  Users,
} from "lucide-react";

import "./EventDetails.css";

const API_URL = "http://localhost:5000";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD EVENT
  // ==========================================

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/events/${id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load event"
          );
        }

        setEvent(data.event);
      } catch (err) {
        console.error("Event fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="details-page">
        <div className="not-found">
          <h1>Loading event...</h1>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !event) {
    return (
      <div className="details-page">
        <div className="not-found">
          <h1>Event not found</h1>

          <p>
            {error ||
              "The requested event does not exist."}
          </p>

          <button
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DATE
  // ==========================================

  const eventDate = new Date(event.date);

  const formattedDate =
    eventDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formattedTime =
    eventDate.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });

  // ==========================================
  // AVAILABILITY
  // ==========================================

  const availableSeats =
    Number(event.availableSeats ?? event.totalSeats ?? 0);

  const isSoldOut = availableSeats <= 0;

  // ==========================================
  // GO TO SEAT PAGE
  // ==========================================

  const handleBooking = () => {
    navigate(`/events/${event._id}/seats`);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="details-page">

      {/* ======================================
          BACK BUTTON
      ====================================== */}

      <button
        className="back-btn"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={18} />
        Back to Home
      </button>

      {/* ======================================
          EVENT CARD
      ====================================== */}

      <div className="details-card">

        {/* CATEGORY */}

        <div className="details-category">
          {event.category || "Event"}
        </div>

        {/* TITLE */}

        <h1>{event.title}</h1>

        {/* ====================================
            EVENT INFORMATION
        ==================================== */}

        <div className="details-info">

          <div className="detail-item">
            <CalendarDays size={20} />

            <div>
              <span>Date</span>

              <strong>
                {formattedDate}
              </strong>
            </div>
          </div>

          <div className="detail-item">
            <Clock3 size={20} />

            <div>
              <span>Time</span>

              <strong>
                {formattedTime}
              </strong>
            </div>
          </div>

          <div className="detail-item">
            <MapPin size={20} />

            <div>
              <span>Venue</span>

              <strong>
                {event.venue}
              </strong>
            </div>
          </div>

        </div>

        {/* DIVIDER */}

        <div className="details-divider"></div>

        {/* ====================================
            DESCRIPTION
        ==================================== */}

        <div className="description">

          <h2>
            About this event
          </h2>

          <p>
            {event.description ||
              "Enjoy an unforgettable event experience with SeatFlow."}
          </p>

        </div>

        {/* ====================================
            AVAILABILITY CARD
        ==================================== */}

        <div
          style={{
            marginTop: "25px",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #39354d",
            background: "#11101a",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <Users
              size={21}
              color="#a78bfa"
            />

            <strong>
              Seat Availability
            </strong>
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: isSoldOut
                ? "#ff8b9e"
                : "#c4b5fd",
            }}
          >
            {isSoldOut
              ? "All seats are currently booked"
              : `${availableSeats} seats available`}
          </div>

          {isSoldOut && (
            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#aaa7c5",
              }}
            >
              You can join the waitlist and receive
              an email when a seat becomes available.
            </p>
          )}

        </div>

        {/* ====================================
            PRICE + ACTION
        ==================================== */}

        <div className="booking-section">

          <div className="price">

            <span>
              Price per seat
            </span>

            <strong>
              ₹{event.price}
            </strong>

          </div>

          {/* IMPORTANT:
              DO NOT DISABLE THIS BUTTON WHEN SOLD OUT.
              It must open SeatSelection.jsx where
              the waitlist buttons are displayed.
          */}

          <button
            className="book-now-btn"
            onClick={handleBooking}
          >

            <Ticket size={19} />

            {isSoldOut
              ? "Join Waitlist"
              : "Select Seats"}

          </button>

        </div>

      </div>

    </div>
  );
}

export default EventDetails;