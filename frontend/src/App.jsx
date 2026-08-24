import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import {
  Search,
  MapPin,
  CalendarDays,
  ArrowRight,
  Ticket,
  Music,
  Theater,
  Sparkles,
  Clock3,
  Heart,
  Trash2,
  LogOut,
} from "lucide-react";

import Login from "./pages/Login";
import Register from "./pages/Register";

import EventDetails from "./pages/EventDetails";
import SeatSelection from "./pages/SeatSelection";
import BookingSummary from "./pages/BookingSummary";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import Booking from "./pages/Booking";

import OrganiserDashboard from "./pages/OrganiserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";

// ======================================================
// CATEGORIES
// SPORTS REMOVED
// ======================================================

const categories = [
  {
    name: "Concerts",
    icon: Music,
  },
  {
    name: "Theatre",
    icon: Theater,
  },
];

// ======================================================
// WISHLIST PAGE
// ======================================================

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    try {
      const savedWishlist =
        JSON.parse(
          localStorage.getItem("wishlist")
        ) || [];

      setWishlist(savedWishlist);
    } catch (error) {
      console.error(
        "Wishlist loading error:",
        error
      );

      setWishlist([]);
    }
  }, []);

  const removeFromWishlist = (eventId) => {
    const updatedWishlist =
      wishlist.filter(
        (event) => event._id !== eventId
      );

    setWishlist(updatedWishlist);

    localStorage.setItem(
      "wishlist",
      JSON.stringify(updatedWishlist)
    );
  };

  return (
    <div
      className="app"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* NAVBAR */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() => navigate("/")}
          style={{
            cursor: "pointer",
          }}
        >
          <div className="brand-icon">
            <Ticket size={21} />
          </div>

          <span>SeatFlow</span>
        </div>

        <nav>
          <a href="/">Home</a>

          <a href="/#events">
            Events
          </a>
        </nav>

        <div className="nav-actions">

          <button
            className="login-btn"
            onClick={() =>
              navigate("/booking")
            }
          >
            My Bookings
          </button>

          <button
            className="primary-btn small"
            onClick={() =>
              navigate("/")
            }
          >
            Home
          </button>

        </div>

      </header>

      {/* WISHLIST */}

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 25px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >

          <div>
            <div
              style={{
                color: "#a78bfa",
                fontWeight: "700",
                letterSpacing: "3px",
                fontSize: "14px",
                marginBottom: "10px",
              }}
            >
              YOUR SAVED EVENTS
            </div>

            <h1
              style={{
                fontSize: "42px",
                margin: 0,
              }}
            >
              Wishlist
            </h1>

            <p
              style={{
                color: "#aaa7c5",
                fontSize: "17px",
              }}
            >
              Events you want to remember.
            </p>
          </div>

          <Heart
            size={45}
            color="#a855f7"
          />

        </div>

        {wishlist.length === 0 ? (

          <div
            style={{
              background: "#171522",
              border: "1px solid #39354d",
              borderRadius: "20px",
              padding: "70px 30px",
              textAlign: "center",
            }}
          >

            <Heart
              size={50}
              color="#8f8ba5"
              style={{
                marginBottom: "20px",
              }}
            />

            <h2>
              Your wishlist is empty
            </h2>

            <p
              style={{
                color: "#aaa7c5",
                marginBottom: "30px",
              }}
            >
              Save events you are interested
              in and find them here later.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                navigate("/")
              }
            >
              Explore Events
            </button>

          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "25px",
            }}
          >

            {wishlist.map((event) => (

              <div
                key={event._id}
                style={{
                  background: "#171522",
                  border:
                    "1px solid #39354d",
                  borderRadius: "20px",
                  padding: "25px",
                }}
              >

                <div
                  style={{
                    color: "#a78bfa",
                    fontWeight: "600",
                    marginBottom: "15px",
                  }}
                >
                  {event.category ||
                    "EVENT"}
                </div>

                <h2>
                  {event.title}
                </h2>

                <p
                  style={{
                    color: "#aaa7c5",
                  }}
                >
                  <CalendarDays
                    size={15}
                    style={{
                      verticalAlign:
                        "middle",
                      marginRight: "6px",
                    }}
                  />

                  {event.date
                    ? new Date(
                        event.date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "Date unavailable"}
                </p>

                <p
                  style={{
                    color: "#aaa7c5",
                  }}
                >
                  <MapPin
                    size={15}
                    style={{
                      verticalAlign:
                        "middle",
                      marginRight: "6px",
                    }}
                  />

                  {event.venue ||
                    "Venue unavailable"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "25px",
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    className="primary-btn"
                    onClick={() =>
                      navigate(
                        `/events/${event._id}`
                      )
                    }
                  >
                    Book Now
                  </button>

                  <button
                    className="login-btn"
                    onClick={() =>
                      removeFromWishlist(
                        event._id
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />

                    Remove
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

// ======================================================
// HOME PAGE
// ======================================================

function Home() {

  const navigate =
    useNavigate();

  const [events, setEvents] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ====================================================
  // LOGIN INFORMATION
  // ====================================================

  const token =
    localStorage.getItem(
      "token"
    );

  let currentUser = null;

  try {

    currentUser =
      JSON.parse(
        localStorage.getItem(
          "user"
        )
      );

  } catch (error) {

    currentUser = null;

  }

  const isLoggedIn =
    Boolean(
      token &&
      currentUser
    );

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/");

    window.location.reload();

  };

  // ====================================================
  // LOAD EVENTS
  // ====================================================

  useEffect(() => {

    const fetchEvents =
      async () => {

        try {

          setLoading(true);

          setError("");

          const response =
            await fetch(
              "https://seatflow-ytk1.onrender.com/api/events"
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {

            throw new Error(
              data.message ||
                "Failed to load events"
            );

          }

          setEvents(
            data.events || []
          );

        } catch (err) {

          console.error(
            "Events fetch error:",
            err
          );

          setError(
            err.message
          );

        } finally {

          setLoading(false);

        }

      };

    fetchEvents();

  }, []);

  // ====================================================
  // SEARCH
  // ====================================================

  const filteredEvents =
    events.filter(
      (event) => {

        const text = `
          ${event.title || ""}
          ${event.category || ""}
          ${event.venue || ""}
          ${event.description || ""}
        `.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );

      }
    );

  // ====================================================
  // DATE FORMAT
  // ====================================================

  const formatDate =
    (date) => {

      if (!date) {

        return "Date not available";

      }

      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

    };

  // ====================================================
  // TIME FORMAT
  // ====================================================

  const formatTime =
    (date) => {

      if (!date) return "";

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

  // ====================================================
  // ADD TO WISHLIST
  // ====================================================

  const addToWishlist =
    (event) => {

      try {

        const existing =
          JSON.parse(
            localStorage.getItem(
              "wishlist"
            )
          ) || [];

        const alreadyExists =
          existing.some(
            (item) =>
              item._id ===
              event._id
          );

        if (
          alreadyExists
        ) {

          navigate(
            "/wishlist"
          );

          return;

        }

        const updated = [
          ...existing,
          event,
        ];

        localStorage.setItem(
          "wishlist",
          JSON.stringify(
            updated
          )
        );

        navigate(
          "/wishlist"
        );

      } catch (error) {

        console.error(
          "Wishlist error:",
          error
        );

      }

    };

  // ====================================================
  // HOME
  // ====================================================

  return (

    <div className="app">

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() =>
            navigate("/")
          }
          style={{
            cursor: "pointer",
          }}
        >

          <div className="brand-icon">
            <Ticket size={21} />
          </div>

          <span>
            SeatFlow
          </span>

        </div>

        <nav>

          <a href="#events">
            Events
          </a>

          <a href="#categories">
            Categories
          </a>

          <a href="#how-it-works">
            How it works
          </a>

        </nav>

        {/* LOGIN / USER */}

        <div className="nav-actions">

          {!isLoggedIn ? (

            <>

              <button
                className="login-btn"
                onClick={() =>
                  navigate(
                    "/login"
                  )
                }
              >
                Sign in
              </button>

              <button
                className="primary-btn small"
                onClick={() =>
                  navigate(
                    "/register"
                  )
                }
              >
                Get Started
              </button>

            </>

          ) : (

            <>

              {/* CUSTOMER */}

              {currentUser?.role ===
                "customer" && (

                <>

                  <button
                    className="login-btn"
                    onClick={() =>
                      navigate(
                        "/booking"
                      )
                    }
                  >
                    My Bookings
                  </button>

                  <button
                    className="login-btn"
                    onClick={() =>
                      navigate(
                        "/wishlist"
                      )
                    }
                  >
                    Wishlist
                  </button>

                </>

              )}

              {/* ORGANISER */}

              {currentUser?.role ===
                "organiser" && (

                <button
                  className="login-btn"
                  onClick={() =>
                    navigate(
                      "/organiser"
                    )
                  }
                >
                  Organiser Dashboard
                </button>

              )}

              {/* ADMIN */}

              {currentUser?.role ===
                "admin" && (

                <button
                  className="login-btn"
                  onClick={() =>
                    navigate(
                      "/admin"
                    )
                  }
                >
                  Admin Dashboard
                </button>

              )}

              {/* LOGOUT */}

              <button
                className="primary-btn small"
                onClick={
                  handleLogout
                }
              >
                Logout
              </button>

            </>

          )}

        </div>

      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main>

        {/* HERO */}

        <section className="hero">

          <div className="hero-content">

            <div className="eyebrow">

              <Sparkles size={15} />

              Smarter event booking

            </div>

            <h1>

              Book your moment.

              <br />

              <span>
                Not just a ticket.
              </span>

            </h1>

            <p>
              Discover events, choose your
              perfect seat, and secure your
              experience before it slips away.
            </p>

            <div className="search-box">

              <Search size={21} />

              <input
                type="text"
                placeholder="Search events, concerts..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

              <button
                className="primary-btn"
                onClick={() => {

                  document
                    .getElementById(
                      "events"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });

                }}
              >
                Search
              </button>

            </div>

            <div className="quick-info">

              <div>

                <MapPin
                  size={16}
                />

                Multiple cities

              </div>

              <div>

                <Ticket
                  size={16}
                />

                Secure booking

              </div>

              <div>

                <Clock3
                  size={16}
                />

                Real-time availability

              </div>

            </div>

          </div>

          {/* FEATURED EVENT */}

          <div className="hero-card">

            <div className="ticket-preview">

              <div className="ticket-top">

                <span>
                  FEATURED EVENT
                </span>

                <Sparkles
                  size={18}
                />

              </div>

              {events.length >
              0 ? (

                <>

                  <h2>
                    {
                      events[0]
                        .title
                    }
                  </h2>

                  <div className="ticket-detail">

                    <CalendarDays
                      size={17}
                    />

                    <span>

                      {
                        formatDate(
                          events[0]
                            .date
                        )
                      }

                      {" · "}

                      {
                        formatTime(
                          events[0]
                            .date
                        )
                      }

                    </span>

                  </div>

                  <div className="ticket-detail">

                    <MapPin
                      size={17}
                    />

                    <span>
                      {
                        events[0]
                          .venue
                      }
                    </span>

                  </div>

                  <div className="ticket-divider"></div>

                  <div className="ticket-bottom">

                    <div>

                      <small>
                        Starting from
                      </small>

                      <strong>
                        ₹
                        {
                          events[0]
                            .price
                        }
                      </strong>

                    </div>

                    <button
                      className="ticket-arrow"
                      onClick={() =>
                        navigate(
                          `/events/${events[0]._id}`
                        )
                      }
                    >
                      <ArrowRight
                        size={20}
                      />
                    </button>

                  </div>

                </>

              ) : (

                <>

                  <h2>
                    SeatFlow Events
                  </h2>

                  <p>
                    Discover amazing events.
                  </p>

                </>

              )}

            </div>

          </div>

        </section>

        {/* ==================================================
            CATEGORIES
        ================================================== */}

        <section
          className="categories"
          id="categories"
        >

          <div className="section-heading">

            <div>

              <span className="section-label">
                EXPLORE
              </span>

              <h2>
                Find your kind of experience
              </h2>

            </div>

          </div>

          <div className="category-grid">

            {categories.map(
              (category) => {

                const Icon =
                  category.icon;

                return (

                  <button
                    className="category-card"
                    key={
                      category.name
                    }
                    onClick={() => {

                      const searchValue =
                        category.name ===
                        "Concerts"
                          ? "concert"
                          : "theatre";

                      setSearch(
                        searchValue
                      );

                      document
                        .getElementById(
                          "events"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        });

                    }}
                  >

                    <div className="category-icon">

                      <Icon
                        size={25}
                      />

                    </div>

                    <span>
                      {
                        category.name
                      }
                    </span>

                    <ArrowRight
                      size={18}
                    />

                  </button>

                );

              }
            )}

          </div>

        </section>

        {/* ==================================================
            EVENTS
        ================================================== */}

        <section
          className="events-section"
          id="events"
        >

          <div className="section-heading">

            <div>

              <span className="section-label">
                EVENTS
              </span>

              <h2>
                Available events
              </h2>

            </div>

            <button
              className="view-all"
              onClick={() =>
                setSearch("")
              }
            >
              View all

              <ArrowRight
                size={17}
              />

            </button>

          </div>

          {/* LOADING */}

          {loading && (

            <div className="empty-state">

              <h3>
                Loading events...
              </h3>

              <p>
                Getting the latest events.
              </p>

            </div>

          )}

          {/* ERROR */}

          {!loading &&
            error && (

              <div className="empty-state">

                <h3>
                  Failed to load events
                </h3>

                <p>
                  {error}
                </p>

              </div>

            )}

          {/* NO EVENTS */}

          {!loading &&
            !error &&
            filteredEvents.length ===
              0 && (

              <div className="empty-state">

                <Search
                  size={30}
                />

                <h3>
                  No events found
                </h3>

                <p>
                  Try another search.
                </p>

              </div>

            )}

          {/* EVENT CARDS */}

          {!loading &&
            !error &&
            filteredEvents.length >
              0 && (

              <div className="event-grid">

                {filteredEvents.map(
                  (
                    event,
                    index
                  ) => (

                    <article
                      className="event-card"
                      key={
                        event._id
                      }
                    >

                      <div
                        className={`event-image image-${
                          (index %
                            3) +
                          1
                        }`}
                      >

                        <span>
                          {
                            event.category ||
                            "Event"
                          }
                        </span>

                      </div>

                      <div className="event-content">

                        <h3>
                          {
                            event.title
                          }
                        </h3>

                        <div className="event-meta">

                          <CalendarDays
                            size={15}
                          />

                          {
                            formatDate(
                              event.date
                            )
                          }

                          {event.date && (

                            <>
                              {" · "}

                              {
                                formatTime(
                                  event.date
                                )
                              }
                            </>

                          )}

                        </div>

                        <div className="event-meta">

                          <MapPin
                            size={15}
                          />

                          {
                            event.venue
                          }

                        </div>

                        <div className="event-footer">

                          <div>

                            <small>
                              From
                            </small>

                            <strong>
                              ₹
                              {
                                event.price
                              }
                            </strong>

                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              gap: "8px",
                            }}
                          >

                            <button
                              className="login-btn"
                              title="Add to Wishlist"
                              onClick={() =>
                                addToWishlist(
                                  event
                                )
                              }
                            >
                              <Heart
                                size={17}
                              />
                            </button>

                            <button
                              className="book-btn"
                              onClick={() =>
                                navigate(
                                  `/events/${event._id}`
                                )
                              }
                            >

                              Book

                              <ArrowRight
                                size={16}
                              />

                            </button>

                          </div>

                        </div>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

        </section>

        {/* ==================================================
            TRUST
        ================================================== */}

        <section
          className="trust-section"
          id="how-it-works"
        >

          <div>

            <span className="section-label">
              WHY SEATFLOW
            </span>

            <h2>
              Designed for the rush.
            </h2>

            <p>
              When an event is almost sold out,
              every second matters. SeatFlow is
              designed around fast, reliable and
              fair ticket allocation.
            </p>

          </div>

          <div className="trust-stats">

            <div>

              <strong>
                Real-time
              </strong>

              <span>
                Seat availability
              </span>

            </div>

            <div>

              <strong>
                Fair
              </strong>

              <span>
                Waitlist handling
              </span>

            </div>

            <div>

              <strong>
                Secure
              </strong>

              <span>
                Booking flow
              </span>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}

      <footer>

        <div className="brand">

          <div className="brand-icon">

            <Ticket
              size={18}
            />

          </div>

          <span>
            SeatFlow
          </span>

        </div>

        <p>
          Book smarter. Experience more.
        </p>

      </footer>

    </div>

  );
}

// ======================================================
// APP ROUTES
// ======================================================

function App() {

  return (

    <Routes>

      {/* CUSTOMER */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/events/:id"
        element={<EventDetails />}
      />

      <Route
        path="/events/:id/seats"
        element={<SeatSelection />}
      />

      <Route
        path="/events/:id/summary"
        element={<BookingSummary />}
      />

      <Route
        path="/events/:id/payment"
        element={<Payment />}
      />

      <Route
        path="/events/:id/confirmation"
        element={<Confirmation />}
      />

      <Route
        path="/events/:id/confirmation/:groupId"
        element={<Confirmation />}
      />

      <Route
        path="/confirmation"
        element={<Confirmation />}
      />

      {/* MY BOOKINGS */}

      <Route
        path="/booking"
        element={<Booking />}
      />

      {/* WISHLIST */}

      <Route
        path="/wishlist"
        element={<Wishlist />}
      />

      {/* ORGANISER */}

      <Route
        path="/organiser"
        element={<OrganiserDashboard />}
      />

      {/* ADMIN */}

      <Route
        path="/admin"
        element={<AdminDashboard />}
      />

    </Routes>

  );

}

export default App;