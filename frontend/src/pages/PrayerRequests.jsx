import { useState, useEffect } from "react"
import axios from "axios"
import CloseButton from "../components/CloseButton"

const CATEGORIES = [
  { value: "health", label: "🏥 Health & Healing" },
  { value: "family", label: "👨‍👩‍👧 Family & Relationships" },
  { value: "finances", label: "💼 Finances & Provision" },
  { value: "spiritual", label: "✝️ Spiritual Growth" },
  { value: "grief", label: "🕊️ Grief & Loss" },
  { value: "work", label: "📋 Work & Career" },
  { value: "marriage", label: "💍 Marriage & Couples" },
  { value: "salvation", label: "🙌 Salvation of a Loved One" },
  { value: "guidance", label: "🧭 Guidance & Decision" },
  { value: "other", label: "📝 Other" },
]

const URGENCY = [
  { value: "standard", label: "Standard", desc: "Included in our weekly prayer sessions" },
  { value: "urgent", label: "Urgent", desc: "Our team will pray as soon as possible" },
]

const MAX_CHARS = 600

function PrayerRequest() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    category: "",
    urgency: "standard",
    isAnonymous: false,
    wantsCallback: false,
    request: "",
  })
  const [status, setStatus] = useState(null) // { type: "success"|"error", message: "" }
  const [loading, setLoading] = useState(false)
  const [prefilled, setPrefilled] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [focusedField, setFocusedField] = useState(null)

  // Auto-fill from logged-in member
  useEffect(() => {
    const token = localStorage.getItem("memberToken")
    if (!token) return
    axios
      .get("http://localhost:5000/auth/me", { headers: { Authorization: token } })
      .then((res) => {
        const m = res.data
        setFormData((prev) => ({
          ...prev,
          name: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
          phone: m.phone || "",
          email: m.email || "",
        }))
        setPrefilled(true)
      })
      .catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === "request") setCharCount(value.length)
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (status) setStatus(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, phone, category, request, isAnonymous } = formData

    if (!isAnonymous && !name.trim()) {
      setStatus({ type: "error", message: "Please enter your full name, or check the anonymous option." })
      return
    }
    if (!phone.trim()) {
      setStatus({ type: "error", message: "A phone number is required so our team can reach you." })
      return
    }
    if (!category) {
      setStatus({ type: "error", message: "Please select a prayer category." })
      return
    }
    if (!request.trim() || request.trim().length < 20) {
      setStatus({ type: "error", message: "Please describe your prayer request in at least 20 characters." })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      await axios.post(
        "http://localhost:5000/prayer-requests",
        {
          name: formData.isAnonymous ? "Anonymous" : formData.name,
          phone: formData.phone,
          request: `[${CATEGORIES.find(c => c.value === category)?.label || category}] [${formData.urgency.toUpperCase()}] ${request}`,
        },
        { headers: { "Content-Type": "application/json" } }
      )
      setStatus({ type: "success", message: "Your prayer request has been received. Our ministry team will be interceding on your behalf. May God's peace surround you. 🙏" })
      setFormData((prev) => ({
        ...prev,
        category: "",
        urgency: "standard",
        isAnonymous: false,
        wantsCallback: false,
        request: "",
      }))
      setCharCount(0)
    } catch (err) {
      setStatus({ type: "error", message: "We were unable to submit your request. Please try again or contact the church directly." })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    border: `1.5px solid ${focusedField === field ? "#0ea5e9" : "rgba(14, 165, 233, 0.2)"}`,
    backgroundColor: focusedField === field ? "rgba(14,165,233,0.06)" : "rgba(15, 23, 42, 0.6)",
    outline: "none",
    fontSize: "0.95rem",
    color: "#f8fafc",
    transition: "all 0.25s ease",
    boxSizing: "border-box",
    boxShadow: focusedField === field ? "0 0 0 4px rgba(14,165,233,0.12)" : "none",
  })

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#020617",
      backgroundImage: `
        radial-gradient(circle at 80% 10%, rgba(14,165,233,0.15) 0%, transparent 40%),
        radial-gradient(circle at 10% 80%, rgba(99,102,241,0.1) 0%, transparent 40%)
      `,
      padding: "60px 20px 80px",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: "relative",
      color: "#f1f5f9",
    }}>

      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Close button */}
      <div style={{ position: "fixed", top: "24px", right: "28px", zIndex: 100 }}>
        <CloseButton />
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            width: "80px", height: "80px",
            background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
            borderRadius: "24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px",
            margin: "0 auto 28px auto",
            boxShadow: "0 12px 36px rgba(14,165,233,0.4)",
          }}>
            🙏
          </div>
          <h1 style={{
            fontSize: "2.6rem",
            fontWeight: "800",
            background: "linear-gradient(to right, #f8fafc, #bae6fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 14px",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}>
            Submit a Prayer Request
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
            "Cast all your anxiety on Him because He cares for you." — <em>1 Peter 5:7</em>
            <br />
            Share your need with us. Our dedicated prayer team intercedes daily.
          </p>
        </div>

        {/* Auto-fill notice */}
        {prefilled && (
          <div style={{
            backgroundColor: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "24px",
            fontSize: "0.88rem",
            color: "#4ade80",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            ✅ Your contact details have been pre-filled from your account.
          </div>
        )}

        {/* Status banner */}
        {status && (
          <div style={{
            padding: "18px 22px",
            borderRadius: "14px",
            marginBottom: "28px",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            fontWeight: 500,
            display: "flex", alignItems: "flex-start", gap: "12px",
            backgroundColor: status.type === "success" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
            border: `1px solid ${status.type === "success" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            color: status.type === "success" ? "#4ade80" : "#f87171",
          }}>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{status.type === "success" ? "✝️" : "⚠️"}</span>
            {status.message}
          </div>
        )}

        {/* Form card */}
        <div style={{
          backgroundColor: "rgba(2,6,23,0.8)",
          backdropFilter: "blur(24px)",
          borderRadius: "28px",
          border: "1px solid rgba(14,165,233,0.2)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>

          {/* Card header strip */}
          <div style={{
            background: "linear-gradient(90deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08))",
            borderBottom: "1px solid rgba(14,165,233,0.12)",
            padding: "20px 40px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0ea5e9" }} />
            <span style={{ color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Confidential Prayer Request Form
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

              {/* Section: Contact */}
              <div>
                <p style={{ color: "#38bdf8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 18px" }}>
                  — Contact Information
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontSize: "0.85rem", fontWeight: 600 }}>
                      Full Name {formData.isAnonymous && <span style={{ color: "#64748b" }}>(hidden)</span>}
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange({ target: { name: "name", value: e.target.value.replace(/[^a-zA-Z\s]/g, "") } })}
                      placeholder="Your full name"
                      disabled={formData.isAnonymous}
                      style={{
                        ...inputStyle("name"),
                        opacity: formData.isAnonymous ? 0.4 : 1,
                        cursor: formData.isAnonymous ? "not-allowed" : "text",
                      }}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontSize: "0.85rem", fontWeight: 600 }}>
                      Phone Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange({ target: { name: "phone", value: e.target.value.replace(/\D/g, "") } })}
                      placeholder="07xxxxxxxx"
                      style={inputStyle("phone")}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                {/* Email row */}
                <div style={{ marginTop: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontSize: "0.85rem", fontWeight: 600 }}>
                    Email Address <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="For a follow-up encouragement email"
                    style={inputStyle("email")}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                {/* Checkboxes */}
                <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
                  {[
                    { name: "isAnonymous", label: "Submit anonymously" },
                    { name: "wantsCallback", label: "I'd like a pastoral call-back" },
                  ].map(({ name, label }) => (
                    <label key={name} style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", color: "#94a3b8", fontSize: "0.88rem", userSelect: "none" }}>
                      <div
                        onClick={() => handleChange({ target: { name, type: "checkbox", checked: !formData[name] } })}
                        style={{
                          width: "18px", height: "18px",
                          borderRadius: "5px",
                          border: `2px solid ${formData[name] ? "#0ea5e9" : "rgba(14,165,233,0.3)"}`,
                          backgroundColor: formData[name] ? "#0ea5e9" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                      >
                        {formData[name] && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 800 }}>✓</span>}
                      </div>
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Section: Category */}
              <div>
                <p style={{ color: "#38bdf8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 18px" }}>
                  — Prayer Category <span style={{ color: "#ef4444" }}>*</span>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: `1.5px solid ${formData.category === cat.value ? "#0ea5e9" : "rgba(14,165,233,0.15)"}`,
                        backgroundColor: formData.category === cat.value ? "rgba(14,165,233,0.12)" : "rgba(15,23,42,0.4)",
                        color: formData.category === cat.value ? "#38bdf8" : "#64748b",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        boxShadow: formData.category === cat.value ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Urgency */}
              <div>
                <p style={{ color: "#38bdf8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 18px" }}>
                  — Urgency Level
                </p>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  {URGENCY.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, urgency: u.value }))}
                      style={{
                        flex: "1 1 180px",
                        padding: "16px 20px",
                        borderRadius: "12px",
                        border: `1.5px solid ${formData.urgency === u.value ? (u.value === "urgent" ? "#f59e0b" : "#0ea5e9") : "rgba(14,165,233,0.15)"}`,
                        backgroundColor: formData.urgency === u.value
                          ? (u.value === "urgent" ? "rgba(245,158,11,0.08)" : "rgba(14,165,233,0.08)")
                          : "rgba(15,23,42,0.4)",
                        color: formData.urgency === u.value
                          ? (u.value === "urgent" ? "#fbbf24" : "#38bdf8")
                          : "#64748b",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "4px" }}>
                        {u.value === "urgent" ? "🔴" : "🔵"} {u.label}
                      </div>
                      <div style={{ fontSize: "0.78rem", opacity: 0.75 }}>{u.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Request */}
              <div>
                <p style={{ color: "#38bdf8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 18px" }}>
                  — Your Prayer Request <span style={{ color: "#ef4444" }}>*</span>
                </p>
                <label style={{ display: "block", marginBottom: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>
                  Please be as specific as you'd like. All requests are kept strictly confidential.
                </label>
                <textarea
                  name="request"
                  value={formData.request}
                  onChange={handleChange}
                  maxLength={MAX_CHARS}
                  placeholder="Describe your prayer need in detail. For example: 'My mother has been diagnosed with cancer and I am asking for God's healing hand and peace for our family during this difficult season...'"
                  rows={7}
                  style={{
                    ...inputStyle("request"),
                    resize: "vertical",
                    lineHeight: 1.7,
                    fontFamily: "inherit",
                    minHeight: "160px",
                  }}
                  onFocus={() => setFocusedField("request")}
                  onBlur={() => setFocusedField(null)}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#475569" }}>
                    Minimum 20 characters
                  </span>
                  <span style={{
                    fontSize: "0.78rem",
                    color: charCount > MAX_CHARS * 0.85 ? "#f59e0b" : "#475569",
                  }}>
                    {charCount} / {MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: loading
                      ? "rgba(15,23,42,0.8)"
                      : "linear-gradient(135deg, #0284c7 0%, #0ea5e9 60%, #38bdf8 100%)",
                    color: loading ? "#475569" : "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "17px",
                    fontSize: "1rem",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.25s ease",
                    boxShadow: loading ? "none" : "0 8px 28px rgba(14,165,233,0.4)",
                    letterSpacing: "0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-2px)"
                      e.currentTarget.style.boxShadow = "0 14px 36px rgba(14,165,233,0.5)"
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "0 8px 28px rgba(14,165,233,0.4)"
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: "16px", height: "16px",
                        border: "2px solid rgba(255,255,255,0.2)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }} />
                      Sending Heavenward...
                    </>
                  ) : "🙏  Submit Prayer Request"}
                </button>

                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.8rem", color: "#475569", lineHeight: 1.6 }}>
                  By submitting, you agree that your request will be shared confidentially with our trained prayer team.
                  {formData.wantsCallback && " A pastor or counsellor will contact you within 24 hours."}
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Scripture footer */}
        <div style={{
          marginTop: "40px",
          padding: "28px 36px",
          borderRadius: "20px",
          background: "rgba(14,165,233,0.05)",
          border: "1px solid rgba(14,165,233,0.12)",
          textAlign: "center",
        }}>
          <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.8, margin: 0 }}>
            <span style={{ color: "#38bdf8", fontWeight: 600 }}>Our Promise to You</span><br />
            "The prayer of a righteous person is powerful and effective." — <em>James 5:16</em><br />
            Every request is prayed over with care, compassion, and faith by our dedicated prayer warriors.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder, input::placeholder { color: #334155 !important; }
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          form > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default PrayerRequest
