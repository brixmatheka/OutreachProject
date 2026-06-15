import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminPrayerRequests() {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const getToken = () => localStorage.getItem("token");
  const navigate = useNavigate();

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      navigate("/admin-login");
      return true;
    }
    return false;
  };

  const fetchPrayerRequests = async () => {
    try {
      const res = await axios.get("/prayer-requests", {
        headers: { Authorization: getToken() },
      });
      setPrayerRequests(res.data);
    } catch (err) {
      if (!handleAuthError(err)) setPrayerRequests([]);
    }
  };

  useEffect(() => {
    if (getToken()) fetchPrayerRequests();
    else navigate("/admin-login");
  }, []);

  const deletePrayerRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prayer request?")) return;
    try {
      await axios.delete(`/prayer-requests/${id}`, {
        headers: { Authorization: getToken() },
      });
      if (expandedId === id) setExpandedId(null);
      fetchPrayerRequests();
    } catch (err) {
      if (!handleAuthError(err)) alert("Failed to delete. Please try again.");
    }
  };

  const toggleReadStatus = async (id, currentStatus) => {
    try {
      await axios.patch(
        `/prayer-requests/${id}/read`,
        { isRead: !currentStatus },
        { headers: { Authorization: getToken() } }
      );
      fetchPrayerRequests();
    } catch (err) {
      if (!handleAuthError(err)) alert("Failed to update status. Please try again.");
    }
  };

  // Extract category tag from request text if present
  const parseRequest = (text) => {
    const match = text?.match(/^\[(.+?)\]\s*\[(.+?)\]\s*([\s\S]*)$/);
    if (match) return { category: match[1], urgency: match[2], body: match[3] };
    return { category: null, urgency: null, body: text };
  };

  const filteredRequests = prayerRequests.filter((pr) => {
    const { category, urgency } = parseRequest(pr.request);
    if (filter === "unread" && pr.isRead) return false;
    if (filter === "read" && !pr.isRead) return false;
    if (categoryFilter !== "all" && !category?.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
    if (urgencyFilter !== "all" && !urgency?.toLowerCase().includes(urgencyFilter.toLowerCase())) return false;
    return true;
  });

  const unreadCount = prayerRequests.filter((pr) => !pr.isRead).length;
  const readCount = prayerRequests.length - unreadCount;

  return (
    <div style={{
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      minHeight: "100vh",
      color: "#f8fafc",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .pr-card { transition: all 0.25s ease; }
        .pr-card:hover { transform: translateY(-2px); }
        .filter-tab { transition: all 0.2s ease; }
        .filter-tab:hover { opacity: 0.85; }
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover { transform: translateY(-1px); }
        .back-btn:hover { background: rgba(255,255,255,0.1) !important; }
        @media print {
          header { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: "rgba(15,23,42,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 32px",
        height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px", height: "40px",
            background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.1))",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
            border: "1px solid rgba(14,165,233,0.3)",
          }}>🙏</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Prayer Requests</h2>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase" }}>
              Ministry Intercession Panel
            </p>
          </div>
        </div>
        <button
          className="back-btn"
          onClick={() => navigate("/admin-dashboard")}
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            border: "1.5px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", padding: "8px 20px",
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
          }}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ padding: "32px 40px", maxWidth: "1000px", margin: "0 auto" }}>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[
            { label: "Total Requests", value: prayerRequests.length, color: "#38bdf8", icon: "📋" },
            { label: "Awaiting Prayer", value: unreadCount, color: "#f59e0b", icon: "🔔" },
            { label: "Prayed Over", value: readCount, color: "#4ade80", icon: "✅" },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: "1 1 150px",
              background: "rgba(30,41,59,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "16px",
              padding: "20px 24px",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: "42px", height: "42px",
                background: `${stat.color}18`,
                borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px",
              }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "3px" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }} className="no-print">
          {[
            { key: "all", label: `All Requests`, count: prayerRequests.length },
            { key: "unread", label: `Unread`, count: unreadCount },
            { key: "read", label: `Prayed Over`, count: readCount },
          ].map((tab) => (
            <button
              key={tab.key}
              className="filter-tab"
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "9px 20px",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "0.83rem",
                fontWeight: 600,
                background: filter === tab.key
                  ? "linear-gradient(90deg, #0369a1, #0ea5e9)"
                  : "rgba(30,41,59,0.6)",
                color: filter === tab.key ? "#fff" : "#64748b",
                boxShadow: filter === tab.key ? "0 4px 14px rgba(14,165,233,0.3)" : "none",
                border: filter === tab.key ? "none" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: "8px",
                background: filter === tab.key ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.06)",
                borderRadius: "999px",
                padding: "1px 8px",
                fontSize: "0.75rem",
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dropdown filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }} className="no-print">
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                background: "rgba(30,41,59,0.8)",
                color: categoryFilter !== "all" ? "#38bdf8" : "#94a3b8",
                border: `1.5px solid ${categoryFilter !== "all" ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "10px",
                padding: "9px 36px 9px 14px",
                fontSize: "0.83rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                minWidth: "190px",
              }}
            >
              <option value="all">All Categories</option>
              <option value="Health">🏥 Health &amp; Healing</option>
              <option value="Family">👨‍👩‍👧 Family &amp; Relationships</option>
              <option value="Finance">💼 Finances &amp; Provision</option>
              <option value="Spiritual">✝️ Spiritual Growth</option>
              <option value="Grief">🕊️ Grief &amp; Loss</option>
              <option value="Work">📋 Work &amp; Career</option>
              <option value="Marriage">💍 Marriage &amp; Couples</option>
              <option value="Salvation">🙌 Salvation</option>
              <option value="Guidance">🧭 Guidance &amp; Decision</option>
              <option value="Other">📝 Other</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              style={{
                background: "rgba(30,41,59,0.8)",
                color: urgencyFilter !== "all" ? (urgencyFilter === "urgent" ? "#fbbf24" : "#38bdf8") : "#94a3b8",
                border: `1.5px solid ${urgencyFilter === "urgent" ? "rgba(245,158,11,0.4)" : urgencyFilter !== "all" ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "10px",
                padding: "9px 36px 9px 14px",
                fontSize: "0.83rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                minWidth: "160px",
              }}
            >
              <option value="all">All Urgency</option>
              <option value="standard">🔵 Standard</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {(categoryFilter !== "all" || urgencyFilter !== "all") && (
            <button
              onClick={() => { setCategoryFilter("all"); setUrgencyFilter("all"); }}
              style={{
                alignSelf: "flex-end",
                padding: "9px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(30,41,59,0.5)",
                color: "#64748b",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Section heading */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "20px",
          borderLeft: "4px solid #0ea5e9", paddingLeft: "12px",
        }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#38bdf8" }}>
            {filter === "all" ? "All Prayer Requests" : filter === "unread" ? "Unread — Awaiting Prayer" : "Prayed Over"}
          </h3>
          <span style={{
            background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
            color: "#fff", borderRadius: "999px",
            padding: "2px 12px", fontSize: "0.73rem", fontWeight: 700,
          }}>
            {filteredRequests.length}
          </span>
        </div>

        {/* Prayer request cards */}
        {filteredRequests.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            background: "rgba(30,41,59,0.4)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "20px",
            color: "#475569", fontSize: "0.9rem",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🕊️</div>
            No prayer requests found in this category.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredRequests.map((pr) => {
              const isExpanded = expandedId === pr._id;
              const { category, urgency, body } = parseRequest(pr.request);
              const isUrgent = urgency?.toLowerCase().includes("urgent");

              return (
                <div
                  key={pr._id}
                  className="pr-card"
                  style={{
                    background: pr.isRead
                      ? "rgba(15,23,42,0.5)"
                      : "rgba(30,41,59,0.75)",
                    backdropFilter: "blur(14px)",
                    border: pr.isRead
                      ? "1px solid rgba(255,255,255,0.04)"
                      : isUrgent
                        ? "1px solid rgba(245,158,11,0.35)"
                        : "1px solid rgba(14,165,233,0.2)",
                    borderLeft: `4px solid ${pr.isRead ? "#334155" : isUrgent ? "#f59e0b" : "#0ea5e9"}`,
                    borderRadius: "18px",
                    overflow: "hidden",
                    opacity: pr.isRead ? 0.7 : 1,
                  }}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : pr._id)}
                    style={{
                      padding: "18px 24px",
                      cursor: "pointer",
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                      {/* Avatar */}
                      <div style={{
                        width: "44px", height: "44px",
                        borderRadius: "12px",
                        background: pr.isRead
                          ? "rgba(100,116,139,0.15)"
                          : isUrgent
                            ? "rgba(245,158,11,0.15)"
                            : "rgba(14,165,233,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem", fontWeight: 800,
                        color: pr.isRead ? "#64748b" : isUrgent ? "#f59e0b" : "#38bdf8",
                        flexShrink: 0,
                        border: `1px solid ${pr.isRead ? "rgba(100,116,139,0.2)" : isUrgent ? "rgba(245,158,11,0.3)" : "rgba(14,165,233,0.25)"}`,
                      }}>
                        {pr.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{
                            fontWeight: 700, fontSize: "0.95rem",
                            color: pr.isRead ? "#64748b" : "#f1f5f9",
                            textDecoration: pr.isRead ? "line-through" : "none",
                          }}>
                            {pr.name}
                          </span>

                          {/* Badges */}
                          {!pr.isRead && (
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 700,
                              padding: "2px 8px", borderRadius: "999px",
                              background: "rgba(14,165,233,0.15)",
                              color: "#38bdf8",
                              border: "1px solid rgba(14,165,233,0.2)",
                              letterSpacing: "0.04em",
                            }}>
                              NEW
                            </span>
                          )}
                          {isUrgent && (
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 700,
                              padding: "2px 8px", borderRadius: "999px",
                              background: "rgba(245,158,11,0.15)",
                              color: "#fbbf24",
                              border: "1px solid rgba(245,158,11,0.25)",
                            }}>
                              🔴 URGENT
                            </span>
                          )}
                          {category && (
                            <span style={{
                              fontSize: "0.65rem",
                              padding: "2px 8px", borderRadius: "999px",
                              background: "rgba(99,102,241,0.1)",
                              color: "#a5b4fc",
                              border: "1px solid rgba(99,102,241,0.2)",
                            }}>
                              {category}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "3px" }}>
                          📞 {pr.phone} &nbsp;·&nbsp; {new Date(pr.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <span style={{
                      color: "#475569", fontSize: "0.9rem",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}>▼</span>
                  </div>

                  {/* Expandable body */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      padding: "20px 24px 24px",
                    }}>
                      {/* Request text */}
                      <div style={{
                        background: "rgba(15,23,42,0.5)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "12px",
                        padding: "18px 20px",
                        marginBottom: "18px",
                      }}>
                        <p style={{
                          margin: 0,
                          color: pr.isRead ? "#64748b" : "#cbd5e1",
                          fontSize: "0.92rem",
                          lineHeight: 1.8,
                          whiteSpace: "pre-wrap",
                        }}>
                          {body || pr.request}
                        </p>
                      </div>

                      {/* Pastoral note */}
                      {!pr.isRead && (
                        <div style={{
                          background: "rgba(14,165,233,0.05)",
                          border: "1px solid rgba(14,165,233,0.12)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          marginBottom: "18px",
                          fontSize: "0.8rem",
                          color: "#475569",
                          display: "flex", gap: "10px", alignItems: "flex-start",
                        }}>
                          <span style={{ fontSize: "1rem", flexShrink: 0 }}>📌</span>
                          This request has not been marked as prayed over yet. Once your team has interceded, mark it as read.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          className="action-btn"
                          onClick={(e) => { e.stopPropagation(); toggleReadStatus(pr._id, pr.isRead); }}
                          style={{
                            padding: "9px 18px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            background: pr.isRead
                              ? "rgba(100,116,139,0.15)"
                              : "linear-gradient(135deg, #0369a1, #0ea5e9)",
                            color: pr.isRead ? "#64748b" : "#fff",
                            boxShadow: pr.isRead ? "none" : "0 4px 12px rgba(14,165,233,0.3)",
                            border: pr.isRead ? "1px solid rgba(100,116,139,0.25)" : "none",
                          }}
                        >
                          {pr.isRead ? "↩ Mark as Unread" : "✓ Mark as Prayed Over"}
                        </button>

                        <button
                          className="action-btn"
                          onClick={(e) => { e.stopPropagation(); deletePrayerRequest(pr._id); }}
                          style={{
                            padding: "9px 18px",
                            borderRadius: "10px",
                            border: "1px solid rgba(239,68,68,0.25)",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            background: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                          }}
                        >
                          🗑 Delete Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPrayerRequests;
