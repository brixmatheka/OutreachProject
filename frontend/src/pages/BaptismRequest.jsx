import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";

function BaptismRequest() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    preferredDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [isAlreadyBaptized, setIsAlreadyBaptized] = useState(false);
  const [showFormAnyway, setShowFormAnyway] = useState(false);

  const completedRequest = myRequests.find(req => req.status === "Completed");
  const hasCompletedRequest = !!completedRequest;

  const fetchMyRequests = (token) => {
    axios.get("/api/my-baptism-requests", {
      headers: { Authorization: token }
    })
      .then(res => setMyRequests(res.data))
      .catch(() => setMyRequests([]));
  };

  // Auto-fill form with logged-in member data on mount
  useEffect(() => {
    const token = localStorage.getItem("memberToken");
    if (!token) return;

    setPrefilling(true);
    axios
      .get("/auth/me", {
        headers: { Authorization: token },
      })
      .then((res) => {
        const member = res.data;
        // Format dateOfBirth to YYYY-MM-DD if available
        let dob = "";
        if (member.dateOfBirth) {
          dob = new Date(member.dateOfBirth).toISOString().split("T")[0];
        }
        let cleanPhone = member.phone || "";
        if (cleanPhone.startsWith("+254")) {
          cleanPhone = cleanPhone.slice(4);
        } else if (cleanPhone.startsWith("254")) {
          cleanPhone = cleanPhone.slice(3);
        } else if (cleanPhone.startsWith("0")) {
          cleanPhone = cleanPhone.slice(1);
        }

        setFormData((prev) => ({
          ...prev,
          fullName: `${member.firstName || ""} ${member.lastName || ""}`.trim(),
          email: member.email || "",
          phone: cleanPhone,
          dateOfBirth: dob,
        }));
        setIsLoggedIn(true);
        setIsAlreadyBaptized(!!member.isBaptized);
        fetchMyRequests(token);
      })
      .catch(() => {
        // Token may be expired or invalid — silently ignore
      })
      .finally(() => {
        setPrefilling(false);
      });
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "fullName") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (name === "phone") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) value = value.slice(0, 10);
    } else if (name === "email") {
      value = value.toLowerCase();
    }
    // Clear the field's error when the user starts correcting it
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const dob = new Date(formData.dateOfBirth);
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    tenYearsAgo.setHours(0, 0, 0, 0);
    dob.setHours(0, 0, 0, 0);

    if (dob > tenYearsAgo) {
      errors.dateOfBirth = "You must be at least 10 years old to request baptism.";
    }

    if (formData.phone && (formData.phone.length < 9 || formData.phone.length > 10)) {
      errors.phone = "Please enter a valid 9 or 10 digit phone number.";
    }

    const pDate = new Date(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pDate.setHours(0, 0, 0, 0);

    if (formData.preferredDate && pDate < today) {
      errors.preferredDate = "Preferred baptism date must be in the future (today or later).";
    }

    if (formData.preferredDate) {
      const day = pDate.getDay();
      if (day !== 0 && day !== 6) {
        errors.preferredDate = "Baptism can only be scheduled on a Saturday or a Sunday.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setFieldErrors({});
    setServerError("");
    setSuccess(false);

    try {
      const payload = { ...formData };
      if (payload.phone) {
        payload.phone = "" + payload.phone;
      }
      await axios.post("/api/baptism-requests", payload);
      setSuccess(true);
      setFormData({ fullName: "", email: "", phone: "", dateOfBirth: "", preferredDate: "" });

      const token = localStorage.getItem("memberToken");
      if (token) fetchMyRequests(token);
    } catch (err) {
      // Try to map server error to a field
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("already have")) {
        setFieldErrors({ email: msg });
      } else if (msg.toLowerCase().includes("phone")) {
        setFieldErrors({ phone: msg });
      } else if (msg.toLowerCase().includes("date") || msg.toLowerCase().includes("saturday") || msg.toLowerCase().includes("sunday")) {
        setFieldErrors({ preferredDate: msg });
      } else if (msg.toLowerCase().includes("10 years")) {
        setFieldErrors({ dateOfBirth: msg });
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = (req) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Outer border (Sky blue accent)
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    // Inner border (Elegant thin border)
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, 271, 184);

    // Church Header
    doc.setFont("times", "bold");
    doc.setFontSize(30);
    doc.setTextColor(2, 132, 199);
    doc.text("Outreach Hope Church", 148.5, 42, { align: "center" });

    // Certificate Title
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(100, 116, 139);
    doc.text("CERTIFICATE OF BAPTISM", 148.5, 56, { align: "center" });

    // Certifies that...
    doc.setFont("times", "italic");
    doc.setFontSize(18);
    doc.setTextColor(71, 85, 105);
    doc.text("This certifies that", 148.5, 78, { align: "center" });

    // Full Name
    doc.setFont("times", "bolditalic");
    doc.setFontSize(32);
    doc.setTextColor(15, 23, 42);
    doc.text(req.fullName, 148.5, 98, { align: "center" });

    // Line under the name
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(70, 103, 227, 103);

    // Core message
    doc.setFont("times", "italic");
    doc.setFontSize(16);
    doc.setTextColor(71, 85, 105);
    doc.text("was publicly baptized in the name of the Father, and of the Son, and of the Holy Spirit,", 148.5, 122, { align: "center" });
    doc.text("declaring their faith in Jesus Christ as Lord and Savior.", 148.5, 132, { align: "center" });

    // Date
    const formattedDate = new Date(req.preferredDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Date: " + formattedDate, 148.5, 155, { align: "center" });

    // Signatures
    // Left
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(40, 178, 110, 178);
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("Senior Pastor", 75, 184, { align: "center" });

    // Right
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(187, 178, 257, 178);
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("Ministry Leader", 222, 184, { align: "center" });

    // Save as PDF
    doc.save(`Baptism_Card_${req.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        {/* Ribbon decoration at top-right of glass card */}
        {(isAlreadyBaptized || hasCompletedRequest) && (
          <div style={styles.ribbon}>
            Baptized 💧
          </div>
        )}

        <div style={styles.iconWrapper}>💧</div>
        <h2 style={styles.title}>Request Holy Baptism</h2>
        <p style={styles.subtitle}>
          "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit." — Matthew 28:19
        </p>

        {/* Auto-fill notice */}
        {isLoggedIn && !isAlreadyBaptized && !hasCompletedRequest && !success && (
          <div style={styles.autofillBanner}>
            ✅ Your details have been auto-filled from your account. You may edit them if needed.
          </div>
        )}

        {/* Guest prompt */}
        {!isLoggedIn && !prefilling && !hasCompletedRequest && !success && (
          <div style={styles.guestBanner}>
            💡 <Link to="/login" style={styles.guestLink}>Sign in</Link> to auto-fill your details.
          </div>
        )}

        {hasCompletedRequest ? (
          <div style={styles.congratsContainer}>
            <div style={styles.congratsRibbon}>
              ✨ Congratulations ✨
            </div>
            <div style={styles.congratsBadge}>💧 Confirmed Baptized 💧</div>
            <p style={styles.congratsText}>
              We rejoice with you! Your baptism request has been officially confirmed and completed by our church administration.
              May God bless you abundantly as you walk in this newness of life!
            </p>
            {completedRequest && (
              <div style={styles.congratsDetails}>
                <strong>Baptism Date:</strong> {new Date(completedRequest.preferredDate).toLocaleDateString()}
              </div>
            )}
            <div style={styles.congratsQuote}>
              "Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new." — 2 Corinthians 5:17
            </div>
            {completedRequest && (
              <button
                type="button"
                onClick={() => downloadCard(completedRequest)}
                style={styles.congratsDownloadBtn}
              >
                🎓 Download Baptism Certificate
              </button>
            )}
          </div>
        ) : isAlreadyBaptized && !showFormAnyway ? (
          <div style={styles.baptizedContainer}>
            <div style={styles.baptizedBadge}>✨ Already Baptized ✨</div>
            <p style={styles.baptizedText}>
              Our records show that you entered yourself as <strong>already baptized</strong> during registration.
              We celebrate this beautiful milestone in your spiritual walk with Christ!
            </p>
            <div style={styles.baptizedQuote}>
              "For as many of you as were baptized into Christ have put on Christ." — Galatians 3:27
            </div>
            <button
              type="button"
              onClick={() => setShowFormAnyway(true)}
              style={styles.requestAnywayButton}
            >
              Need to request baptism anyway? Click here
            </button>
          </div>
        ) : (
          <>
            {success && (
              <div style={styles.successBanner}>
                🎉 Request submitted successfully! Our ministry team will contact you soon.
              </div>
            )}

            {serverError && <div style={styles.errorBanner}>{serverError}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={{ ...styles.input, ...(fieldErrors.fullName ? styles.inputError : {}) }}
                />
                {fieldErrors.fullName && <p style={styles.fieldErrorText}>{fieldErrors.fullName}</p>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email (lowercase only)"
                  style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : {}) }}
                  autoComplete="off"
                />
                {fieldErrors.email && <p style={styles.fieldErrorText}>{fieldErrors.email}</p>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={{ display: "flex" }}>
                  <div style={{
                    ...styles.input,
                    width: "auto",
                    borderRight: "none",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    +254
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your number excluding 0"
                    maxLength={10}
                    style={{ ...styles.input, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, ...(fieldErrors.phone ? styles.inputError : {}) }}
                  />
                </div>
                {fieldErrors.phone && <p style={styles.fieldErrorText}>{fieldErrors.phone}</p>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  style={{ ...styles.input, ...(fieldErrors.dateOfBirth ? styles.inputError : {}) }}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split("T")[0]}
                />
                {fieldErrors.dateOfBirth && <p style={styles.fieldErrorText}>{fieldErrors.dateOfBirth}</p>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Preferred Baptism Date (Saturdays or Sundays only)</label>
                <input
                  name="preferredDate"
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={handleChange}
                  style={{ ...styles.input, ...(fieldErrors.preferredDate ? styles.inputError : {}) }}
                  min={new Date().toISOString().split("T")[0]}
                />
                {fieldErrors.preferredDate && <p style={styles.fieldErrorText}>{fieldErrors.preferredDate}</p>}
              </div>

              <button type="submit" disabled={loading || prefilling} style={styles.button}>
                {prefilling ? "Loading your details..." : loading ? "Submitting..." : "Submit Baptism Request"}
              </button>
            </form>
          </>
        )}

        {myRequests.length > 0 && (
          <div style={{ marginTop: "40px", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "1.2rem", color: "#0f172a", marginBottom: "16px" }}>My Requests</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {myRequests.map((req) => (
                <div key={req._id} style={{
                  background: "rgba(255,255,255,0.9)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "600", color: "#334155", fontSize: "0.95rem" }}>
                      Date: {new Date(req.preferredDate).toLocaleDateString()}
                    </div>
                    <div style={{
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      marginTop: "4px",
                      color: req.status === "Completed" ? "#16a34a" : "#ca8a04"
                    }}>
                      Status: {req.status}
                    </div>
                  </div>
                  {req.status === "Completed" && (
                    <button
                      onClick={() => downloadCard(req)}
                      style={{
                        background: "#0284c7", color: "white", border: "none", borderRadius: "8px",
                        padding: "8px 16px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      Download Card
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={styles.footerText}>
          <Link to="/" style={styles.link}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f9ff",
    backgroundImage: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    padding: "20px"
  },
  glassCard: {
    maxWidth: "500px",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: "28px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    position: "relative",
    overflow: "hidden"
  },
  iconWrapper: {
    width: "64px",
    height: "64px",
    backgroundColor: "#e0f2fe",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px auto",
    fontSize: "28px",
    color: "#0284c7"
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "8px",
    letterSpacing: "-0.02em"
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "32px",
    fontSize: "0.95rem",
    lineHeight: "1.5"
  },
  successBanner: {
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "0.9rem",
    marginBottom: "20px",
    border: "1px solid #dcfce7",
    fontWeight: "500"
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff8f8",
    boxShadow: "0 0 0 3px rgba(239,68,68,0.12)",
  },
  fieldErrorText: {
    margin: "5px 0 0",
    fontSize: "0.8rem",
    color: "#b91c1c",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "0.875rem",
    marginBottom: "20px",
    border: "1px solid #fee2e2"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  inputGroup: {
    textAlign: "left"
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#334155"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    outline: "none",
    fontSize: "0.95rem",
    color: "#0f172a",
    transition: "all 0.2s ease",
    boxSizing: "border-box"
  },
  button: {
    marginTop: "10px",
    backgroundColor: "#0284c7",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)"
  },
  footerText: {
    marginTop: "24px",
    fontSize: "0.9rem",
    color: "#64748b"
  },
  link: {
    color: "#0284c7",
    textDecoration: "none",
    fontWeight: "600"
  },
  autofillBanner: {
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "0.85rem",
    marginBottom: "16px",
    border: "1px solid #bbf7d0",
    fontWeight: "500",
    textAlign: "left"
  },
  guestBanner: {
    backgroundColor: "#fefce8",
    color: "#713f12",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "0.85rem",
    marginBottom: "16px",
    border: "1px solid #fde68a",
    fontWeight: "500",
    textAlign: "left"
  },
  guestLink: {
    color: "#0284c7",
    fontWeight: "700",
    textDecoration: "underline"
  },
  ribbon: {
    position: "absolute",
    top: "22px",
    right: "-40px",
    transform: "rotate(45deg)",
    backgroundColor: "#10b981",
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: "800",
    textTransform: "uppercase",
    padding: "6px 0",
    width: "140px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
    letterSpacing: "0.08em",
    zIndex: 10
  },
  baptizedContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    border: "1px solid rgba(16, 185, 129, 0.15)",
    borderRadius: "20px",
    padding: "30px 20px",
    marginTop: "10px",
    marginBottom: "24px",
    textAlign: "center"
  },
  baptizedBadge: {
    backgroundColor: "#10b981",
    color: "#fff",
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: "50px",
    fontSize: "0.82rem",
    fontWeight: "700",
    marginBottom: "16px",
    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)",
    letterSpacing: "0.03em"
  },
  baptizedText: {
    color: "#334155",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    margin: "0 0 16px 0"
  },
  baptizedQuote: {
    fontStyle: "italic",
    color: "#059669",
    fontSize: "0.88rem",
    marginBottom: "20px",
    lineHeight: "1.4"
  },
  requestAnywayButton: {
    background: "none",
    border: "none",
    color: "#0284c7",
    textDecoration: "underline",
    fontSize: "0.85rem",
    fontWeight: "700",
    cursor: "pointer",
    padding: "4px 8px",
    transition: "color 0.2s"
  },
  congratsContainer: {
    background: "linear-gradient(135deg, rgba(240, 253, 250, 0.9) 0%, rgba(204, 251, 241, 0.9) 100%)",
    border: "2px solid #0d9488",
    borderRadius: "24px",
    padding: "36px 24px",
    marginTop: "10px",
    marginBottom: "24px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(13, 148, 136, 0.15)",
    position: "relative",
    overflow: "hidden"
  },
  congratsRibbon: {
    backgroundColor: "#0d9488",
    color: "#fff",
    display: "inline-block",
    padding: "8px 24px",
    fontSize: "0.95rem",
    fontWeight: "800",
    textTransform: "uppercase",
    borderRadius: "6px",
    marginBottom: "20px",
    letterSpacing: "0.1em",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)",
    backgroundImage: "linear-gradient(90deg, #0d9488, #14b8a6)"
  },
  congratsBadge: {
    color: "#0f766e",
    fontSize: "1.35rem",
    fontWeight: "800",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  congratsText: {
    color: "#1f2937",
    fontSize: "1rem",
    lineHeight: "1.6",
    margin: "0 0 20px 0",
    fontWeight: "500"
  },
  congratsDetails: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    border: "1px dashed #0d9488",
    borderRadius: "12px",
    padding: "10px 16px",
    display: "inline-block",
    fontSize: "0.95rem",
    color: "#0f766e",
    marginBottom: "20px"
  },
  congratsQuote: {
    fontStyle: "italic",
    color: "#0f766e",
    fontSize: "0.9rem",
    lineHeight: "1.5",
    marginBottom: "24px",
    padding: "0 10px",
    borderLeft: "3px solid #0d9488",
    textAlign: "center"
  },
  congratsDownloadBtn: {
    backgroundColor: "#0d9488",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px"
  }
};

export default BaptismRequest;
