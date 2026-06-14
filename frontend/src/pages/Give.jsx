import { useState, useEffect, useRef } from "react"
import CloseButton from "../components/CloseButton"

/* ─── Global styles ─────────────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ripple {
      0%   { transform: scale(0); opacity: 0.4; }
      100% { transform: scale(3); opacity: 0; }
    }

    .give-page { animation: fadeUp 0.4s ease both; font-family: 'Inter', system-ui, sans-serif; }

    .give-input {
      width: 100%;
      padding: 13px 16px 13px 44px;
      border: 1.5px solid #bae6fd;
      border-radius: 10px;
      font-size: 0.95rem;
      font-family: 'Inter', sans-serif;
      background: #f0f9ff;
      color: #0c4a6e;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    .give-input:focus {
      border-color: #0ea5e9;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
    }
    .give-input::placeholder { color: #94a3b8; }

    .pay-btn {
      position: relative;
      overflow: hidden;
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 11px;
      background: linear-gradient(90deg, #0369a1, #0ea5e9);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: 0.3px;
      cursor: pointer;
      transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
      box-shadow: 0 4px 18px rgba(3,105,161,0.35);
    }
    .pay-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(3,105,161,0.42);
    }
    .pay-btn:active { transform: scale(0.98); }
    .pay-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .trust-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #0369a1;
      transition: background 0.18s;
    }
    .trust-chip:hover { background: #e0f2fe; }

    .give-select {
      width: 100%;
      padding: 13px 16px 13px 44px;
      border: 1.5px solid #bae6fd;
      border-radius: 10px;
      font-size: 0.95rem;
      font-family: 'Inter', sans-serif;
      background: #f0f9ff;
      color: #0c4a6e;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    .give-select:focus {
      border-color: #0ea5e9;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
    }
  `}</style>
)

/* ─── Inline SVG icons ──────────────────────────────────────────── */
const IconPhone = ({ size = 18, color = "#0ea5e9" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconCoin = ({ size = 18, color = "#0ea5e9" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v2m0 8v2M9.5 9.5c0-1.1.9-2 2-2h1.5a2 2 0 0 1 0 4H11a2 2 0 0 0 0 4h1.5a2 2 0 0 0 2-2" />
  </svg>
)

const IconShield = ({ size = 14, color = "#0369a1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const IconCheck = ({ size = 14, color = "#0369a1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconLock = ({ size = 14, color = "#0369a1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconArrowRight = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconTag = ({ size = 16, color = "#0ea5e9" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const IconChevronDown = ({ size = 16, color = "#0ea5e9" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

/* ─── Quick-amount chips ─────────────────────────────────────────── */
const quickAmounts = ["100", "500", "1000", "2500", "5000"]

/* ─── Main component ─────────────────────────────────────────────── */
const givingCategories = [
  { value: "", label: "Select giving type…" },
  { value: "Offering", label: "Offering" },
  { value: "Tithe", label: "Tithe" },
  { value: "Missions", label: "Missions Fund" },
  { value: "Building", label: "Building Fund" },
  { value: "Others", label: "Others" },
]

function Give() {
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: "", message: "" }) // "waiting", "success", "error"
  const [requestId, setRequestId] = useState("")
  const pollTimer = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  const checkStatus = async (rid, isManual = false) => {
    if (!rid) return;
    
    try {
      const statusRes = await fetch(`/api/transactions/status/${rid}`);
      const statusData = await statusRes.json();

      if (statusData.status === "Completed") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setStatus({
          type: "success",
          message: "Thank you! Your donation was successful. MAY GOD BLESS YOU. The form will reset in 5 seconds."
        });
        setLoading(false);
        setPhone("");
        setAmount("");
        setCategory("");
        setTimeout(() => setStatus({ type: "", message: "" }), 5000);
      } else if (statusData.status === "Failed") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setStatus({ type: "error", message: statusData.resultDesc || "Transaction failed. Please try again." });
        setLoading(false);
      } else if (isManual) {
        // If still pending and user clicked manual check
        setStatus({
          type: "waiting",
          message: "Payment still pending. If you've entered your PIN, please wait a moment then click 'I have Paid' again."
        });
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const handleMpesaPay = async () => {
    if (!category) {
      alert("Please select a giving type (Offering, Tithe, etc.).")
      return
    }
    if (phone.length !== 9) {
      alert("Please enter a valid 9-digit mobile number.")
      return
    }
    setLoading(true)
    setStatus({ type: "waiting", message: "Sending request to your phone..." })

    try {
      const firstName = localStorage.getItem("memberName") || "Guest";
      const lastName = localStorage.getItem("memberLastName") || "";
      const memberId = localStorage.getItem("memberId") || "0000";

      const response = await fetch("/api/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: `254${phone}`, 
          amount, 
          category,
          firstName,
          lastName,
          memberId
        }),
      })
      const data = await response.json()

      if (response.ok) {
        const rid = data.CheckoutRequestID;
        setRequestId(rid);
        setStatus({ type: "waiting", message: "Please check your phone and enter your M-Pesa PIN..." })

        // Polling logic
        let pollCount = 0;
        const maxPolls = 30; // Poll for 150 seconds (30 * 5s)

        if (pollTimer.current) clearInterval(pollTimer.current);
        
        pollTimer.current = setInterval(async () => {
          pollCount++;
          if (pollCount > maxPolls) {
            if (pollTimer.current) clearInterval(pollTimer.current);
            setStatus({ type: "error", message: "Transaction timed out. If you entered your PIN, please check your M-Pesa messages for confirmation." });
            setLoading(false);
            return;
          }
          await checkStatus(rid);
        }, 5000); // Poll every 5 seconds

      } else {
        setStatus({ type: "error", message: data.message || "Something went wrong." })
        setLoading(false);
      }
    } catch (error) {
      console.error(error)
      setStatus({ type: "error", message: "Failed to connect to payment server." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <GlobalStyle />
      <div
        className="give-page"
        style={{
          background: "linear-gradient(155deg, #f0f9ff 0%, #e0f2fe 55%, #f0f9ff 100%)",
          minHeight: "100vh",
          padding: "40px 20px 80px",
          position: "relative",
        }}
      >
        <CloseButton />

        {/* ── Page header ── */}
        <div style={{ textAlign: "center", marginBottom: "44px", paddingTop: "8px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "#0369a1",
            marginBottom: "14px",
          }}>
            <div style={{ width: "18px", height: "1px", background: "#0ea5e9" }} />
            Outreach Hope Church
            <div style={{ width: "18px", height: "1px", background: "#0ea5e9" }} />
          </div>
          <h1 style={{
            margin: "0 0 12px",
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)",
            fontWeight: 400,
            color: "#0c4a6e",
            letterSpacing: "-0.4px",
            lineHeight: 1.2,
          }}>
            Give &amp; Support
          </h1>
          <p style={{
            margin: "0 auto",
            maxWidth: "440px",
            color: "#64748b",
            fontSize: "0.92rem",
            lineHeight: 1.75,
          }}>
            Your generosity fuels outreach, feeds families, and builds the kingdom.
            Every contribution — big or small — makes a real difference.
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          maxWidth: "480px",
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #bae6fd",
          borderRadius: "18px",
          boxShadow: "0 8px 40px rgba(3,105,161,0.10)",
          overflow: "hidden",
        }}>

          {/* Card top accent */}
          <div style={{
            height: "5px",
            background: "linear-gradient(90deg, #0369a1, #38bdf8)",
          }} />

          <div style={{ padding: "32px 30px 36px" }}>

            {/* M-Pesa label row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "26px",
            }}>
              <div>
                <h2 style={{
                  margin: "0 0 3px",
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: "1.25rem",
                  fontWeight: 400,
                  color: "#0c4a6e",
                }}>
                  Pay via M-Pesa
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#64748b",
                }}>
                  Lipa na M-Pesa · STK Push
                </p>
              </div>
              {/* M-Pesa brand badge */}
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#15803d",
                letterSpacing: "0.3px",
              }}>
                M-PESA
              </div>
            </div>

            {/* Giving category dropdown */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#334155",
                letterSpacing: "0.2px",
              }}>
                Giving Type
              </label>
              <div style={{ position: "relative" }}>
                {/* Left icon */}
                <div style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                  zIndex: 1,
                }}>
                  <IconTag size={16} color="#0ea5e9" />
                </div>
                {/* Right chevron */}
                <div style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}>
                  <IconChevronDown size={16} color="#0ea5e9" />
                </div>
                <select
                  className="give-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {givingCategories.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone field */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#334155",
                letterSpacing: "0.2px",
              }}>
                Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  pointerEvents: "none",
                  zIndex: 1,
                }}>
                  <IconPhone size={16} color="#0ea5e9" />
                  <span style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#0369a1",
                    borderRight: "1.5px solid #bae6fd",
                    paddingRight: "8px",
                    marginRight: "-2px"
                  }}>254</span>
                </div>
                <input
                  className="give-input"
                  style={{ paddingLeft: "82px" }}
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '')
                    if (val.startsWith('254')) val = val.slice(3)
                    if (val.startsWith('0')) val = val.slice(1)
                    setPhone(val.slice(0, 9))
                  }}
                  maxLength={9}
                  placeholder="7XXXXXXXX"
                />
              </div>
              <p style={{
                margin: "5px 0 0",
                fontSize: "0.73rem",
                color: "#94a3b8",
              }}>
                Enter your Safaricom number (e.g. 712345678)
              </p>
            </div>

            {/* Amount field */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#334155",
                letterSpacing: "0.2px",
              }}>
                Amount (KES)
              </label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                }}>
                  <IconCoin size={16} color="#0ea5e9" />
                </div>
                <input
                  className="give-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                />
              </div>
            </div>

            {/* Quick amount chips */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "26px",
            }}>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  style={{
                    padding: "6px 14px",
                    border: `1.5px solid ${amount === q ? "#0ea5e9" : "#bae6fd"}`,
                    borderRadius: "999px",
                    background: amount === q ? "#e0f2fe" : "#f0f9ff",
                    color: amount === q ? "#0369a1" : "#64748b",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  KES {parseInt(q).toLocaleString()}
                </button>
              ))}
            </div>

            {/* Pay button */}
            <button
              className="pay-btn"
              type="button"
              onClick={handleMpesaPay}
              disabled={loading}
            >
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}>
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                        <animateTransform attributeName="transform" type="rotate"
                          from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    Confirm Donation
                    <IconArrowRight size={16} color="#fff" />
                  </>
                )}
              </span>
            </button>

            {/* Trust row */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px",
              marginTop: "22px",
            }}>
              {[
                { Icon: IconShield, label: "Secure Payment" },
                { Icon: IconCheck, label: "Instant Receipt" },
                { Icon: IconLock, label: "Encrypted" },
              ].map(({ Icon, label }) => (
                <span className="trust-chip" key={label}>
                  <Icon size={13} color="#0369a1" />
                  {label}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* ── Status Modal ── */}
        {status.type && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}>
            <div style={{
              maxWidth: "400px",
              width: "100%",
              background: "#fff",
              borderRadius: "24px",
              padding: "40px 30px",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              animation: "fadeUp 0.3s ease both",
            }}>
              <div style={{ marginBottom: "24px" }}>
                {status.type === "waiting" && (
                  <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto" }}>
                    <div className="spinner" />
                    <div style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "24px"
                    }}>📱</div>
                  </div>
                )}
                {status.type === "success" && (
                  <div style={{
                    width: "80px", height: "80px", background: "#f0fdf4",
                    borderRadius: "50%", margin: "0 auto", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "32px",
                    border: "4px solid #bbf7d0",
                    animation: "scaleUp 0.3s ease both"
                  }}>✅</div>
                )}
                {status.type === "error" && (
                  <div style={{
                    width: "80px", height: "80px", background: "#fef2f2",
                    borderRadius: "50%", margin: "0 auto", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "32px",
                    border: "4px solid #fecaca",
                  }}>❌</div>
                )}
              </div>

              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1.5rem",
                color: status.type === "success" ? "#15803d" : "#0f172a",
                marginBottom: "12px"
              }}>
                {status.type === "waiting" ? "Payment Initiated" :
                  status.type === "success" ? "Sent Successfully!" : "Payment Failed"}
              </h3>

              <p style={{ 
                color: "#64748b", 
                fontSize: "0.95rem", 
                lineHeight: 1.6, 
                marginBottom: status.type === "success" ? "0" : "30px" 
              }}>
                {status.message}
                {status.type === "success" && (
                  <strong style={{
                    display: "block",
                    marginTop: "12px",
                    color: "#15803d",
                    fontSize: "1.1rem"
                  }}>
                    MAY GOD BLESS YOU.
                  </strong>
                )}
              </p>

              {status.type === "waiting" && (
                <button
                  onClick={() => checkStatus(requestId, true)}
                  style={{
                    marginTop: "10px",
                    background: "linear-gradient(90deg, #15803d, #22c55e)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 30px",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(21,128,61,0.25)",
                    transition: "all 0.2s",
                    width: "100%",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  I have Paid (Confirm)
                </button>
              )}

              {status.type === "error" && (
                <button
                  onClick={() => {
                    setStatus({ type: "", message: "" });
                  }}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 30px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        <style>{`
          .spinner {
            width: 80px;
            height: 80px;
            border: 4px solid #f0f9ff;
            border-top: 4px solid #0ea5e9;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes scaleUp {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  )
}

export default Give
