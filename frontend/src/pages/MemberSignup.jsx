import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function MemberSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    residence: "",
    gender: "",
    dateOfBirth: "",
    isBaptized: "false",
    idNo: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [dobParts, setDobParts] = useState({ day: "", month: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (error) setError("");
    if (name === "firstName" || name === "lastName") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (name === "phone") {
      value = value.replace(/\D/g, "");
      // Enforce Kenyan standard: first digit must be 7 or 1
      if (value.length > 0 && value[0] !== "7" && value[0] !== "1") {
        value = value.slice(1);
      }
      if (value.length > 9) value = value.slice(0, 9);
    } else if (name === "idNo") {
      value = value.replace(/\D/g, "");
      if (value.length > 14) value = value.slice(0, 14);
    } else if (name === "email") {
      value = value.toLowerCase();
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "dateOfBirth") {
        const age = calculateAge(value);
        if (age <= 18) {
          updated.idNo = "";
        }
      }
      return updated;
    });
  };

  const handleDobChange = (part, value) => {
    setDobParts((previous) => {
      const updated = { ...previous, [part]: value };
      const { day, month, year } = updated;
      let dateOfBirth = "";

      if (day && month && year) {
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
        if (Number(day) <= daysInMonth) {
          dateOfBirth = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }

      setFormData((current) => ({
        ...current,
        dateOfBirth,
        ...(dateOfBirth && calculateAge(dateOfBirth) <= 18 ? { idNo: "" } : {})
      }));
      if (error) setError("");
      return updated;
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.dateOfBirth) {
      setError("Please select a valid date of birth.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms and Conditions to sign up.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const calculatedAge = calculateAge(formData.dateOfBirth);
    if (calculatedAge < 12) {
      setError("Date of birth must be at least 12 years ago (minimum age of 12).");
      return;
    }

    if (formData.phone && (formData.phone.length !== 9 || !/^[71]/.test(formData.phone))) {
      setError("Phone number must be 9 digits starting with 7 or 1 (e.g. 712345678).");
      return;
    }

    if (calculatedAge > 18 && !formData.idNo) {
      setError("National ID number is required for members above 18 years of age.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = { ...formData, age: calculatedAge };
      if (payload.phone) {
        payload.phone = "+254" + payload.phone;
      }
      if (calculatedAge <= 18) {
        delete payload.idNo;
      }
      const res = await axios.post("/auth/signup", payload);
      if (res.data.token) localStorage.setItem("memberToken", res.data.token);
      localStorage.setItem("memberSession", "true");
      localStorage.setItem("memberName", res.data.member.firstName);
      localStorage.setItem("memberLastName", res.data.member.lastName);
      localStorage.setItem("memberId", res.data.member.memberId);

      const redirectPath = localStorage.getItem("redirectAfterLogin") || "/";
      localStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectPath;
    } catch (err) {
      console.error("Signup error details:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="member-signup-page" style={styles.container}>
      <div className="member-signup-card" style={styles.glassCard}>
        <img src="/logo.png" alt="Outreach Hope Church" style={{
          width: "72px",
          height: "72px",
          objectFit: "contain",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(14, 165, 233, 0.2)",
          margin: "0 auto 24px auto",
          filter: "drop-shadow(0 6px 15px rgba(14,165,233,0.25))",
          display: "block"
        }} />
        <h2 style={styles.title}>Join Our Community</h2>
        <p style={styles.subtitle}>Create an account to access all church features</p>

        {error && <div role="alert" aria-live="assertive" style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSignup} style={styles.form} autoComplete="off">
          <div className="member-signup-row" style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>First Name</label>
              <input
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="enter your first name "
                autoComplete="off"
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Second Name</label>
              <input
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="enter your last name"
                autoComplete="off"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              autoComplete="off"
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
                placeholder="7XXXXXXXX or 1XXXXXXXX"
                maxLength={9}
                autoComplete="off"
                style={{ ...styles.input, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Gender</label>
            <select
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              style={{ ...styles.input, appearance: "none", cursor: "pointer" }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Area of Residence</label>
            <input
              name="residence"
              type="text"
              required
              value={formData.residence}
              onChange={handleChange}
              placeholder="e.g. Sunshine, Nairobi"
              autoComplete="off"
              maxLength={120}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Are you baptized?</label>
            <select
              name="isBaptized"
              required
              value={formData.isBaptized}
              onChange={handleChange}
              style={{ ...styles.input, appearance: "none", cursor: "pointer" }}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Date of Birth
              {formData.dateOfBirth && (
                <span style={{ color: "#0ea5e9", marginLeft: "8px", fontWeight: "normal" }}>
                  (Age: {calculateAge(formData.dateOfBirth)})
                </span>
              )}
            </label>
            <div className="member-signup-dob" style={styles.dobRow}>
              <select aria-label="Birth day" required value={dobParts.day} onChange={(e) => handleDobChange("day", e.target.value)} style={styles.input}>
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
              <select aria-label="Birth month" required value={dobParts.month} onChange={(e) => handleDobChange("month", e.target.value)} style={styles.input}>
                <option value="">Month</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <select aria-label="Birth year" required value={dobParts.year} onChange={(e) => handleDobChange("year", e.target.value)} style={styles.input}>
                <option value="">Year</option>
                {Array.from({ length: 89 }, (_, index) => new Date().getFullYear() - 12 - index).map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          {calculateAge(formData.dateOfBirth) > 18 && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>ID Number</label>
              <input
                name="idNo"
                type="text"
                required
                value={formData.idNo}
                onChange={handleChange}
                placeholder="enter your ID number"
                maxLength={14}
                autoComplete="off"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="enter your password"
                autoComplete="new-password"
                style={styles.inputPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.showBtn}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="confirm your password"
              autoComplete="new-password"
              style={styles.input}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", textAlign: "left", margin: "8px 0" }}>
            <input
              type="checkbox"
              id="termsConsent"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (error) setError("");
              }}
              style={{
                marginTop: "3px",
                width: "16px",
                height: "16px",
                cursor: "pointer",
                borderRadius: "4px",
                accentColor: "#0ea5e9"
              }}
            />
            <label htmlFor="termsConsent" style={{ fontSize: "0.85rem", color: "#475569", cursor: "pointer", fontWeight: "500", lineHeight: "1.4" }}>
              I agree to the <span style={{ color: "#0ea5e9", fontWeight: "600" }}>Terms &amp; Conditions</span> and Privacy Policy of Outreach Hope Church.
            </label>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
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
    backgroundColor: "#bae6fd",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px auto",
    fontSize: "28px",
    color: "#0369a1"
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
  errorBanner: {
    position: "fixed",
    left: "50%",
    bottom: "max(20px, env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    width: "min(460px, calc(100vw - 32px))",
    zIndex: 1000,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "0.875rem",
    border: "1px solid #fecaca",
    boxShadow: "0 12px 32px rgba(127, 29, 29, 0.2)"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  inputGroup: {
    textAlign: "left"
  },
  dobRow: {
    display: "grid",
    gridTemplateColumns: "0.75fr 1.4fr 1fr",
    gap: "8px"
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
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  inputPassword: {
    width: "100%",
    padding: "12px 60px 12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    outline: "none",
    fontSize: "0.95rem",
    color: "#0f172a",
    transition: "all 0.2s ease",
    boxSizing: "border-box"
  },
  showBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#0ea5e9",
    fontSize: "0.8rem",
    fontWeight: "700",
    cursor: "pointer",
    padding: "4px 8px"
  },
  button: {
    marginTop: "10px",
    backgroundColor: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(14, 165, 233, 0.2)"
  },
  footerText: {
    marginTop: "24px",
    fontSize: "0.9rem",
    color: "#64748b"
  },
  link: {
    color: "#0ea5e9",
    textDecoration: "none",
    fontWeight: "600"
  }
};

export default MemberSignup;
