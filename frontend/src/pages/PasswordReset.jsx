import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function PasswordReset({ mode = "forgot" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const isReset = mode === "reset";

  const submit = async (event) => {
    event.preventDefault();
    setStatus(null);
    if (isReset && !token) return setStatus({ type: "error", message: "This reset link is missing its secure token. Request a new link." });
    if (isReset && password.length < 8) return setStatus({ type: "error", message: "Your new password must be at least 8 characters." });
    if (isReset && password !== confirmPassword) return setStatus({ type: "error", message: "The passwords do not match." });
    setLoading(true);
    try {
      const response = isReset
        ? await axios.post("/auth/reset-password", { token, password })
        : await axios.post("/auth/forgot-password", { email });
      setStatus({ type: "success", message: response.data.message });
      if (isReset) window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "The request could not be completed. Please try again." });
    } finally { setLoading(false); }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px", background: "linear-gradient(150deg,#082f49,#0f172a 60%,#172554)", fontFamily: "Inter,Segoe UI,sans-serif" }}>
      <section style={{ width: "min(460px,100%)", padding: "clamp(24px,6vw,40px)", borderRadius: "24px", background: "rgba(255,255,255,.97)", boxShadow: "0 30px 80px rgba(0,0,0,.38)" }}>
        <img src="/logo.png" alt="Outreach Hope Church" style={{ width: 58, height: 58, objectFit: "contain", display: "block", marginBottom: 22 }} />
        <p style={{ margin: "0 0 8px", color: "#0284c7", fontSize: ".72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em" }}>Member account security</p>
        <h1 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "clamp(1.7rem,7vw,2.25rem)" }}>{isReset ? "Create a new password" : "Forgot your password?"}</h1>
        <p style={{ margin: "0 0 26px", color: "#64748b", lineHeight: 1.65 }}>{isReset ? "Choose a secure password for your member account." : "Enter your member email and we’ll send you a secure reset link valid for 60 minutes."}</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
          {!isReset ? <label style={{ display: "grid", gap: 7, color: "#334155", fontSize: ".82rem", fontWeight: 800 }}>Email address<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" style={inputStyle} /></label> : <>
            <label style={labelStyle}>New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} /></label>
          </>}
          {status && <div role={status.type === "error" ? "alert" : "status"} style={{ padding: "12px 14px", borderRadius: 10, background: status.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${status.type === "error" ? "#fecaca" : "#bbf7d0"}`, color: status.type === "error" ? "#b91c1c" : "#15803d", lineHeight: 1.5, fontSize: ".84rem" }}>{status.message}</div>}
          <button disabled={loading || (!isReset && status?.type === "success")} style={{ minHeight: 50, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#0284c7,#2563eb)", color: "white", font: "inherit", fontWeight: 900, cursor: loading ? "wait" : "pointer", opacity: loading ? .65 : 1 }}>{loading ? "Please wait…" : isReset ? "Reset Password" : "Send Reset Link"}</button>
        </form>
        <Link to="/login" style={{ display: "block", marginTop: 20, color: "#0369a1", textAlign: "center", fontSize: ".85rem", fontWeight: 800, textDecoration: "none" }}>← Back to Sign In</Link>
      </section>
    </main>
  );
}

const inputStyle = { width: "100%", minHeight: 50, padding: "12px 14px", border: "1.5px solid #cbd5e1", borderRadius: 11, background: "#f8fafc", color: "#0f172a", fontSize: "16px", outline: "none", boxSizing: "border-box" };
const labelStyle = { display: "grid", gap: 7, color: "#334155", fontSize: ".82rem", fontWeight: 800 };
