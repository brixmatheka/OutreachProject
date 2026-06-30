import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function MemberLogin() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/auth/login", credentials);
      if (res.data.token) localStorage.setItem("memberToken", res.data.token);
      localStorage.setItem("memberSession", "true");
      localStorage.setItem("memberName", res.data.member.firstName);
      localStorage.setItem("memberLastName", res.data.member.lastName);
      localStorage.setItem("memberId", res.data.member.memberId);

      const redirectPath = localStorage.getItem("redirectAfterLogin") || "/";
      localStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectPath;
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "13px 16px",
    borderRadius: "12px",
    border: `1.5px solid ${focusedField === field ? "#38bdf8" : "#cbd5e1"}`,
    backgroundColor: focusedField === field ? "#fff" : "#f1f5f9",
    outline: "none",
    fontSize: "0.95rem",
    color: "#1e293b",
    transition: "all 0.25s ease",
    boxSizing: "border-box",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(56,189,248,0.15)" : "none",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1e3a5f 0%, #1e40af 25%, #0f2d4a 55%, #0c1a2e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background glow blobs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 65%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", left: "-10%",
        width: "550px", height: "550px",
        background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "52px 52px",
        pointerEvents: "none",
      }} />

      {/* Split layout */}
      <div style={{
        position: "relative",
        display: "flex",
        maxWidth: "860px",
        width: "100%",
        borderRadius: "28px",
        overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        zIndex: 1,
      }}>

        {/* Left panel — branding */}
        <div style={{
          flex: "1",
          background: "linear-gradient(160deg, rgba(14,165,233,0.15) 0%, rgba(56,189,248,0.08) 100%)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "52px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "20px",
        }} className="login-left-panel">
          <img src="/logo.png" alt="Outreach Hope Church" style={{
            width: "64px",
            height: "64px",
            objectFit: "contain",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(14, 165, 233, 0.2)",
            filter: "drop-shadow(0 6px 15px rgba(14,165,233,0.3))",
            marginBottom: "8px"
          }} />

          <div>
            <h1 style={{
              fontSize: "1.85rem",
              fontWeight: "800",
              color: "#f1f5f9",
              margin: "0 0 10px",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}>
              Outreach<br />Hope Church
            </h1>
            <p style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: "240px",
            }}>
              Sign in to access events, giving, prayer requests and more.
            </p>
          </div>

          {/* Feature tags */}
          {["📅 Church Events", "🙏 Prayer Requests", "💳 Online Giving", "💧 Baptism Requests"].map((item) => (
            <div key={item} style={{
              display: "flex", alignItems: "center", gap: "10px",
              fontSize: "0.82rem",
              color: "#94a3b8",
            }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                backgroundColor: "#38bdf8", flexShrink: 0,
              }} />
              {item}
            </div>
          ))}
        </div>

        {/* Right panel — form */}
        <div style={{
          flex: "1",
          background: "rgba(248,250,252,0.97)",
          backdropFilter: "blur(12px)",
          padding: "52px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "1.65rem",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "6px",
              letterSpacing: "-0.03em",
            }}>
              Welcome Back
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
              Sign in to your member account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              padding: "11px 14px",
              borderRadius: "10px",
              fontSize: "0.84rem",
              marginBottom: "20px",
              border: "1px solid #fecaca",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Email */}
            <div>
              <label style={{
                display: "block", marginBottom: "7px",
                fontSize: "0.78rem", fontWeight: "700",
                color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                value={credentials.email}
                onChange={handleChange}
                placeholder="e,g john@example.com"
                style={inputStyle("email")}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", marginBottom: "7px",
                fontSize: "0.78rem", fontWeight: "700",
                color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="password"
                  style={{ ...inputStyle("password"), paddingRight: "58px" }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "13px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "#94a3b8",
                    fontSize: "0.7rem", fontWeight: "800",
                    cursor: "pointer", padding: "4px",
                    letterSpacing: "0.04em",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = "#0ea5e9"}
                  onMouseOut={(e) => e.currentTarget.style.color = "#94a3b8"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "4px",
                background: loading
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)",
                color: loading ? "#94a3b8" : "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "0.93rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.25s ease",
                boxShadow: loading ? "none" : "0 6px 20px rgba(14,165,233,0.3)",
                letterSpacing: "0.01em",
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 10px 28px rgba(14,165,233,0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(14,165,233,0.3)";
                }
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{
                    width: "15px", height: "15px",
                    border: "2px solid rgba(0,0,0,0.1)",
                    borderTopColor: "#64748b",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Signing In...
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            margin: "24px 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          <Link
            to="/signup"
            style={{
              display: "block", textAlign: "center",
              padding: "13px",
              borderRadius: "12px",
              border: "1.5px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#0369a1",
              fontWeight: "700",
              fontSize: "0.88rem",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#0ea5e9";
              e.currentTarget.style.backgroundColor = "#f0f9ff";
              e.currentTarget.style.color = "#0ea5e9";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.color = "#0369a1";
            }}
          >
            Create a New Account
          </Link>

          <p style={{ marginTop: "20px", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
            🔒 Secure &amp; encrypted connection
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #94a3b8; }
        @media (max-width: 640px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default MemberLogin;
