import { useState, useEffect } from "react";
import "../apiConfig"; // Ensure axios is configured with auth interceptor
import axios from "axios";
import { ADMIN_ROLE_LABELS, canAccessAdminSection, clearAdminAuth, getAdminAuth } from "../adminAccess";

const styles = {
  /* ── Page wrapper ── */
  page: {
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    minHeight: "100vh",
    color: "#f8fafc",
  },

  header: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "10px clamp(10px, 4vw, 32px)",
    minHeight: "68px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#7dd3fc",
    boxShadow: "0 0 8px #7dd3fc",
    animation: "pulse 2s infinite",
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.5px",
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "0.72rem",
    color: "#94a3b8",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    backdropFilter: "blur(6px)",
    transition: "all 0.2s",
    letterSpacing: "0.3px",
  },

  /* ── Main ── */
  main: {
    padding: "32px 40px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  /* ── Stat cards row ── */
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "36px",
  },
  statCard: (accent) => ({
    background: "rgba(30, 41, 59, 0.5)",
    backdropFilter: "blur(12px)",
    border: `1px solid ${accent}33`,
    borderRadius: "16px",
    padding: "22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    boxShadow: `0 4px 20px ${accent}11`,
    transition: "transform 0.2s, box-shadow 0.2s",
  }),
  statIcon: (accent) => ({
    width: "4px",
    height: "24px",
    borderRadius: "99px",
    background: accent,
    marginBottom: "8px",
  }),
  statNumber: (accent) => ({
    fontSize: "2rem",
    fontWeight: 800,
    color: accent,
    lineHeight: 1,
  }),
  statLabel: {
    fontSize: "0.78rem",
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },

  /* ── Section headings ── */
  sectionHeading: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#38bdf8",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderLeft: "4px solid #0ea5e9",
    paddingLeft: "12px",
  },

  /* ── Glass card ── */
  glassCard: {
    background: "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "18px",
    padding: "28px 30px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    marginBottom: "32px",
  },

  /* ── Form ── */
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "14px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    fontSize: "0.9rem",
    background: "rgba(30, 41, 59, 0.8)",
    color: "#f8fafc",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    fontSize: "0.9rem",
    background: "rgba(30, 41, 59, 0.8)",
    color: "#f8fafc",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    resize: "vertical",
    minHeight: "90px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  primaryBtn: {
    background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 28px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 700,
    letterSpacing: "0.4px",
    boxShadow: "0 4px 14px rgba(14,165,233,0.4)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  reportBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    border: "1.5px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    backdropFilter: "blur(6px)",
    transition: "all 0.2s",
    marginRight: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  deleteBtn: {
    background: "linear-gradient(90deg, #dc2626, #ef4444)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 16px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
    transition: "transform 0.15s, opacity 0.15s",
  },

  /* ── Event / Prayer cards ── */
  eventCard: {
    background: "rgba(30, 41, 59, 0.5)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "14px",
    padding: "18px 20px",
    marginBottom: "14px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  eventTitle: {
    margin: "0 0 4px",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f8fafc",
  },
  eventDate: {
    margin: "0 0 8px",
    fontSize: "0.8rem",
    color: "#38bdf8",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  eventDesc: {
    margin: "0 0 14px",
    fontSize: "0.88rem",
    color: "#94a3b8",
    lineHeight: 1.6,
  },

  prayerCard: (isRead) => ({
    background: isRead ? "rgba(30, 41, 59, 0.3)" : "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(10px)",
    border: isRead ? "1px solid rgba(255,255,255,0.02)" : "1px solid rgba(255,255,255,0.05)",
    borderLeft: `5px solid ${isRead ? "#475569" : "#38bdf8"}`,
    borderRadius: "14px",
    padding: "18px 20px",
    marginBottom: "14px",
    boxShadow: isRead ? "none" : "0 4px 16px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    opacity: isRead ? 0.7 : 1,
  }),
  prayerName: {
    fontWeight: 700,
    color: "#38bdf8",
    fontSize: "0.95rem",
  },
  prayerPhone: {
    color: "#0ea5e9",
    fontSize: "0.85rem",
  },
  prayerText: {
    margin: "8px 0 6px",
    color: "#cbd5e1",
    fontSize: "0.88rem",
    lineHeight: 1.6,
  },
  prayerMeta: {
    color: "#94a3b8",
    fontSize: "0.75rem",
    display: "block",
    marginBottom: "10px",
  },

  emptyState: {
    textAlign: "center",
    padding: "30px 0",
    color: "#64748b",
    fontSize: "0.9rem",
  },
  divider: {
    border: "none",
    borderTop: "1.5px solid rgba(255,255,255,0.05)",
    margin: "0 0 28px",
  },

  /* ── Transaction Table ── */
  tableContainer: {
    overflowX: "auto",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(14px)",
    border: "1.5px solid rgba(186,230,253,0.6)",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 32px rgba(3,105,161,0.10)",
    marginBottom: "32px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.88rem",
    textAlign: "left",
  },
  th: {
    padding: "12px 16px",
    borderBottom: "2px solid #e0f2fe",
    color: "#0369a1",
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: "0.75rem",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f0f9ff",
    color: "#475569",
  },
  statusBadge: (status) => ({
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: status === "Completed" ? "#dcfce7" : status === "Pending" ? "#fef9c3" : "#fee2e2",
    color: status === "Completed" ? "#15803d" : status === "Pending" ? "#854d0e" : "#b91c1c",
  }),
};

/* Inline <style> for keyframes & hover states */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.3); }
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 28px rgba(0,0,0,0.3) !important;
    }
    .event-card:hover, .prayer-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
    }
    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(14,165,233,0.55) !important;
    }
    .delete-btn:hover { opacity: 0.85; transform: scale(0.97); }
    .logout-btn:hover, .report-btn:hover {
      background: rgba(255,255,255,0.1) !important;
      border-color: rgba(255,255,255,0.2) !important;
    }
    .dash-input:focus {
      border-color: #0ea5e9 !important;
      box-shadow: 0 0 0 3px rgba(14,165,233,0.18) !important;
      background: rgba(30, 41, 59, 0.9) !important;
    }
  `}</style>
);

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [baptismRequests, setBaptismRequests] = useState([]);
  const [sermonAnalytics, setSermonAnalytics] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const adminAuth = getAdminAuth();
  const token = adminAuth.token;
  const roleLabel = adminAuth.roleLabel || ADMIN_ROLE_LABELS[adminAuth.role] || "Admin";
  const canAccess = (section) => canAccessAdminSection(section);
  const hiddenIfNoAccess = (section) => (canAccess(section) ? {} : { display: "none" });

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    const requests = [
      canAccessAdminSection("events") && { key: "events", request: axios.get("/events") },
      canAccessAdminSection("prayerRequests") && { key: "prayers", request: axios.get("/prayer-requests", { headers: { Authorization: token } }) },
      canAccessAdminSection("transactions") && { key: "transactions", request: axios.get("/api/admin/transactions", { headers: { Authorization: token } }) },
      canAccessAdminSection("projects") && { key: "projects", request: axios.get("/projects") },
      canAccessAdminSection("members") && { key: "members", request: axios.get("/auth/members", { headers: { Authorization: token } }) },
      canAccessAdminSection("baptism") && { key: "baptism", request: axios.get("/api/admin/baptism-requests", { headers: { Authorization: token } }) },
      canAccessAdminSection("sermons") && { key: "sermons", request: axios.get("/api/admin/sermons/analytics", { headers: { Authorization: token } }) },
    ].filter(Boolean);

    Promise.allSettled(requests.map((item) => item.request)).then((results) => {
      if (cancelled) return;
      let failedSections = 0;

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          failedSections += 1;
          return;
        }
        const data = result.value.data;
        switch (requests[index].key) {
          case "events": setEvents(data); break;
          case "prayers": setPrayerRequests(data); break;
          case "transactions": setTransactions(data); break;
          case "projects": setProjects(data); break;
          case "members": setMembers(data); break;
          case "baptism": setBaptismRequests(data); break;
          case "sermons": setSermonAnalytics(data); break;
          default: break;
        }
      });

      setDashboardError(failedSections
        ? `${failedSections} dashboard section${failedSections === 1 ? "" : "s"} could not be refreshed. Existing values were preserved.`
        : "");
      setLastUpdated(new Date());
      setDashboardLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token, adminAuth.role, refreshKey]);

  const refreshDashboard = () => {
    setDashboardLoading(true);
    setDashboardError("");
    setRefreshKey((value) => value + 1);
  };

  const handleLogout = () => {
    axios.post("/admin/logout").catch(() => {});
    clearAdminAuth();
    window.location.href = "/admin-login";
  };

  if (!token) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...styles.glassCard, textAlign: "center", padding: "52px 64px" }}>
          <p style={{ color: "#0369a1", fontWeight: 700, fontSize: "1.2rem", margin: "0 0 12px" }}>Access Restricted</p>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Please log in as an admin to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <GlobalStyle />

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerDot} />
          <div>
            <h2 style={styles.headerTitle}> Outreach Admin</h2>
            <p style={styles.headerSubtitle}>{roleLabel}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <details style={{ position: "relative" }}>
            <summary style={{ ...styles.logoutBtn, listStyle: "none", cursor: "pointer", userSelect: "none" }}>
              ⚙ Settings
            </summary>
            <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: "220px", padding: "12px", borderRadius: "12px", background: "#0f172a", border: "1px solid rgba(148,163,184,0.2)", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", zIndex: 200 }}>
              <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: "0.75rem" }}>Signed in as <strong style={{ color: "#e2e8f0" }}>{roleLabel}</strong></p>
              <button type="button" onClick={refreshDashboard} disabled={dashboardLoading} style={{ ...styles.logoutBtn, width: "100%", marginBottom: "8px" }}>
                {dashboardLoading ? "Refreshing…" : "Refresh dashboard"}
              </button>
              <button type="button" className="logout-btn" onClick={handleLogout} style={{ ...styles.logoutBtn, width: "100%", color: "#fecaca", borderColor: "rgba(248,113,113,0.25)" }}>
                ⬡ Log out
              </button>
            </div>
          </details>
        </div>
      </header>

      <main style={styles.main}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "18px", color: "#94a3b8", fontSize: "0.78rem" }}>
          <span>{dashboardLoading ? "Refreshing organizational data…" : lastUpdated ? `Last refreshed ${lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : "Dashboard ready"}</span>
          {dashboardError && (
            <span role="alert" style={{ color: "#fca5a5" }}>
              {dashboardError} <button type="button" onClick={refreshDashboard} style={{ border: 0, background: "transparent", color: "#7dd3fc", cursor: "pointer", fontWeight: 800 }}>Retry</button>
            </span>
          )}
        </div>

        {/*Stat Cards (Overview) */}
        <div style={styles.statsRow}>
          <div className="stat-card" style={{ ...styles.statCard("#38bdf8"), ...hiddenIfNoAccess("events") }}>
            <div style={styles.statIcon("#38bdf8")} />
            <span style={styles.statNumber("#38bdf8")}>{events.length}</span>
            <span style={styles.statLabel}>Outreach Events</span>
          </div>
          <div className="stat-card" style={{ ...styles.statCard("#a78bfa"), ...hiddenIfNoAccess("projects") }}>
            <div style={styles.statIcon("#a78bfa")} />
            <span style={styles.statNumber("#a78bfa")}>{projects.length}</span>
            <span style={styles.statLabel}>Active Projects</span>
          </div>
          <div className="stat-card" style={{ ...styles.statCard("#818cf8"), ...hiddenIfNoAccess("prayerRequests") }}>
            <div style={styles.statIcon("#818cf8")} />
            <span style={styles.statNumber("#818cf8")}>{prayerRequests.length}</span>
            <span style={styles.statLabel}>Prayer Requests</span>
          </div>
          <div className="stat-card" style={{ ...styles.statCard("#fbbf24"), ...hiddenIfNoAccess("members") }}>
            <div style={styles.statIcon("#fbbf24")} />
            <span style={styles.statNumber("#fbbf24")}>{members.length}</span>
            <span style={styles.statLabel}>Members</span>
          </div>
          <div className="stat-card" style={{ ...styles.statCard("#34d399"), ...hiddenIfNoAccess("transactions") }}>
            <div style={styles.statIcon("#34d399")} />
            <span style={styles.statNumber("#34d399")}>
              {transactions.filter(t => t.status === "Completed").reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </span>
            <span style={styles.statLabel}>Total Giving (KES)</span>
          </div>
          <div className="stat-card" style={{ ...styles.statCard("#38bdf8"), ...hiddenIfNoAccess("sermons") }}>
            <div style={styles.statIcon("#38bdf8")} />
            <span style={styles.statNumber("#38bdf8")}>{sermonAnalytics?.totalSermons || 0}</span>
            <span style={styles.statLabel}>Sermons</span>
          </div>
        </div>

        <hr style={styles.divider} />

        {/* Navigation Cards */}
        <h3 style={styles.sectionHeading}>Manage Sections</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>

          {/* Organization Reports Card */}
          <button type="button" className="stat-card" onClick={() => window.location.href = "/admin/reports"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #22d3ee", transition: "transform 0.2s, box-shadow 0.2s", textAlign: "left",
            ...hiddenIfNoAccess("reports"),
          }}>
            <div style={{ fontSize: "2.2rem" }} aria-hidden="true">▦</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#22d3ee" }}>Organization Reports</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Review organization-wide performance, operational workload, and audited exports.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: 600 }}>Open executive reporting →</span>
          </button>

          {/* Events Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/events"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #38bdf8", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("events"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>📅</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>Events</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Create, view, and manage church events.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
              {events.length} event{events.length !== 1 ? "s" : ""} → Open
            </span>
          </div>

          {/* Projects Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/projects"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #a78bfa", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("projects"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>🛠</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa" }}>Projects</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Create and manage ongoing church projects.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 600 }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""} → Open
            </span>
          </div>

          {/* Prayer Requests Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/prayer-requests"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #818cf8", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("prayerRequests"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>🙏</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#818cf8" }}>Prayer Requests</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Review and manage prayer submissions.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#818cf8", fontWeight: 600 }}>
              {prayerRequests.filter(pr => !pr.isRead).length} unread of {prayerRequests.length} → Open
            </span>
          </div>

          {/* Transactions Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/transactions"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #34d399", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("transactions"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>💰</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#34d399" }}>Transactions</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              View M-Pesa giving records and history.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>
              {transactions.length} record{transactions.length !== 1 ? "s" : ""} → Open
            </span>
          </div>

          {/* Members Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/members"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #fbbf24", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("members"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>👥</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fbbf24" }}>Members</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              View registered church member accounts.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#fbbf24", fontWeight: 600 }}>
              {members.length} member{members.length !== 1 ? "s" : ""} → Open
            </span>
          </div>

          {/* Baptism Requests Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/baptism"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #0284c7", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("baptism"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>💧</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0284c7" }}>Baptisms</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              View and manage holy baptism requests.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600 }}>
              {baptismRequests.filter(r => r.status === "Pending").length} pending of {baptismRequests.length} → Open
            </span>
          </div>

          {/* Sermons Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/sermons"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #38bdf8", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("sermons"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>S</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>Sermons</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Upload notes, publish sermon documents, and review reader engagement.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
              {(sermonAnalytics?.totalViews || 0).toLocaleString()} views | {(sermonAnalytics?.totalDownloads || 0).toLocaleString()} downloads
            </span>
          </div>

          {/* Ministers Photos Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/ministers"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #38bdf8", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("ministers"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>🧑‍💼</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>Ministers Photos</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Upload and manage the three minister portraits shown on the frontend page.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>Manage Ministers → Open</span>
          </div>

          {/* Gallery Card */}
          <div className="stat-card" onClick={() => window.location.href = "/admin/gallery"} style={{
            ...styles.glassCard, cursor: "pointer", marginBottom: 0, display: "flex", flexDirection: "column", gap: "14px",
            borderLeft: "5px solid #e879f9", transition: "transform 0.2s, box-shadow 0.2s",
            ...hiddenIfNoAccess("gallery"),
          }}>
            <div style={{ fontSize: "2.2rem" }}>🖼</div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#e879f9" }}>Gallery</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Upload and manage church photos &amp; videos.
            </p>
            <span style={{ fontSize: "0.8rem", color: "#e879f9", fontWeight: 600 }}>Manage Gallery → Open</span>
          </div>

        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;
