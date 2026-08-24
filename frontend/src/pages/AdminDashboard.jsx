import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  Trash2,
  Plus,
  RefreshCw,
  Armchair,
  Building2,
} from "lucide-react";

function AdminDashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showVenueForm, setShowVenueForm] =
    useState(false);

  const [venueName, setVenueName] =
    useState("");

  const [venueLocation, setVenueLocation] =
    useState("");

  const [venueCapacity, setVenueCapacity] =
    useState("");

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      const eventResponse =
        await fetch(
          "http://localhost:5000/api/events"
        );

      const eventData =
        await eventResponse.json();

      if (eventData.success) {
        setEvents(
          eventData.events || []
        );
      }

      const venueResponse =
        await fetch(
          "http://localhost:5000/api/venues"
        );

      const venueData =
        await venueResponse.json();

      if (venueData.success) {
        setVenues(
          venueData.venues || []
        );
      }
    } catch (error) {
      console.error(
        "Admin data error:",
        error
      );

      alert(
        "Failed to load admin data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // CREATE VENUE
  // ==========================================

  const createVenue = async (event) => {
    event.preventDefault();

    if (
      !venueName.trim() ||
      !venueLocation.trim() ||
      !venueCapacity
    ) {
      alert(
        "Please fill all venue fields."
      );
      return;
    }

    try {
      const response =
        await fetch(
          "http://localhost:5000/api/venues",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name: venueName,
              location: venueLocation,
              capacity:
                Number(venueCapacity),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Failed to create venue"
        );
        return;
      }

      alert(
        "Venue created successfully."
      );

      setVenueName("");
      setVenueLocation("");
      setVenueCapacity("");

      setShowVenueForm(false);

      loadData();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to create venue"
      );
    }
  };

  // ==========================================
  // DELETE VENUE
  // ==========================================

  const deleteVenue = async (venueId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this venue?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `http://localhost:5000/api/venues/${venueId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Failed to delete venue"
        );
        return;
      }

      alert(
        "Venue deleted successfully."
      );

      loadData();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete venue"
      );
    }
  };

  // ==========================================
  // DELETE EVENT
  // ==========================================

  const deleteEvent = async (eventId) => {
    const confirmed =
      window.confirm(
        "Deleting this event will also delete its seats and bookings. Continue?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `http://localhost:5000/api/events/${eventId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Failed to delete event"
        );
        return;
      }

      alert(
        "Event deleted successfully."
      );

      loadData();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete event"
      );
    }
  };

  // ==========================================
  // GENERATE SEATS
  // ==========================================

  const generateSeats = async (eventId) => {
    const confirmed =
      window.confirm(
        "Generate seats for this event?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `http://localhost:5000/api/seats/generate/${eventId}`,
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

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Failed to generate seats"
        );
        return;
      }

      alert(
        `${data.count} seats generated successfully.`
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to generate seats"
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="admin-page">

      {/* HEADER */}

      <header className="admin-header">

        <div>

          <span className="admin-label">
            SEATFLOW
          </span>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Manage events, venues and
            seat layouts.
          </p>

        </div>

        <div className="admin-header-actions">

          <button
            className="admin-refresh"
            onClick={loadData}
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            className="admin-home"
            onClick={() =>
              navigate("/")
            }
          >
            <ArrowLeft size={18} />
            Home
          </button>

        </div>

      </header>

      {/* STATS */}

      <section className="admin-stats">

        <div className="admin-stat-card">

          <Ticket size={25} />

          <div>

            <span>
              Total Events
            </span>

            <strong>
              {events.length}
            </strong>

          </div>

        </div>

        <div className="admin-stat-card">

          <Building2 size={25} />

          <div>

            <span>
              Active Venues
            </span>

            <strong>
              {venues.length}
            </strong>

          </div>

        </div>

      </section>

      {/* VENUES */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span>
              VENUE MANAGEMENT
            </span>

            <h2>
              Venues
            </h2>

          </div>

          <button
            className="admin-add-button"
            onClick={() =>
              setShowVenueForm(
                !showVenueForm
              )
            }
          >
            <Plus size={18} />

            {showVenueForm
              ? "Close"
              : "Add Venue"}
          </button>

        </div>

        {/* VENUE FORM */}

        {showVenueForm && (

          <form
            className="admin-venue-form"
            onSubmit={createVenue}
          >

            <input
              type="text"
              placeholder="Venue name"
              value={venueName}
              onChange={(e) =>
                setVenueName(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="Location"
              value={venueLocation}
              onChange={(e) =>
                setVenueLocation(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Capacity"
              value={venueCapacity}
              onChange={(e) =>
                setVenueCapacity(
                  e.target.value
                )
              }
            />

            <button type="submit">
              Create Venue
            </button>

          </form>

        )}

        {/* VENUE LIST */}

        {venues.length === 0 ? (

          <div className="admin-empty">
            <Building2 size={40} />

            <p>
              No venues available.
            </p>
          </div>

        ) : (

          <div className="admin-list">

            {venues.map((venue) => (

              <div
                className="admin-list-item"
                key={venue._id}
              >

                <div>

                  <h3>
                    {venue.name}
                  </h3>

                  <p>
                    {venue.location}
                  </p>

                  <span>
                    Capacity:{" "}
                    {venue.capacity}
                  </span>

                </div>

                <button
                  className="admin-delete-button"
                  onClick={() =>
                    deleteVenue(
                      venue._id
                    )
                  }
                >
                  <Trash2 size={17} />
                  Delete
                </button>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* EVENTS */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span>
              EVENT MANAGEMENT
            </span>

            <h2>
              Events
            </h2>

          </div>

        </div>

        {events.length === 0 ? (

          <div className="admin-empty">

            <Ticket size={40} />

            <p>
              No events available.
            </p>

          </div>

        ) : (

          <div className="admin-list">

            {events.map((event) => (

              <div
                className="admin-event-item"
                key={event._id}
              >

                <div className="admin-event-info">

                  <span className="admin-event-status">
                    {event.status ||
                      "upcoming"}
                  </span>

                  <h3>
                    {event.title}
                  </h3>

                  <div>

                    <MapPin
                      size={16}
                    />

                    {event.venue}

                  </div>

                  <div>

                    <CalendarDays
                      size={16}
                    />

                    {event.date
                      ? new Date(
                          event.date
                        ).toLocaleString(
                          "en-IN"
                        )
                      : "Date unavailable"}

                  </div>

                  <p>
                    Premium: ₹
                    {event.pricing?.Premium ||
                      event.price ||
                      0}

                    {" | "}

                    Standard: ₹
                    {event.pricing?.Standard ||
                      event.price ||
                      0}
                  </p>

                </div>

                <div className="admin-event-actions">

                  <button
                    onClick={() =>
                      generateSeats(
                        event._id
                      )
                    }
                  >
                    <Armchair size={17} />
                    Generate Seats
                  </button>

                  <button
                    className="admin-delete-button"
                    onClick={() =>
                      deleteEvent(
                        event._id
                      )
                    }
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      <p className="admin-footer">
        SeatFlow Administration
      </p>

    </div>
  );
}

export default AdminDashboard;