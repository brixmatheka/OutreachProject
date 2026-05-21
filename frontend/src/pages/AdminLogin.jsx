import { useState } from "react";
import axios from "axios";

function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/admin/login", credentials);
      localStorage.setItem("token", res.data.token);
      window.location.href = "/admin-dashboard";
    } catch (err) {
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "13px 16px",
    borderRadius: "12px",
    border: `1.5px solid ${focusedField === field ? "#0ea5e9" : "rgba(255,255,255,0.08)"}`,
    backgroundColor: focusedField === field ? "rgba(14,165,233,0.06)" : "rgba(255,255,255,0.04)",
    outline: "none",
    fontSize: "0.95rem",
    color: "#f1f5f9",
    transition: "all 0.25s ease",
    boxSizing: "border-box",
    boxShadow: focusedField === field ? "0 0 0 4px rgba(14,165,233,0.12)" : "none",
    caretColor: "#0ea5e9",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060b14 0%, #0d1b2a 40%, #0a1628 70%, #05080f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Animated background glow blobs */}
      <div style={{
        position: "absolute", top: "-15%", right: "-10%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-15%",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "30%",
        width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        pointerEvents: "none",
      }} />

      {/* Glass card */}
      <div style={{
        position: "relative",
        maxWidth: "420px",
        width: "100%",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "28px",
        padding: "48px 44px",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
        textAlign: "center",
        zIndex: 1,
      }}>

        {/* Icon badge */}
        <img src="/logo.png" alt="Outreach Hope Church Logo" style={{
          width: "76px",
          height: "76px",
          objectFit: "contain",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(14, 165, 233, 0.2)",
          margin: "0 auto 28px auto",
          filter: "drop-shadow(0 6px 15px rgba(14,165,233,0.35))",
          display: "block"
        }} />

        <h2 style={{
          fontSize: "1.85rem",
          fontWeight: "800",
          color: "#f8fafc",
          marginBottom: "8px",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
        }}>
          Admin Portal
        </h2>
        <p style={{
          color: "#64748b",
          marginBottom: "36px",
          fontSize: "0.9rem",
          lineHeight: 1.5,
        }}>
          Secure access to the church management dashboard
        </p>

        {/* Error banner */}
        {error && (
          <div style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "0.85rem",
            marginBottom: "20px",
            textAlign: "left",
            fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Email field */}
          <div style={{ textAlign: "left" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#94a3b8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin@ohc.com"
              style={inputStyle("email")}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Password field */}
          <div style={{ textAlign: "left" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#94a3b8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
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
                placeholder="••••••••"
                style={{ ...inputStyle("password"), paddingRight: "52px" }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "14px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "#475569",
                  fontSize: "0.75rem", fontWeight: "700",
                  cursor: "pointer", padding: "4px",
                  letterSpacing: "0.03em",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "#0ea5e9"}
                onMouseOut={(e) => e.currentTarget.style.color = "#475569"}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              background: loading
                ? "rgba(71,85,105,0.5)"
                : "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              padding: "15px",
              fontSize: "0.95rem",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.25s ease",
              boxShadow: loading ? "none" : "0 8px 24px rgba(14,165,233,0.35)",
              letterSpacing: "0.02em",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(14,165,233,0.45)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(14,165,233,0.35)";
              }
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={{
                  width: "16px", height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Authenticating...
              </span>
            ) : "Sign In to Dashboard"}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "#334155",
          fontSize: "0.8rem",
        }}>
          <span style={{ fontSize: "0.9rem" }}>🔒</span>
          <span>256-bit encrypted · Secure administrative access</span>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::placeholder {
          color: #334155 !important;
        }
      `}</style>
    </div>
  );
}

export default AdminLogin;
