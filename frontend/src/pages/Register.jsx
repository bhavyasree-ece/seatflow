import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://https://seatflow-ytk1.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            role: "customer",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      setSuccess(
        "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#11101f",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#1d1b31",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ color: "white" }}>
          Create Account
        </h1>

        <p
          style={{
            color: "#aaa7c5",
            marginBottom: "30px",
          }}
        >
          Create your SeatFlow customer account.
        </p>

        {error && (
          <div
            style={{
              background: "#3a1820",
              color: "#ff8f9d",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#173522",
              color: "#7ee2a8",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label style={{ color: "white" }}>
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Enter your name"
            required
            style={inputStyle}
          />

          <label style={{ color: "white" }}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            required
            style={inputStyle}
          />

          <label style={{ color: "white" }}>
            Phone
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="Enter your phone number"
            style={inputStyle}
          />

          <label style={{ color: "white" }}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Create a password"
            required
            minLength={6}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, #7c3aed, #9333ea)",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        <p
          style={{
            color: "#aaa7c5",
            marginTop: "25px",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#a78bfa",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "12px",
            background: "transparent",
            border: "1px solid #39364f",
            color: "#aaa7c5",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  marginBottom: "18px",
  borderRadius: "10px",
  border: "1px solid #39364f",
  background: "#12111f",
  color: "white",
  boxSizing: "border-box",
};

export default Register;