import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  Users,
  CheckCircle2,
  Crown,
  Clock3,
} from "lucide-react";

import "./SeatSelection.css";

const API_URL = "http://localhost:5000";

function SeatSelection() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  // ======================================================
  // WAITLIST OFFER
  // ======================================================

  const waitlistSeatId =
    searchParams.get("waitlistSeat");

  const isWaitlistOffer =
    Boolean(waitlistSeatId);

  // ======================================================
  // STATE
  // ======================================================

  const [event, setEvent] = useState(null);

  const [seats, setSeats] = useState([]);

  const [selectedSeats, setSelectedSeats] =
    useState([]);

  const [selectedSeatLabels, setSelectedSeatLabels] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [seatLoading, setSeatLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ======================================================
  // WAITLIST STATE
  // ======================================================

  const [waitlistLoading, setWaitlistLoading] =
    useState(false);

  const [waitlistMessage, setWaitlistMessage] =
    useState("");

  const [waitlistPosition, setWaitlistPosition] =
    useState(null);

  const [waitlistCategory, setWaitlistCategory] =
    useState("");

  const [offeredSeat, setOfferedSeat] =
    useState(null);

  const [offerExpiresAt, setOfferExpiresAt] =
    useState(null);

  // ======================================================
  // TOKEN
  // ======================================================

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ======================================================
  // FORMAT TIME
  // ======================================================

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // LOAD EVENT + SEATS
  // ======================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // ================================================
        // GET EVENT
        // ================================================

        const eventResponse =
          await fetch(
            `${API_URL}/api/events/${id}`
          );

        const eventData =
          await eventResponse.json();

        if (!eventResponse.ok) {
          throw new Error(
            eventData.message ||
              "Failed to get event"
          );
        }

        setEvent(eventData.event);

        // ================================================
        // GET SEATS
        // ================================================

        const seatResponse =
          await fetch(
            `${API_URL}/api/seats/event/${id}`
          );

        const seatData =
          await seatResponse.json();

        if (!seatResponse.ok) {
          throw new Error(
            seatData.message ||
              "Failed to get seats"
          );
        }

        const loadedSeats =
          seatData.seats || [];

        setSeats(loadedSeats);

        // ================================================
        // WAITLIST OFFER
        // ================================================

        if (waitlistSeatId) {

          if (!token) {

            navigate("/login", {
              state: {
                from:
                  `/events/${id}/seats?waitlistSeat=${waitlistSeatId}`,
              },
            });

            return;
          }

          const offeredSeatFromList =
            loadedSeats.find(
              (seat) =>
                String(seat._id) ===
                String(waitlistSeatId)
            );

          if (!offeredSeatFromList) {

            throw new Error(
              "Your waitlist seat could not be found."
            );
          }

          // ==============================================
          // VERIFY THAT THIS SEAT IS HELD BY ME
          // ==============================================

          const holdResponse =
            await fetch(
              `${API_URL}/api/seats/hold/${waitlistSeatId}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const holdData =
            await holdResponse.json();

          if (!holdResponse.ok) {

            throw new Error(
              holdData.message ||
                "Unable to verify your waitlist seat."
            );
          }

          // ==============================================
          // CHECK WAITLIST OWNERSHIP
          // ==============================================

          if (!holdData.heldByMe) {

            throw new Error(
              "This waitlist seat is no longer reserved for you."
            );
          }

          // ==============================================
          // SAVE OFFER INFORMATION
          // ==============================================

          const seatToUse =
            offeredSeatFromList;

          setOfferedSeat(
            seatToUse
          );

          setOfferExpiresAt(
            holdData.lockedUntil
          );

          setSelectedSeats([
            seatToUse._id,
          ]);

          setSelectedSeatLabels([
            seatToUse.seatNumber,
          ]);

          setWaitlistMessage(
            `Seat ${seatToUse.seatNumber} has been reserved for you.`
          );
        }

      } catch (error) {

        console.error(
          "Seat page loading error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Failed to load event"
        );

      } finally {

        setLoading(false);
      }
    };

    loadData();

  }, [id, waitlistSeatId]);

  // ======================================================
  // HOLD NORMAL SEAT
  // ======================================================

  const holdSeat = async (seat) => {

    if (!token) {

      navigate("/login");

      return false;
    }

    try {

      setSeatLoading(true);
      setErrorMessage("");

      const response =
        await fetch(
          `${API_URL}/api/seats/hold/${seat._id}`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
            "Unable to hold seat"
        );
      }

      setSeats(
        (previousSeats) =>
          previousSeats.map(
            (item) =>
              item._id === seat._id
                ? {
                    ...item,
                    status: "locked",
                  }
                : item
          )
      );

      return true;

    } catch (error) {

      console.error(
        "Hold seat error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to hold seat"
      );

      return false;

    } finally {

      setSeatLoading(false);
    }
  };

  // ======================================================
  // RELEASE NORMAL SEAT
  // ======================================================

  const releaseSeat = async (seatId) => {

    if (!token) return;

    // IMPORTANT:
    // Do not release a waitlist-offered seat
    // using the normal release flow.

    if (
      isWaitlistOffer &&
      String(seatId) ===
        String(waitlistSeatId)
    ) {
      return;
    }

    try {

      await fetch(
        `${API_URL}/api/seats/release/${seatId}`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setSeats(
        (previousSeats) =>
          previousSeats.map(
            (item) =>
              item._id === seatId
                ? {
                    ...item,
                    status:
                      "available",
                  }
                : item
          )
      );

    } catch (error) {

      console.error(
        "Release seat error:",
        error
      );
    }
  };

  // ======================================================
  // SEAT CLICK
  // ======================================================

  const handleSeatClick = async (seat) => {

    if (seatLoading) return;

    // ================================================
    // BOOKED
    // ================================================

    if (
      seat.status === "booked"
    ) {
      return;
    }

    // ================================================
    // WAITLIST OFFERED SEAT
    // ================================================

    if (
      isWaitlistOffer &&
      String(seat._id) ===
        String(waitlistSeatId)
    ) {

      setSelectedSeats([
        seat._id,
      ]);

      setSelectedSeatLabels([
        seat.seatNumber,
      ]);

      setOfferedSeat(seat);

      return;
    }

    // ================================================
    // OTHER LOCKED SEAT
    // ================================================

    if (
      seat.status === "locked"
    ) {
      return;
    }

    // ================================================
    // ALREADY SELECTED
    // ================================================

    if (
      selectedSeats.includes(
        seat._id
      )
    ) {
      return;
    }

    // ================================================
    // NORMAL HOLD
    // ================================================

    const success =
      await holdSeat(seat);

    if (!success) return;

    setSelectedSeats(
      (previous) => [
        ...previous,
        seat._id,
      ]
    );

    setSelectedSeatLabels(
      (previous) => [
        ...previous,
        seat.seatNumber,
      ]
    );
  };

  // ======================================================
  // REMOVE SELECTED SEAT
  // ======================================================

  const handleRemoveSeat = async (
    seatId
  ) => {

    // Waitlist offered seat cannot be
    // released from this normal flow.

    if (
      isWaitlistOffer &&
      String(seatId) ===
        String(waitlistSeatId)
    ) {
      return;
    }

    const index =
      selectedSeats.indexOf(
        seatId
      );

    if (index === -1) return;

    await releaseSeat(
      seatId
    );

    setSelectedSeats(
      (previous) =>
        previous.filter(
          (_, i) =>
            i !== index
        )
    );

    setSelectedSeatLabels(
      (previous) =>
        previous.filter(
          (_, i) =>
            i !== index
        )
    );
  };

  // ======================================================
  // JOIN WAITLIST
  // ======================================================

  const handleJoinWaitlist =
    async (category) => {

      if (!token) {

        navigate("/login");

        return;
      }

      try {

        setWaitlistLoading(
          true
        );

        setWaitlistMessage(
          ""
        );

        setWaitlistPosition(
          null
        );

        setWaitlistCategory(
          category
        );

        const response =
          await fetch(
            `${API_URL}/api/waitlist/join`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                eventId: id,

                seatCategory:
                  category,

                quantity: 1,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to join waitlist"
          );
        }

        setWaitlistMessage(
          data.message ||
            "Successfully joined the waitlist."
        );

        if (
          data.waitlist &&
          data.waitlist.position
        ) {

          setWaitlistPosition(
            data.waitlist.position
          );
        }

      } catch (error) {

        console.error(
          "Join waitlist error:",
          error
        );

        setWaitlistMessage(
          error.message ||
            "Unable to join waitlist."
        );

      } finally {

        setWaitlistLoading(
          false
        );
      }
    };

  // ======================================================
  // CATEGORY HELPERS
  // ======================================================

  const categories = [
    "Premium",
    "Standard",
  ];

  const getCategorySeats =
    (category) => {

      return seats.filter(
        (seat) =>
          seat.category ===
          category
      );
    };

  const getAvailableCategorySeats =
    (category) => {

      return getCategorySeats(
        category
      ).filter(
        (seat) =>
          seat.status ===
          "available"
      );
    };

  // ======================================================
  // CONTINUE TO PAYMENT / SUMMARY
  // ======================================================

  const handleContinue = () => {

    if (
      selectedSeats.length === 0
    ) {

      setErrorMessage(
        "Please select at least one seat."
      );

      return;
    }

    // ================================================
    // NORMAL BOOKING
    // ================================================

    if (!isWaitlistOffer) {

      navigate(
        `/events/${id}/summary`,
        {
          state: {

            event,

            selectedSeats,

            selectedSeatLabels,

            total:
              selectedSeats.length *
              Number(event.price),

            isWaitlistOffer:
              false,
          },
        }
      );

      return;
    }

    // ================================================
    // WAITLIST BOOKING
    // ================================================

    navigate(
      `/events/${id}/summary`,
      {
        state: {

          event,

          selectedSeats,

          selectedSeatLabels,

          total:
            selectedSeats.length *
            Number(event.price),

          // IMPORTANT
          isWaitlistOffer:
            true,

          waitlistSeatId,

          offeredSeat,

          offerExpiresAt,
        },
      }
    );
  };

  // ======================================================
  // BACK
  // ======================================================

  const handleBack = () => {

    navigate(
      `/events/${id}`
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (
      <div className="seat-page">

        <div className="seat-error">

          <h2>
            Loading seats...
          </h2>

        </div>

      </div>
    );
  }

  // ======================================================
  // EVENT ERROR
  // ======================================================

  if (!event) {

    return (
      <div className="seat-page">

        <div className="seat-error">

          <h1>
            Event not found
          </h1>

          <p>
            {errorMessage}
          </p>

          <button
            className="back-btn"
            onClick={() =>
              navigate("/")
            }
          >

            <ArrowLeft
              size={20}
            />

            Back to Home

          </button>

        </div>

      </div>
    );
  }

  // ======================================================
  // NO SEATS
  // ======================================================

  if (
    seats.length === 0
  ) {

    return (
      <div className="seat-page">

        <div className="seat-header">

          <button
            className="back-btn"
            onClick={handleBack}
          >

            <ArrowLeft
              size={20}
            />

            Back to Event

          </button>

        </div>

        <div className="seat-error">

          <h1>
            No seats available
          </h1>

          <p>
            Seats have not been generated
            for this event yet.
          </p>

          {errorMessage && (
            <p>
              {errorMessage}
            </p>
          )}

        </div>

      </div>
    );
  }

  // ======================================================
  // GROUP SEATS BY ROW
  // ======================================================

  const rows = {};

  seats.forEach(
    (seat) => {

      if (!rows[seat.row]) {
        rows[seat.row] = [];
      }

      rows[seat.row].push(
        seat
      );
    }
  );

  const sortedRows =
    Object.keys(rows).sort();

  sortedRows.forEach(
    (row) => {

      rows[row].sort(
        (a, b) =>
          a.seatIndex -
          b.seatIndex
      );
    }
  );

  // ======================================================
  // CATEGORY ROWS
  // ======================================================

  const premiumRows =
    sortedRows.filter(
      (row) =>
        rows[row].some(
          (seat) =>
            seat.category ===
            "Premium"
        )
    );

  const standardRows =
    sortedRows.filter(
      (row) =>
        rows[row].some(
          (seat) =>
            seat.category ===
            "Standard"
        )
    );

  // ======================================================
  // TOTAL
  // ======================================================

  const total =
    selectedSeats.length *
    Number(event.price);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="seat-page">

      {/* ================================================
          WAITLIST OFFER BANNER
      ================================================ */}

      {isWaitlistOffer &&
        offeredSeat && (
          <div
            style={{
              marginBottom:
                "25px",

              padding:
                "20px 24px",

              border:
                "1px solid #8b5cf6",

              borderRadius:
                "16px",

              background:
                "linear-gradient(135deg, #21153d, #171225)",

              color: "white",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: "12px",

                marginBottom:
                  "8px",
              }}
            >

              <CheckCircle2
                size={24}
              />

              <strong
                style={{
                  fontSize:
                    "20px",
                }}
              >
                Your waitlist seat is reserved!
              </strong>

            </div>

            <p
              style={{
                margin:
                  "8px 0",

                color:
                  "#c4b5fd",
              }}
            >

              Seat:
              {" "}
              <strong>
                {offeredSeat.seatNumber}
              </strong>

              {" · "}

              Category:
              {" "}
              <strong>
                {offeredSeat.category}
              </strong>

            </p>

            {offerExpiresAt && (
              <p
                style={{
                  margin:
                    "8px 0 0",

                  color:
                    "#fbbf24",
                }}
              >

                <Clock3
                  size={17}
                  style={{
                    verticalAlign:
                      "middle",
                    marginRight:
                      "6px",
                  }}
                />

                This seat is reserved for
                you for 10 minutes.

                <br />

                Offer expires:
                {" "}
                {new Date(
                  offerExpiresAt
                ).toLocaleString(
                  "en-IN"
                )}

              </p>
            )}

            <p
              style={{
                margin:
                  "12px 0 0",

                color:
                  "#aaa7c5",
              }}
            >
              Select <strong>Continue</strong>
              below to proceed to payment.
            </p>

          </div>
        )}

      {/* ================================================
          HEADER
      ================================================ */}

      <div className="seat-header">

        <button
          className="back-btn"
          onClick={handleBack}
          disabled={
            seatLoading
          }
        >

          <ArrowLeft
            size={21}
          />

          Back to Event

        </button>

        <div className="seat-heading">

          <span className="section-label">
            SEATFLOW
          </span>

          <h1>
            Select your seats
          </h1>

          <p>
            Choose your preferred seats
            for your experience.
          </p>

        </div>

      </div>

      {/* ================================================
          ERROR
      ================================================ */}

      {errorMessage && (
        <div className="seat-error-message">
          {errorMessage}
        </div>
      )}

      {/* ================================================
          EVENT INFORMATION
      ================================================ */}

      <section className="seat-event-card">

        <div className="seat-event-info">

          <h2>
            {event.title}
          </h2>

          <div className="seat-event-detail">

            <CalendarDays
              size={21}
            />

            <span>

              {formatDate(
                event.date
              )}

              {" · "}

              {formatTime(
                event.date
              )}

            </span>

          </div>

          <div className="seat-event-detail">

            <MapPin
              size={21}
            />

            <span>
              {event.venue}
            </span>

          </div>

        </div>

        <div className="seat-price">

          <span>
            Price per seat
          </span>

          <strong>
            ₹{event.price}
          </strong>

        </div>

      </section>

      {/* ================================================
          CATEGORY AVAILABILITY
      ================================================ */}

      <section className="category-availability">

        <div className="availability-heading">

          <Users
            size={24}
          />

          <div>

            <h2>
              Seat Availability
            </h2>

            <p>
              Select from Premium or Standard
              seating.
            </p>

          </div>

        </div>

        <div className="category-cards">

          {categories.map(
            (category) => {

              const categorySeats =
                getCategorySeats(
                  category
                );

              const availableSeats =
                getAvailableCategorySeats(
                  category
                );

              const isFull =
                categorySeats.length >
                  0 &&
                availableSeats.length ===
                  0;

              return (
                <div
                  className={`category-card ${
                    category ===
                    "Premium"
                      ? "premium-card"
                      : "standard-card"
                  }`}
                  key={category}
                >

                  <div className="category-card-top">

                    <div className="category-title">

                      {category ===
                        "Premium" && (
                        <Crown
                          size={21}
                        />
                      )}

                      <strong>
                        {category}
                      </strong>

                    </div>

                    <span
                      className={
                        isFull
                          ? "category-full"
                          : "category-available"
                      }
                    >

                      {categorySeats.length ===
                      0

                        ? "Not available"

                        : isFull

                        ? "Full"

                        : `${availableSeats.length} available`}

                    </span>

                  </div>

                  {isFull && (
                    <button
                      className="waitlist-btn"
                      type="button"
                      onClick={() =>
                        handleJoinWaitlist(
                          category
                        )
                      }
                      disabled={
                        waitlistLoading
                      }
                    >

                      {waitlistLoading &&
                      waitlistCategory ===
                        category

                        ? "Joining..."

                        : `Join ${category} Waitlist`}

                    </button>
                  )}

                </div>
              );
            }
          )}

        </div>

        {/* ================================================
            WAITLIST RESULT
        ================================================ */}

        {waitlistMessage && (
          <div className="waitlist-result">

            <div className="waitlist-result-main">

              <CheckCircle2
                size={21}
              />

              <strong>
                {waitlistMessage}
              </strong>

            </div>

            {waitlistPosition && (
              <p>

                Your waitlist position is #

                {waitlistPosition}

              </p>
            )}

          </div>
        )}

      </section>

      {/* ================================================
          LEGEND
      ================================================ */}

      <div className="seat-legend">

        <div className="legend-item">

          <span className="legend-box available"></span>

          Available

        </div>

        <div className="legend-item">

          <span className="legend-box selected"></span>

          Selected

        </div>

        <div className="legend-item">

          <span className="legend-box booked"></span>

          Booked

        </div>

        <div className="legend-item">

          <span className="legend-box locked"></span>

          Held

        </div>

      </div>

      {/* ================================================
          SCREEN
      ================================================ */}

      <div className="screen">
        SCREEN
      </div>

      {/* ================================================
          PREMIUM SEATS
      ================================================ */}

      {premiumRows.length > 0 && (
        <section className="seat-category-section">

          <div className="seat-category-heading premium-heading">

            <div className="category-heading-icon">

              <Crown
                size={22}
              />

            </div>

            <div>

              <h2>
                Premium Seats
              </h2>

              <p>
                Premium seating area
              </p>

            </div>

          </div>

          <div className="seat-layout">

            {premiumRows.map(
              (row) => (

                <div
                  className="seat-row"
                  key={row}
                >

                  <div className="row-label">
                    {row}
                  </div>

                  <div className="seat-list">

                    {rows[row]
                      .filter(
                        (seat) =>
                          seat.category ===
                          "Premium"
                      )
                      .map(
                        (seat) => {

                          const isSelected =
                            selectedSeats.includes(
                              seat._id
                            );

                          const isBooked =
                            seat.status ===
                            "booked";

                          const isLocked =
                            seat.status ===
                            "locked";

                          const isMyWaitlistSeat =
                            isWaitlistOffer &&
                            String(
                              seat._id
                            ) ===
                              String(
                                waitlistSeatId
                              );

                          return (
                            <button
                              key={
                                seat._id
                              }
                              className={`seat ${
                                isBooked
                                  ? "booked"
                                  : ""
                              } ${
                                isSelected
                                  ? "selected"
                                  : ""
                              } ${
                                isLocked &&
                                !isSelected &&
                                !isMyWaitlistSeat
                                  ? "locked"
                                  : ""
                              } premium-seat`}

                              disabled={
                                isBooked ||
                                (
                                  isLocked &&
                                  !isMyWaitlistSeat
                                ) ||
                                seatLoading
                              }

                              onClick={() =>
                                handleSeatClick(
                                  seat
                                )
                              }

                              title={
                                isMyWaitlistSeat
                                  ? "Your waitlist seat - reserved for you"
                                  : isBooked
                                  ? "Booked"
                                  : isLocked
                                  ? "Currently held"
                                  : `${seat.seatNumber} - Premium`
                              }
                            >

                              {seat.seatIndex}

                            </button>
                          );
                        }
                      )}

                  </div>

                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* ================================================
          STANDARD SEATS
      ================================================ */}

      {standardRows.length > 0 && (
        <section className="seat-category-section">

          <div className="seat-category-heading standard-heading">

            <div className="category-heading-icon">

              <Ticket
                size={22}
              />

            </div>

            <div>

              <h2>
                Standard Seats
              </h2>

              <p>
                Standard seating area
              </p>

            </div>

          </div>

          <div className="seat-layout">

            {standardRows.map(
              (row) => (

                <div
                  className="seat-row"
                  key={row}
                >

                  <div className="row-label">
                    {row}
                  </div>

                  <div className="seat-list">

                    {rows[row]
                      .filter(
                        (seat) =>
                          seat.category ===
                          "Standard"
                      )
                      .map(
                        (seat) => {

                          const isSelected =
                            selectedSeats.includes(
                              seat._id
                            );

                          const isBooked =
                            seat.status ===
                            "booked";

                          const isLocked =
                            seat.status ===
                            "locked";

                          const isMyWaitlistSeat =
                            isWaitlistOffer &&
                            String(
                              seat._id
                            ) ===
                              String(
                                waitlistSeatId
                              );

                          return (
                            <button
                              key={
                                seat._id
                              }

                              className={`seat ${
                                isBooked
                                  ? "booked"
                                  : ""
                              } ${
                                isSelected
                                  ? "selected"
                                  : ""
                              } ${
                                isLocked &&
                                !isSelected &&
                                !isMyWaitlistSeat
                                  ? "locked"
                                  : ""
                              } standard-seat`}

                              disabled={
                                isBooked ||
                                (
                                  isLocked &&
                                  !isMyWaitlistSeat
                                ) ||
                                seatLoading
                              }

                              onClick={() =>
                                handleSeatClick(
                                  seat
                                )
                              }

                              title={
                                isMyWaitlistSeat
                                  ? "Your waitlist seat - reserved for you"
                                  : isBooked
                                  ? "Booked"
                                  : isLocked
                                  ? "Currently held"
                                  : `${seat.seatNumber} - Standard`
                              }
                            >

                              {seat.seatIndex}

                            </button>
                          );
                        }
                      )}

                  </div>

                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* ================================================
          SELECTED SEATS
      ================================================ */}

      <section className="seat-summary">

        <div className="summary-left">

          <div className="summary-icon">

            <Ticket
              size={24}
            />

          </div>

          <div>

            <span>
              Selected seats
            </span>

            <strong>

              {selectedSeatLabels.length ===
              0

                ? "No seats selected"

                : selectedSeatLabels.join(
                    ", "
                  )}

            </strong>

          </div>

        </div>

        <div className="summary-total">

          <span>
            Total
          </span>

          <strong>
            ₹{total}
          </strong>

        </div>

        <button
          className="continue-btn"

          disabled={
            selectedSeats.length ===
              0 ||
            seatLoading
          }

          onClick={
            handleContinue
          }
        >

          {seatLoading
            ? "Holding..."
            : isWaitlistOffer
            ? "Continue to Payment"
            : "Continue"}

        </button>

      </section>

    </div>
  );
}

export default SeatSelection;