import { useState } from "react";
import axios from "axios";

function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      localStorage.setItem("adminToken", res.data.token); // also store under "adminToken" for consistency
      window.location.href = "/admin-dashboard";
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .al-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', -apple-system, sans-serif;
          background: #0a0f1e;
        }

        /* ── LEFT ACCENT STRIP ── */
        .al-left {
          width: 42%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 64px 56px;
          background: linear-gradient(160deg, #111827 0%, #0a0f1e 100%);
          position: relative;
          overflow: hidden;
        }
        .al-left::after {
          content: '';
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(99,102,241,0.4), transparent);
        }

        /* Decorative glowing orb */
        .al-orb {
          position: absolute;
          top: -120px; left: -120px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .al-orb-2 {
          position: absolute;
          bottom: -80px; right: 40px;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .al-brand {
          position: relative;
          z-index: 1;
        }
        .al-logo-ring {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 36px;
          padding: 8px;
        }
        .al-logo-ring img {
          width: 100%; height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        .al-brand-name {
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .al-brand-tag {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6366f1;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 32px;
        }
        .al-tagline {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
          font-style: italic;
          max-width: 280px;
        }

        /* ── RIGHT FORM PANEL ── */
        .al-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          background: #0d1117;
        }

        .al-card {
          width: 100%;
          max-width: 380px;
        }

        .al-heading {
          font-size: clamp(1.5rem, 3vw, 1.9rem);
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .al-sub {
          font-size: 0.875rem;
          color: #475569;
          margin-bottom: 36px;
        }

        /* Error */
        .al-error {
          display: flex;
          gap: 10px;
          align-items: center;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 0.83rem;
          color: #fca5a5;
          font-weight: 500;
        }

        /* Form */
        .al-form { display: flex; flex-direction: column; gap: 18px; }

        .al-field { display: flex; flex-direction: column; gap: 6px; }
        .al-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .al-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .al-icon {
          position: absolute;
          left: 13px;
          display: flex;
          color: #475569;
          pointer-events: none;
          transition: color 0.2s;
        }
        .al-icon svg { width: 17px; height: 17px; }

        .al-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          background: rgba(255,255,255,0.02);
          border: 1.5px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          color: #f1f5f9;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          caret-color: #818cf8;
        }
        .al-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.04);
        }
        .al-input::placeholder { color: #2d3748; }

        .al-eye {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          display: flex;
          padding: 4px;
          transition: color 0.2s;
        }
        .al-eye:hover { color: #94a3b8; }
        .al-eye svg { width: 17px; height: 17px; }

        .al-input.pr { padding-right: 42px; }

        /* Options Row */
        .al-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2px;
        }
        .al-remember {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.8rem;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }
        .al-chk {
          appearance: none;
          width: 15px; height: 15px;
          border-radius: 4px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: transparent;
          cursor: pointer;
          position: relative;
          outline: none;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .al-chk:checked {
          background: #6366f1;
          border-color: #6366f1;
        }
        .al-chk:checked::after {
          content: '';
          display: block;
          position: absolute;
          left: 3px; top: 0px;
          width: 5px; height: 9px;
          border: 2px solid #fff;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }
        .al-home-link {
          font-size: 0.8rem;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: color 0.2s;
        }
        .al-home-link:hover { color: #94a3b8; }

        /* Submit */
        .al-submit {
          width: 100%;
          padding: 12px;
          background: #f8fafc;
          color: #0f172a;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 4px;
          letter-spacing: 0.01em;
        }
        .al-submit:hover:not(:disabled) {
          background: #e2e8f0;
          transform: translateY(-1px);
        }
        .al-submit:active:not(:disabled) { transform: translateY(0); }
        .al-submit:disabled {
          background: #1e293b;
          color: #475569;
          cursor: not-allowed;
        }
        .al-submit svg { width: 15px; height: 15px; transition: transform 0.2s; }
        .al-submit:hover:not(:disabled) svg { transform: translateX(3px); }

        /* Spinner */
        .al-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(15,23,42,0.2);
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: al-rotate 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes al-rotate { to { transform: rotate(360deg); } }

        /* Footer */
        .al-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 28px;
          font-size: 0.73rem;
          color: #334155;
        }
        .al-footer svg { width: 12px; height: 12px; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .al-root { flex-direction: column; }
          .al-left {
            width: 100%;
            padding: 32px 24px;
            flex-direction: row;
            align-items: center;
            gap: 16px;
          }
          .al-left::after { display: none; }
          .al-orb, .al-orb-2 { display: none; }
          .al-logo-ring { width: 48px; height: 48px; border-radius: 12px; margin-bottom: 0; flex-shrink: 0; }
          .al-brand { display: flex; flex-direction: column; gap: 0; }
          .al-brand-name { font-size: 1.1rem; margin-bottom: 2px; }
          .al-brand-tag { margin-bottom: 0; }
          .al-tagline { display: none; }
          .al-right {
            flex: 1;
            padding: 36px 20px 48px;
            align-items: flex-start;
          }
          .al-card { max-width: 100%; }
          .al-heading { font-size: 1.5rem; }
        }

        @media (max-width: 480px) {
          .al-left { padding: 20px 16px; }
          .al-right { padding: 28px 16px 40px; }
          .al-options { flex-direction: column; align-items: flex-start; gap: 10px; }
        }

        @media (min-width: 1400px) {
          .al-left { padding: 80px 72px; }
          .al-right { padding: 64px 48px; }
          .al-card { max-width: 420px; }
        }
      `}</style>

      <div className="al-root">

        {/* ── LEFT STRIP ── */}
        <div className="al-left">
          <div className="al-orb"></div>
          <div className="al-orb-2"></div>

          <div className="al-brand">
            <div className="al-logo-ring">
              <img src="/logo.png" alt="OHC Logo" />
            </div>
            <h1 className="al-brand-name">Outreach Hope<br />Church Sunshine</h1>
            <p className="al-brand-tag">House of Bread</p>
            <p className="al-tagline">"Where the Word is Preached and Love is Experienced"</p>
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="al-right">
          <div className="al-card">
            <h2 className="al-heading">Welcome back</h2>
            <p className="al-sub">Sign in to the ADMIN account</p>

            {error && (
              <div className="al-error">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <form className="al-form" onSubmit={handleLogin} autoComplete="off">

              {/* Email */}
              <div className="al-field">
                <label className="al-label">Email</label>
                <div className="al-input-wrap">
                  <span className="al-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </span>
                  <input
                    className="al-input"
                    type="email"
                    name="email"
                    required
                    autoComplete="off"
                    placeholder="Enter admin email"
                    value={credentials.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="al-field">
                <label className="al-label">Password</label>
                <div className="al-input-wrap">
                  <span className="al-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    className="al-input pr"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="new-password"
                    placeholder="Enter admin password"
                    value={credentials.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="al-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="al-options">
                <label className="al-remember">
                  <input type="checkbox" className="al-chk" />
                  Keep me signed in
                </label>
                <a href="/" className="al-home-link">← Church Home</a>
              </div>

              {/* Submit */}
              <button type="submit" className="al-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="al-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

            </form>

            {/* Footer */}
            <div className="al-footer">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Encrypted &amp; Secure Access
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default AdminLogin;
