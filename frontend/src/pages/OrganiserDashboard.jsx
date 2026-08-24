import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  IndianRupee,
  BarChart3,
  Armchair,
  RefreshCw,
  X,
  Plus,
  Clock,
} from "lucide-react";

function OrganiserDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);

  const [selectedSummary, setSelectedSummary] = useState(null);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [generatingSeats, setGeneratingSeats] = useState(null);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    venueId: "",
    date: "",
    time: "",
    premiumPrice: "500",
    standardPrice: "300",
  });

  const token = localStorage.getItem("token");

  // =====================================================
  // LOAD EVENTS
  // =====================================================

  const loadEvents = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://https://seatflow-ytk1.onrender.com/api/events");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load events");
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error("Organiser events error:", error);
      alert(error.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD VENUES FOR CREATE EVENT FORM
  // =====================================================

  const loadVenues = async () => {
    try {
      setLoadingVenues(true);

      const response = await fetch("http://https://seatflow-ytk1.onrender.com/api/venues");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load venues");
      }

      setVenues(data.venues || []);
    } catch (error) {
      console.error("Venues error:", error);
      alert(error.message || "Failed to load venues");
    } finally {
      setLoadingVenues(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadVenues();
  }, []);

  // =====================================================
  // CREATE EVENT
  // =====================================================

  const openCreateEvent = async () => {
    setSelectedSummary(null);
    setSelectedRevenue(null);
    await loadVenues();
    setShowCreateEvent(true);
  };

  const closeCreateEvent = () => {
    if (!creatingEvent) setShowCreateEvent(false);
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const createEvent = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Please login again. Login token is missing.");
      return;
    }

    if (!eventForm.title.trim()) {
      alert("Please enter event name.");
      return;
    }

    if (!eventForm.venueId) {
      alert("Please select a venue.");
      return;
    }

    if (!eventForm.date || !eventForm.time) {
      alert("Please select both event date and event time.");
      return;
    }

    const premium = Number(eventForm.premiumPrice);
    const standard = Number(eventForm.standardPrice);

    if (premium < 0 || standard < 0 || Number.isNaN(premium) || Number.isNaN(standard)) {
      alert("Please enter valid ticket prices.");
      return;
    }

    // Combine the date + time selected by the organiser.
    const eventDate = new Date(`${eventForm.date}T${eventForm.time}:00`);

    if (Number.isNaN(eventDate.getTime())) {
      alert("Invalid date or time.");
      return;
    }

    try {
      setCreatingEvent(true);

      // The backend organiser route expects venueId, date and pricing.
      // It automatically takes the seat capacity from the selected venue.
      const response = await fetch(
        "http://https://seatflow-ytk1.onrender.com/api/organiser/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: eventForm.title.trim(),
            description: eventForm.description.trim(),
            venueId: eventForm.venueId,
            date: eventDate.toISOString(),
            pricing: {
              Premium: premium,
              Standard: standard,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create event");
      }

      alert(
        `Event created successfully!\n\n${
          data.seatsCreated || data.event?.totalSeats || 0
        } seats were created automatically.`
      );

      setShowCreateEvent(false);
      setEventForm({
        title: "",
        description: "",
        venueId: "",
        date: "",
        time: "",
        premiumPrice: "500",
        standardPrice: "300",
      });

      await loadEvents();
    } catch (error) {
      console.error("Create event error:", error);
      alert(error.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  // =====================================================
  // BOOKING SUMMARY
  // =====================================================

  const viewSummary = async (eventId) => {
    try {
      setLoadingSummary(true);

      // The organiser API is the correct protected route from the project.
      let response = await fetch(
        `http://https://seatflow-ytk1.onrender.com/api/organiser/events/${eventId}/summary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Keep compatibility with an older backend route if it exists.
      if (!response.ok) {
        response = await fetch(
          `http://https://seatflow-ytk1.onrender.com/api/events/${eventId}/summary`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to load booking summary");
        return;
      }

      // Support both possible backend response formats.
      const summary = data.summary || {
        totalSeats: data.event?.totalSeats ?? 0,
        availableSeats: data.event?.availableSeats ?? 0,
        totalBookings: data.totalBookings ?? 0,
        premiumBookings: data.byCategory?.Premium?.count ?? 0,
        standardBookings: data.byCategory?.Standard?.count ?? 0,
        revenue: data.totalRevenue ?? 0,
      };

      setSelectedRevenue(null);
      setSelectedSummary({
        ...data,
        summary,
        event: data.event || { title: "Event" },
      });
    } catch (error) {
      console.error("Booking summary error:", error);
      alert("Failed to load booking summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  // =====================================================
  // REVENUE
  // =====================================================

  const viewRevenue = async (eventId) => {
    try {
      setLoadingRevenue(true);

      let response = await fetch(
        `http://https://seatflow-ytk1.onrender.com/api/events/${eventId}/revenue`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Fallback to the project organiser revenue endpoint.
      if (!response.ok) {
        response = await fetch(
          "http://https://seatflow-ytk1.onrender.com/api/organiser/revenue",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to load revenue");
        return;
      }

      // If the fallback returns all-event revenue, select this event.
      if (data.perEvent) {
        const current = data.perEvent.find(
          (item) => String(item.eventId) === String(eventId)
        );

        setSelectedRevenue({
          ...data,
          eventTitle: current?.title || "Event Revenue",
          revenue: {
            premiumTickets: 0,
            premiumRevenue: 0,
            standardTickets: current?.bookings || 0,
            standardRevenue: current?.revenue || 0,
            totalRevenue: current?.revenue || 0,
          },
        });
      } else {
        setSelectedRevenue(data);
      }

      setSelectedSummary(null);
    } catch (error) {
      console.error("Revenue error:", error);
      alert("Failed to load revenue");
    } finally {
      setLoadingRevenue(false);
    }
  };

  // =====================================================
  // GENERATE SEATS
  // =====================================================

  const generateSeats = async (eventId) => {
    const confirmGenerate = window.confirm(
      "Generate seats for this event?"
    );

    if (!confirmGenerate) return;

    try {
      setGeneratingSeats(eventId);

      const response = await fetch(
        `http://https://seatflow-ytk1.onrender.com/api/seats/generate/${eventId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Seats may already have been generated for this event."
        );
        return;
      }

      alert(`${data.count || 0} seats generated successfully.`);
    } catch (error) {
      console.error("Generate seats error:", error);
      alert("Failed to generate seats");
    } finally {
      setGeneratingSeats(null);
    }
  };

  // =====================================================
  // FORMAT DATE + TIME
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) return "Date unavailable";

    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "Date unavailable";

    return value.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const closeSummary = () => setSelectedSummary(null);
  const closeRevenue = () => setSelectedRevenue(null);

  const selectedVenue = venues.find(
    (venue) => String(venue._id) === String(eventForm.venueId)
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={loadingPageStyle}>
        Loading Organiser Dashboard...
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <header style={headerStyle}>
        <div>
          <span style={brandStyle}>SEATFLOW</span>
          <h1 style={titleStyle}>Organiser Dashboard</h1>
          <p style={subtitleStyle}>
            Create events, manage seats, bookings and revenue.
          </p>
        </div>

        <div style={topActionsStyle}>
          <button onClick={loadEvents} style={topButtonStyle}>
            <RefreshCw size={20} />
            Refresh
          </button>

          <button onClick={() => navigate("/")} style={topButtonStyle}>
            <ArrowLeft size={20} />
            Home
          </button>
        </div>
      </header>

      {/* STATISTICS */}
      <section style={statsGridStyle}>
        <StatCard
          icon={<Ticket size={30} />}
          title="Total Events"
          value={events.length}
        />
        <StatCard
          icon={<CalendarDays size={30} />}
          title="Upcoming Events"
          value={events.filter((event) => event.status === "upcoming").length}
        />
      </section>

      {/* EVENT MANAGEMENT */}
      <section>
        <div style={sectionHeaderStyle}>
          <div>
            <span style={sectionLabelStyle}>EVENT MANAGEMENT</span>
            <h2 style={sectionTitleStyle}>Your Events</h2>
          </div>

          <button onClick={openCreateEvent} style={createButtonStyle}>
            <Plus size={21} />
            Create Event
          </button>
        </div>

        {events.length === 0 ? (
          <div style={emptyStyle}>
            <Ticket size={50} color="#9b63ff" />
            <h3>No events found</h3>
            <p>Click “Create Event” to add your first event.</p>
          </div>
        ) : (
          <div style={eventsListStyle}>
            {events.map((event) => (
              <div key={event._id} style={eventCardStyle}>
                {/* EVENT INFO */}
                <div style={{ flex: "1 1 500px" }}>
                  <span style={statusBadgeStyle}>
                    {event.status || "upcoming"}
                  </span>

                  <h3 style={eventTitleStyle}>{event.title}</h3>

                  <div style={detailStyle}>
                    <MapPin size={19} />
                    {event.venue || "Venue unavailable"}
                  </div>

                  <div style={detailStyle}>
                    <CalendarDays size={19} />
                    {formatDateTime(event.date)}
                  </div>

                  <div style={priceRowStyle}>
                    <span style={priceStyle}>
                      Premium: ₹{event.pricing?.Premium ?? event.price ?? 0}
                    </span>
                    <span style={priceStyle}>
                      Standard: ₹{event.pricing?.Standard ?? event.price ?? 0}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div style={actionsStyle}>
                  <ActionButton
                    icon={<BarChart3 size={20} />}
                    text={loadingSummary ? "Loading..." : "Booking Summary"}
                    onClick={() => viewSummary(event._id)}
                    disabled={loadingSummary}
                  />

                  <ActionButton
                    icon={<IndianRupee size={20} />}
                    text={loadingRevenue ? "Loading..." : "Revenue"}
                    onClick={() => viewRevenue(event._id)}
                    disabled={loadingRevenue}
                  />

                  <ActionButton
                    icon={<Armchair size={20} />}
                    text={
                      generatingSeats === event._id
                        ? "Generating..."
                        : "Generate Seats"
                    }
                    onClick={() => generateSeats(event._id)}
                    disabled={generatingSeats === event._id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={footerStyle}>SeatFlow Organiser Management</p>

      {/* =====================================================
          CREATE EVENT MODAL
          ===================================================== */}
      {showCreateEvent && (
        <div style={overlayStyle} onClick={closeCreateEvent}>
          <div
            style={createModalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <span style={modalLabelStyle}>EVENT MANAGEMENT</span>
                <h2 style={modalTitleStyle}>Create New Event</h2>
                <p style={modalSubtitleStyle}>
                  Add the event name, venue, date, time and ticket prices.
                </p>
              </div>

              <button
                onClick={closeCreateEvent}
                disabled={creatingEvent}
                style={closeButtonStyle}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createEvent}>
              <div style={formGridStyle}>
                <FormField label="Event Name" full>
                  <input
                    name="title"
                    value={eventForm.title}
                    onChange={handleEventFormChange}
                    placeholder="Example: SeatFlow Live Concert"
                    style={inputStyle}
                    required
                  />
                </FormField>

                <FormField label="Venue" full>
                  <select
                    name="venueId"
                    value={eventForm.venueId}
                    onChange={handleEventFormChange}
                    style={inputStyle}
                    required
                    disabled={loadingVenues || creatingEvent}
                  >
                    <option value="">
                      {loadingVenues
                        ? "Loading venues..."
                        : "Select a venue"}
                    </option>
                    {venues.map((venue) => (
                      <option key={venue._id} value={venue._id}>
                        {venue.name} — {venue.location} ({venue.capacity} seats)
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Event Date">
                  <input
                    type="date"
                    name="date"
                    value={eventForm.date}
                    onChange={handleEventFormChange}
                    style={inputStyle}
                    required
                  />
                </FormField>

                <FormField label="Event Time">
                  <div style={{ position: "relative" }}>
                    <Clock
                      size={18}
                      style={{
                        position: "absolute",
                        right: 15,
                        top: 15,
                        pointerEvents: "none",
                        color: "#a970ff",
                      }}
                    />
                    <input
                      type="time"
                      name="time"
                      value={eventForm.time}
                      onChange={handleEventFormChange}
                      style={{ ...inputStyle, paddingRight: "48px" }}
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Premium Price">
                  <input
                    type="number"
                    name="premiumPrice"
                    min="0"
                    value={eventForm.premiumPrice}
                    onChange={handleEventFormChange}
                    style={inputStyle}
                    required
                  />
                </FormField>

                <FormField label="Standard Price">
                  <input
                    type="number"
                    name="standardPrice"
                    min="0"
                    value={eventForm.standardPrice}
                    onChange={handleEventFormChange}
                    style={inputStyle}
                    required
                  />
                </FormField>

                <FormField label="Description" full>
                  <textarea
                    name="description"
                    value={eventForm.description}
                    onChange={handleEventFormChange}
                    placeholder="Optional event description"
                    rows="4"
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </FormField>
              </div>

              {selectedVenue && (
                <div style={capacityInfoStyle}>
                  <Armchair size={24} />
                  <div>
                    <strong>{selectedVenue.name}</strong>
                    <span>
                      {selectedVenue.capacity} seats available at this venue.
                      The backend will use this as the event capacity.
                    </span>
                  </div>
                </div>
              )}

              <div style={formActionsStyle}>
                <button
                  type="button"
                  onClick={closeCreateEvent}
                  disabled={creatingEvent}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingEvent || loadingVenues}
                  style={submitButtonStyle}
                >
                  {creatingEvent ? "Creating Event..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING SUMMARY MODAL */}
      {selectedSummary && (
        <div style={overlayStyle} onClick={closeSummary}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <span style={modalLabelStyle}>BOOKING SUMMARY</span>
                <h2 style={modalTitleSmallStyle}>
                  {selectedSummary.event?.title || "Event"}
                </h2>
              </div>
              <button onClick={closeSummary} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            <div style={summaryGridStyle}>
              <ResultCard title="Total Seats" value={selectedSummary.summary?.totalSeats ?? 0} />
              <ResultCard title="Available Seats" value={selectedSummary.summary?.availableSeats ?? 0} />
              <ResultCard title="Total Bookings" value={selectedSummary.summary?.totalBookings ?? 0} />
              <ResultCard title="Premium Bookings" value={selectedSummary.summary?.premiumBookings ?? 0} />
              <ResultCard title="Standard Bookings" value={selectedSummary.summary?.standardBookings ?? 0} />
              <ResultCard title="Revenue" value={`₹${selectedSummary.summary?.revenue ?? 0}`} />
            </div>
          </div>
        </div>
      )}

      {/* REVENUE MODAL */}
      {selectedRevenue && (
        <div style={overlayStyle} onClick={closeRevenue}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <span style={modalLabelStyle}>REVENUE</span>
                <h2 style={modalTitleSmallStyle}>
                  {selectedRevenue.eventTitle || "Event Revenue"}
                </h2>
              </div>
              <button onClick={closeRevenue} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            <div style={summaryGridStyle}>
              <ResultCard
                title="Premium Tickets"
                value={selectedRevenue.revenue?.premiumTickets ?? 0}
              />
              <ResultCard
                title="Premium Revenue"
                value={`₹${selectedRevenue.revenue?.premiumRevenue ?? 0}`}
              />
              <ResultCard
                title="Standard Tickets"
                value={selectedRevenue.revenue?.standardTickets ?? 0}
              />
              <ResultCard
                title="Standard Revenue"
                value={`₹${selectedRevenue.revenue?.standardRevenue ?? 0}`}
              />

              <div style={totalRevenueStyle}>
                <span>Total Revenue</span>
                <strong>
                  ₹{selectedRevenue.revenue?.totalRevenue ?? 0}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// FORM FIELD
// =====================================================

function FormField({ label, children, full = false }) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "9px",
        gridColumn: full ? "1 / -1" : "auto",
      }}
    >
      <span style={formLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({ icon, title, value }) {
  return (
    <div style={statCardStyle}>
      <div style={{ color: "#a970ff" }}>{icon}</div>
      <div>
        <span style={statLabelStyle}>{title}</span>
        <strong style={statValueStyle}>{value}</strong>
      </div>
    </div>
  );
}

// =====================================================
// ACTION BUTTON
// =====================================================

function ActionButton({ icon, text, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "17px 20px",
        borderRadius: "14px",
        border: "1px solid #3a3650",
        background: "linear-gradient(135deg, #171722, #1c1b28)",
        color: "white",
        fontSize: "17px",
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {text}
    </button>
  );
}

// =====================================================
// RESULT CARD
// =====================================================

function ResultCard({ title, value }) {
  return (
    <div style={resultCardStyle}>
      <span style={resultLabelStyle}>{title}</span>
      <strong style={resultValueStyle}>{value}</strong>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0b0914 0%, #151025 50%, #0b0914 100%)",
  color: "white",
  padding: "40px 6%",
  boxSizing: "border-box",
};

const loadingPageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0b0914, #17112b)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "30px",
  marginBottom: "45px",
  flexWrap: "wrap",
};

const brandStyle = {
  color: "#a970ff",
  fontSize: "18px",
  fontWeight: "800",
  letterSpacing: "3px",
};

const titleStyle = {
  fontSize: "clamp(42px, 6vw, 72px)",
  margin: "8px 0",
  lineHeight: "1",
  fontWeight: "800",
};

const subtitleStyle = {
  color: "#a9a4c5",
  fontSize: "20px",
  margin: 0,
};

const topActionsStyle = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
};

const topButtonStyle = {
  padding: "15px 25px",
  borderRadius: "14px",
  border: "1px solid #38354b",
  background: "#15151f",
  color: "white",
  fontSize: "17px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
  marginBottom: "55px",
};

const statCardStyle = {
  background: "linear-gradient(145deg, #15151f, #101018)",
  border: "1px solid #302d45",
  borderRadius: "22px",
  padding: "28px",
  display: "flex",
  alignItems: "center",
  gap: "20px",
};

const statLabelStyle = {
  display: "block",
  color: "#aaa4c5",
  fontSize: "17px",
};

const statValueStyle = {
  display: "block",
  fontSize: "38px",
  marginTop: "5px",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "20px",
  marginBottom: "30px",
  flexWrap: "wrap",
};

const sectionLabelStyle = {
  color: "#a970ff",
  fontWeight: "800",
  letterSpacing: "2px",
};

const sectionTitleStyle = {
  fontSize: "42px",
  margin: "8px 0 0",
};

const createButtonStyle = {
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  color: "white",
  padding: "16px 24px",
  fontSize: "17px",
  fontWeight: "700",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  boxShadow: "0 12px 35px rgba(124,58,237,0.25)",
};

const eventsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const eventCardStyle = {
  background: "linear-gradient(145deg, #15151f, #101018)",
  border: "1px solid #302d45",
  borderRadius: "24px",
  padding: "32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "30px",
  flexWrap: "wrap",
  boxShadow: "0 15px 45px rgba(0,0,0,0.25)",
};

const statusBadgeStyle = {
  display: "inline-block",
  background: "#261b46",
  color: "#b47aff",
  padding: "10px 16px",
  borderRadius: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  marginBottom: "18px",
};

const eventTitleStyle = {
  fontSize: "32px",
  margin: "0 0 18px",
};

const detailStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#aaa4c5",
  fontSize: "18px",
  marginTop: "12px",
};

const priceRowStyle = {
  display: "flex",
  gap: "28px",
  marginTop: "22px",
  flexWrap: "wrap",
};

const priceStyle = {
  color: "#b47aff",
  fontSize: "18px",
  fontWeight: "700",
};

const actionsStyle = {
  flex: "0 1 320px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
  maxWidth: "320px",
};

const emptyStyle = {
  background: "#15151f",
  border: "1px solid #302d45",
  borderRadius: "24px",
  padding: "60px",
  textAlign: "center",
};

const footerStyle = {
  textAlign: "center",
  color: "#77718f",
  marginTop: "55px",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(5, 4, 12, 0.82)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "25px",
  overflowY: "auto",
};

const createModalStyle = {
  width: "100%",
  maxWidth: "850px",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "linear-gradient(145deg, #171522, #0f0f18)",
  border: "1px solid #443b64",
  borderRadius: "26px",
  padding: "32px",
  boxShadow: "0 30px 100px rgba(0,0,0,0.6)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "850px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "linear-gradient(145deg, #171522, #0f0f18)",
  border: "1px solid #443b64",
  borderRadius: "26px",
  padding: "32px",
  boxShadow: "0 30px 100px rgba(0,0,0,0.6)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "30px",
};

const modalLabelStyle = {
  color: "#a970ff",
  fontSize: "15px",
  fontWeight: "800",
  letterSpacing: "2px",
};

const modalTitleStyle = {
  margin: "8px 0 5px",
  fontSize: "32px",
};

const modalTitleSmallStyle = {
  margin: "8px 0 0",
  fontSize: "30px",
};

const modalSubtitleStyle = {
  margin: 0,
  color: "#9994b5",
  fontSize: "16px",
};

const closeButtonStyle = {
  width: "45px",
  height: "45px",
  borderRadius: "12px",
  border: "1px solid #3d3852",
  background: "#191824",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const formLabelStyle = {
  color: "#c9c3e2",
  fontSize: "15px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 15px",
  borderRadius: "12px",
  border: "1px solid #3a3650",
  background: "#101018",
  color: "white",
  fontSize: "16px",
  outline: "none",
};

const capacityInfoStyle = {
  marginTop: "22px",
  padding: "17px",
  borderRadius: "14px",
  border: "1px solid #3d315d",
  background: "rgba(124,58,237,0.10)",
  color: "#cfc7ea",
  display: "flex",
  gap: "13px",
  alignItems: "flex-start",
};

const formActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "28px",
  flexWrap: "wrap",
};

const cancelButtonStyle = {
  padding: "14px 22px",
  borderRadius: "12px",
  border: "1px solid #3a3650",
  background: "#171722",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
};

const submitButtonStyle = {
  padding: "14px 25px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  color: "white",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "18px",
};

const resultCardStyle = {
  background: "#171722",
  border: "1px solid #302d45",
  borderRadius: "18px",
  padding: "25px",
  textAlign: "center",
};

const resultLabelStyle = {
  display: "block",
  color: "#aaa4c5",
  fontSize: "16px",
};

const resultValueStyle = {
  display: "block",
  fontSize: "30px",
  marginTop: "8px",
};

const totalRevenueStyle = {
  gridColumn: "1 / -1",
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  borderRadius: "20px",
  padding: "28px",
  textAlign: "center",
};

export default OrganiserDashboard;