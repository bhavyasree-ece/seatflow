import React, {
  useEffect,
  useState,
} from "react";

import {
  Clock3,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Armchair,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./Waitlist.css";

const API_URL = "http://https://seatflow-ytk1.onrender.com";

function Waitlist() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  // ==================================================
  // LOAD MY WAITLIST
  // ==================================================

  const loadWaitlist = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/waitlist/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load waitlist"
        );
      }

      setEntries(data.waitlist || []);
    } catch (err) {
      console.error(
        "Waitlist loading error:",
        err
      );

      setError(
        err.message ||
          "Failed to load waitlist"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD WHEN PAGE OPENS
  // ==================================================

  useEffect(() => {
    loadWaitlist();
  }, []);

  // ==================================================
  // ACCEPT WAITLIST OFFER
  //
  // IMPORTANT:
  // DO NOT CALL /accept HERE.
  //
  // First go to Payment page.
  // Payment page will confirm the waitlist
  // only after successful payment.
  // ==================================================

  const acceptOffer = (entry) => {
    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setMessage("");

    // ----------------------------------------------
    // CHECK EVENT
    // ----------------------------------------------

    const event = entry.eventId;

    if (!event) {
      setError(
        "Event information is missing."
      );
      return;
    }

    // ----------------------------------------------
    // CHECK OFFERED SEAT
    // ----------------------------------------------

    const seat = entry.offeredSeat;

    if (!seat) {
      setError(
        "The offered seat information is missing."
      );
      return;
    }

    // ----------------------------------------------
    // CHECK OFFER EXPIRY
    // ----------------------------------------------

    if (
      !entry.offerExpiresAt ||
      new Date(entry.offerExpiresAt) <=
        new Date()
    ) {
      setError(
        "This waitlist offer has expired."
      );

      loadWaitlist();

      return;
    }

    // ----------------------------------------------
    // GO TO PAYMENT PAGE
    // ----------------------------------------------

    navigate("/payment", {
      state: {
        // IMPORTANT FLAG
        isWaitlistPayment: true,

        // WAITLIST INFORMATION
        waitlistId: entry._id,
        waitlistPosition: entry.position,
        waitlistStatus: entry.status,

        // EVENT
        event: event,

        // OFFERED SEAT
        selectedSeats: [seat._id],

        selectedSeatLabels: [
          seat.seatNumber,
        ],

        // CATEGORY
        seatCategory:
          entry.seatCategory,

        // OFFER EXPIRY
        offerExpiresAt:
          entry.offerExpiresAt,
      },
    });
  };

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==================================================
  // FORMAT TIME
  // ==================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ==================================================
  // CHECK WHETHER OFFER IS ACTIVE
  // ==================================================

  const isOfferActive = (entry) => {
    if (entry.status !== "notified") {
      return false;
    }

    if (!entry.offerExpiresAt) {
      return false;
    }

    return (
      new Date(entry.offerExpiresAt) >
      new Date()
    );
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="waitlist-page">
        <div className="waitlist-loading">
          <div className="loading-spinner"></div>

          <h2>
            Loading your waitlist...
          </h2>
        </div>
      </div>
    );
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="waitlist-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="waitlist-header">

        <button
          className="waitlist-back"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={19} />

          Back to Home
        </button>

        <span className="waitlist-label">
          SEATFLOW
        </span>

        <h1>
          My Waitlist
        </h1>

        <p>
          Track your queue position and
          claim seats when they become
          available.
        </p>

      </header>

      {/* ==================================================
          SUCCESS MESSAGE
      ================================================== */}

      {message && (
        <div className="waitlist-message success">

          <CheckCircle2 size={22} />

          <span>
            {message}
          </span>

        </div>
      )}

      {/* ==================================================
          ERROR MESSAGE
      ================================================== */}

      {error && (
        <div className="waitlist-message error">

          <AlertCircle size={22} />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* ==================================================
          EMPTY WAITLIST
      ================================================== */}

      {entries.length === 0 ? (

        <div className="waitlist-empty">

          <Ticket size={55} />

          <h2>
            You're not on any waitlist
          </h2>

          <p>
            When an event is sold out,
            you can join its waitlist here.
          </p>

          <button
            onClick={() => navigate("/")}
          >
            Browse Events
          </button>

        </div>

      ) : (

        <div className="waitlist-list">

          {entries.map((entry) => {

            const event =
              entry.eventId;

            const seat =
              entry.offeredSeat;

            const activeOffer =
              isOfferActive(entry);

            return (

              <article
                className={`waitlist-card ${
                  activeOffer
                    ? "offer-active"
                    : ""
                }`}
                key={entry._id}
              >

                {/* ==================================================
                    TOP SECTION
                ================================================== */}

                <div className="waitlist-card-top">

                  <div>

                    <span className="category-pill">
                      {entry.seatCategory}
                    </span>

                    <h2>
                      {event?.title ||
                        "Event"}
                    </h2>

                  </div>

                  <div className="position">

                    <span>
                      Queue Position
                    </span>

                    <strong>
                      #{entry.position}
                    </strong>

                  </div>

                </div>

                {/* ==================================================
                    EVENT INFORMATION
                ================================================== */}

                <div className="waitlist-info">

                  <div>

                    <CalendarDays
                      size={19}
                    />

                    <span>
                      {formatDate(
                        event?.date
                      )}
                    </span>

                  </div>

                  <div>

                    <Armchair
                      size={19}
                    />

                    <span>
                      {seat
                        ? seat.seatNumber
                        : "Waiting for a seat"}
                    </span>

                  </div>

                </div>

                {/* ==================================================
                    WAITING STATUS
                ================================================== */}

                {entry.status ===
                  "waiting" && (

                  <div className="waitlist-status waiting">

                    <Clock3
                      size={22}
                    />

                    <div>

                      <strong>
                        You're in the queue
                      </strong>

                      <span>
                        We'll offer you a seat
                        when one becomes
                        available.
                      </span>

                    </div>

                  </div>

                )}

                {/* ==================================================
                    NOTIFIED / SEAT OFFER
                ================================================== */}

                {entry.status ===
                  "notified" && (

                  <div className="waitlist-offer">

                    <div className="offer-heading">

                      <CheckCircle2
                        size={24}
                      />

                      <div>

                        <strong>
                          Seat available!
                        </strong>

                        <span>
                          A seat has been
                          reserved for you.
                        </span>

                      </div>

                    </div>

                    {/* OFFERED SEAT */}

                    {seat && (

                      <div className="offered-seat">

                        <span>
                          Offered Seat
                        </span>

                        <strong>
                          {seat.seatNumber}
                        </strong>

                      </div>

                    )}

                    {/* EXPIRY */}

                    <div className="expiry">

                      <Clock3
                        size={18}
                      />

                      <span>
                        Offer expires:
                      </span>

                      <strong>
                        {formatDate(
                          entry.offerExpiresAt
                        )}{" "}

                        {formatTime(
                          entry.offerExpiresAt
                        )}
                      </strong>

                    </div>

                    {/* ==================================================
                        PAYMENT BUTTON
                    ================================================== */}

                    {activeOffer ? (

                      <button
                        className="accept-offer-btn"
                        onClick={() =>
                          acceptOffer(entry)
                        }
                      >
                        Proceed to Payment
                      </button>

                    ) : (

                      <div className="expired-box">

                        <AlertCircle
                          size={18}
                        />

                        This offer has expired.

                      </div>

                    )}

                  </div>

                )}

                {/* ==================================================
                    BOOKED
                ================================================== */}

                {entry.status ===
                  "booked" && (

                  <div className="waitlist-status booked">

                    <CheckCircle2
                      size={22}
                    />

                    <div>

                      <strong>
                        Booking confirmed
                      </strong>

                      <span>
                        Your waitlist seat has
                        been successfully booked.
                      </span>

                    </div>

                  </div>

                )}

                {/* ==================================================
                    EXPIRED
                ================================================== */}

                {entry.status ===
                  "expired" && (

                  <div className="waitlist-status expired">

                    <AlertCircle
                      size={22}
                    />

                    <div>

                      <strong>
                        Offer expired
                      </strong>

                      <span>
                        The seat was offered to
                        the next customer.
                      </span>

                    </div>

                  </div>

                )}

                {/* ==================================================
                    CANCELLED
                ================================================== */}

                {entry.status ===
                  "cancelled" && (

                  <div className="waitlist-status expired">

                    <AlertCircle
                      size={22}
                    />

                    <div>

                      <strong>
                        Waitlist cancelled
                      </strong>

                      <span>
                        You are no longer on
                        this waitlist.
                      </span>

                    </div>

                  </div>

                )}

              </article>

            );
          })}

        </div>

      )}

    </div>
  );
}

export default Waitlist;