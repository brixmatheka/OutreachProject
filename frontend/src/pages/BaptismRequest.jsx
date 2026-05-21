import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

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
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const fetchMyRequests = (token) => {
    axios.get("http://localhost:5000/api/my-baptism-requests", {
      headers: { Authorization: token }
    })
      .then(res => setMyRequests(res.data))
      .catch(err => console.error("Error fetching my requests:", err));
  };

  // Auto-fill form with logged-in member data on mount
  useEffect(() => {
    const token = localStorage.getItem("memberToken");
    if (!token) return;

    setPrefilling(true);
    axios
      .get("http://localhost:5000/auth/me", {
        headers: { Authorization: token },
      })
      .then((res) => {
        const member = res.data;
        // Format dateOfBirth to YYYY-MM-DD if available
        let dob = "";
        if (member.dateOfBirth) {
          dob = new Date(member.dateOfBirth).toISOString().split("T")[0];
        }
        setFormData((prev) => ({
          ...prev,
          fullName: `${member.firstName || ""} ${member.lastName || ""}`.trim(),
          email: member.email || "",
          phone: member.phone || "",
          dateOfBirth: dob,
        }));
        setIsLoggedIn(true);
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
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dob = new Date(formData.dateOfBirth);
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    tenYearsAgo.setHours(0, 0, 0, 0);
    dob.setHours(0, 0, 0, 0);

    if (dob > tenYearsAgo) {
      setError("You must be at least 10 years old to request baptism.");
      return;
    }

    if (formData.phone && (formData.phone.length < 9 || formData.phone.length > 10)) {
      setError("Please enter a valid 9 or 10 digit phone number.");
      return;
    }

    const pDate = new Date(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pDate.setHours(0, 0, 0, 0);

    if (pDate < today) {
      setError("Preferred baptism date must be in the future (today or later).");
      return;
    }

    const day = pDate.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      setError("Baptism can only be scheduled on a Saturday or a Sunday.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = { ...formData };
      if (payload.phone) {
        payload.phone = "+254" + payload.phone;
      }
      await axios.post("http://localhost:5000/api/baptism-requests", payload);
      setSuccess(true);
      setFormData({ fullName: "", email: "", phone: "", dateOfBirth: "", preferredDate: "" });

      const token = localStorage.getItem("memberToken");
      if (token) fetchMyRequests(token);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = (req) => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Certificate of Baptism</title>
      <style>
        body { font-family: 'Georgia', serif; text-align: center; border: 10px solid #e0f2fe; padding: 40px; margin: 40px; }
        h1 { color: #0284c7; font-size: 36pt; margin-bottom: 20pt; }
        p { color: #64748b; font-size: 14pt; }
        .name { font-size: 28pt; font-weight: bold; color: #0f172a; margin: 20pt 0; border-bottom: 1px solid #000; display: inline-block; padding: 0 40px; }
        .date { font-size: 16pt; margin-top: 30pt; }
      </style>
      </head>
      <body>
        <h1>Certificate of Baptism</h1>
        <p>This certifies that</p>
        <div class="name">${req.fullName}</div>
        <p>was publicly baptized in the name of the Father, and of the Son, and of the Holy Spirit.</p>
        <div class="date">Date: ${new Date(req.preferredDate).toLocaleDateString()}</div>
        <p style="margin-top: 40pt;">Outreach Hope Church</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Baptism_Card_${req.fullName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <div style={styles.iconWrapper}>💧</div>
        <h2 style={styles.title}>Request Holy Baptism</h2>
        <p style={styles.subtitle}>
          "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit." — Matthew 28:19
        </p>

        {/* Auto-fill notice */}
        {isLoggedIn && !success && (
          <div style={styles.autofillBanner}>
            ✅ Your details have been auto-filled from your account. You may edit them if needed.
          </div>
        )}

        {/* Guest prompt */}
        {!isLoggedIn && !prefilling && !success && (
          <div style={styles.guestBanner}>
            💡 <Link to="/login" style={styles.guestLink}>Sign in</Link> to auto-fill your details.
          </div>
        )}

        {success && (
          <div style={styles.successBanner}>
            🎉 Request submitted successfully! Our ministry team will contact you soon.
          </div>
        )}

        {error && <div style={styles.errorBanner}>{error}</div>}

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
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={styles.input}
            />
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
                placeholder="712345678 or 0712345678"
                maxLength={10}
                style={{ ...styles.input, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              style={styles.input}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split("T")[0]}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Preferred Baptism Date (Saturdays or Sundays only)</label>
            <input
              name="preferredDate"
              type="date"
              required
              value={formData.preferredDate}
              onChange={handleChange}
              style={styles.input}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <button type="submit" disabled={loading || prefilling} style={styles.button}>
            {prefilling ? "Loading your details..." : loading ? "Submitting..." : "Submit Baptism Request"}
          </button>
        </form>

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
    border: "1px solid rgba(255, 255, 255, 0.3)"
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
  }
};

export default BaptismRequest;
