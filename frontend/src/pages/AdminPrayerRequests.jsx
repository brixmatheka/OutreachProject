import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { downloadCsvReport, downloadPdfReport, downloadWordReport, formatReportDate } from "../adminReports";

function AdminPrayerRequests() {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
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
    setError("");
    try {
      const res = await axios.get("/prayer-requests?view=all", {
        headers: { Authorization: getToken() },
      });
      setPrayerRequests(res.data);
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.response?.data?.message || "Prayer requests could not be refreshed.");
      }
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/admin-login");
      return undefined;
    }

    let active = true;
    axios.get("/prayer-requests?view=all", {
      headers: { Authorization: token },
    }).then((res) => {
      if (active) {
        setPrayerRequests(res.data);
        setError("");
      }
    }).catch((err) => {
      if (!active) return;
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/admin-login");
      } else {
        setError(err.response?.data?.message || "Prayer requests could not be loaded. Check the connection and retry.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  const archivePrayerRequest = async (id) => {
    const request = prayerRequests.find((item) => item._id === id);
    if (!window.confirm(`Archive the prayer request from ${request?.name || "this person"}? It will be retained and can be restored later.`)) return;
    setBusyId(id);
    setError("");
    try {
      await axios.delete(`/prayer-requests/${id}`, {
        headers: { Authorization: getToken() },
      });
      if (expandedId === id) setExpandedId(null);
      fetchPrayerRequests();
    } catch (err) {
      if (!handleAuthError(err)) setError(err.response?.data?.message || "The request could not be archived.");
    } finally {
      setBusyId("");
    }
  };

  const restorePrayerRequest = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await axios.patch(`/prayer-requests/${id}/restore`, {}, {
        headers: { Authorization: getToken() },
      });
      await fetchPrayerRequests();
    } catch (err) {
      if (!handleAuthError(err)) setError(err.response?.data?.message || "The request could not be restored.");
    } finally {
      setBusyId("");
    }
  };

  const toggleReadStatus = async (id, currentStatus) => {
    setBusyId(id);
    setError("");
    try {
      await axios.patch(
        `/prayer-requests/${id}/read`,
        { isRead: !currentStatus },
        { headers: { Authorization: getToken() } }
      );
      fetchPrayerRequests();
    } catch (err) {
      if (!handleAuthError(err)) setError(err.response?.data?.message || "The pastoral-care status could not be updated.");
    } finally {
      setBusyId("");
    }
  };

  // Extract category tag from request text if present
  const parseRequest = (text) => {
    const match = text?.match(/^\[(.+?)\]\s*\[(.+?)\]\s*([\s\S]*)$/);
    if (match) return { category: match[1], urgency: match[2], body: match[3] };
    return { category: null, urgency: null, body: text };
  };

  const getRequestDetails = (pr) => {
    const legacy = parseRequest(pr.request);
    return {
      category: pr.category || legacy.category,
      urgency: pr.urgency || legacy.urgency,
      body: pr.category ? pr.request : legacy.body,
    };
  };

  const filteredRequests = prayerRequests.filter((pr) => {
    const { category, urgency } = getRequestDetails(pr);
    if (filter === "archived" && !pr.isArchived) return false;
    if (filter !== "archived" && pr.isArchived) return false;
    if (filter === "unread" && pr.isRead) return false;
    if (filter === "read" && !pr.isRead) return false;
    if (categoryFilter !== "all" && !category?.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
    if (urgencyFilter !== "all" && !urgency?.toLowerCase().includes(urgencyFilter.toLowerCase())) return false;
    return true;
  });

  const activeRequests = prayerRequests.filter((pr) => !pr.isArchived);
  const archivedCount = prayerRequests.length - activeRequests.length;
  const unreadCount = activeRequests.filter((pr) => !pr.isRead).length;
  const readCount = activeRequests.length - unreadCount;

  const getReportRows = () => filteredRequests.map((request) => {
    const parsed = getRequestDetails(request);
    return {
      name: request.name || "Not provided",
      phone: request.phone || "Not provided",
      email: request.email || "Not provided",
      category: parsed.category || "Uncategorized",
      urgency: parsed.urgency || "Unspecified",
      followUp: request.wantsCallback
        ? `Requested (${request.preferredContactMethod || "phone"}, ${request.preferredContactTime || "anytime"})`
        : "Not requested",
      status: request.isArchived ? "Archived" : request.isRead ? "Prayed Over" : "Awaiting Prayer",
      submittedAt: formatReportDate(request.createdAt, true),
      archivedAt: request.isArchived ? formatReportDate(request.archivedAt || request.updatedAt, true) : "—",
      request: parsed.body || request.request || "Not provided",
    };
  });

  const getReportFilters = () => ({
    Status: filter === "unread" ? "Awaiting Prayer" : filter === "read" ? "Prayed Over" : filter === "archived" ? "Archived" : "All active statuses",
    Category: categoryFilter === "all" ? "All categories" : categoryFilter,
    Urgency: urgencyFilter === "all" ? "All urgency levels" : urgencyFilter,
  });

  const getReportSummary = (rows) => ({
    "Filtered requests": rows.length,
    "Awaiting prayer": rows.filter((request) => request.status === "Awaiting Prayer").length,
    "Prayed over": rows.filter((request) => request.status === "Prayed Over").length,
    Archived: rows.filter((request) => request.status === "Archived").length,
    "Urgent requests": rows.filter((request) => request.urgency.toLowerCase().includes("urgent")).length,
  });

  const downloadPrayerCsv = () => {
    const rows = getReportRows();
    if (rows.length === 0) {
      alert("No prayer requests match the current filters.");
      return;
    }

    downloadCsvReport({
      title: "CONFIDENTIAL - Prayer Requests Register",
      filters: getReportFilters(),
      headers: ["Submitted", "Archived", "Name", "Phone", "Email", "Category", "Urgency", "Pastoral Follow-up", "Status", "Prayer Request"],
      rows: rows.map((request) => [
        request.submittedAt,
        request.archivedAt,
        request.name,
        request.phone,
        request.email,
        request.category,
        request.urgency,
        request.followUp,
        request.status,
        request.request,
      ]),
      summary: getReportSummary(rows),
    });
  };

  const downloadPrayerWord = () => {
    const rows = getReportRows();
    if (rows.length === 0) {
      alert("No prayer requests match the current filters.");
      return;
    }

    downloadWordReport({
      title: "CONFIDENTIAL - Prayer Requests Register",
      subtitle: "Restricted pastoral-care information. For authorized ministry use only; handle with discretion.",
      filters: getReportFilters(),
      summary: getReportSummary(rows),
      columns: [
        { label: "Submitted", value: "submittedAt" },
        { label: "Archived", value: "archivedAt" },
        { label: "Name", value: "name" },
        { label: "Phone", value: "phone" },
        { label: "Email", value: "email" },
        { label: "Category", value: "category" },
        { label: "Urgency", value: "urgency" },
        { label: "Pastoral Follow-up", value: "followUp" },
        { label: "Status", value: "status" },
        { label: "Prayer Request", value: "request" },
      ],
      rows,
    });
  };

  const downloadPrayerPdf = () => {
    const rows = getReportRows();
    if (rows.length === 0) {
      alert("No prayer requests match the current filters.");
      return;
    }

    downloadPdfReport({
      title: "CONFIDENTIAL - Prayer Requests Register",
      subtitle: "Restricted pastoral-care information. For authorized ministry use only; handle with discretion.",
      filters: getReportFilters(),
      summary: getReportSummary(rows),
      columns: [
        { label: "Submitted", value: "submittedAt" },
        { label: "Archived", value: "archivedAt" },
        { label: "Name", value: "name" },
        { label: "Phone", value: "phone" },
        { label: "Email", value: "email" },
        { label: "Category", value: "category" },
        { label: "Urgency", value: "urgency" },
        { label: "Follow-up", value: "followUp" },
        { label: "Status", value: "status" },
        { label: "Prayer Request", value: "request", width: 2.5 },
      ],
      rows,
    });
  };

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
        {error && (
          <div role="alert" style={{ marginBottom: "20px", padding: "13px 15px", borderRadius: "12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(248,113,113,0.24)", color: "#fecaca", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span>{error}</span>
            <button type="button" onClick={fetchPrayerRequests} style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid rgba(125,211,252,0.2)", background: "rgba(14,165,233,0.1)", color: "#bae6fd", cursor: "pointer", fontWeight: 700 }}>Retry</button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[
            { label: "Active Requests", value: activeRequests.length, color: "#38bdf8", icon: "📋" },
            { label: "Awaiting Prayer", value: unreadCount, color: "#f59e0b", icon: "🔔" },
            { label: "Prayed Over", value: readCount, color: "#4ade80", icon: "✅" },
            { label: "Archived", value: archivedCount, color: "#94a3b8", icon: "🗄️" },
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
            { key: "all", label: `All Active`, count: activeRequests.length },
            { key: "unread", label: `Unread`, count: unreadCount },
            { key: "read", label: `Prayed Over`, count: readCount },
            { key: "archived", label: `Archived`, count: archivedCount },
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

        {/* Confidential report actions */}
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "24px",
            padding: "14px 16px",
            border: "1px solid rgba(245,158,11,0.18)",
            borderRadius: "14px",
            background: "rgba(245,158,11,0.05)",
          }}
        >
          <div>
            <strong style={{ display: "block", color: "#fbbf24", fontSize: "0.82rem" }}>
              Confidential pastoral-care exports
            </strong>
            <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
              Reports include only the currently filtered requests and information visible in this panel.
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={downloadPrayerPdf}
              disabled={filteredRequests.length === 0}
              title="Download the filtered confidential register as PDF"
              style={{
                padding: "9px 16px",
                border: "none",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #be123c, #e11d48)",
                color: "#fff",
                cursor: filteredRequests.length === 0 ? "not-allowed" : "pointer",
                opacity: filteredRequests.length === 0 ? 0.5 : 1,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={downloadPrayerCsv}
              disabled={filteredRequests.length === 0}
              title="Download the filtered confidential register as CSV"
              style={{
                padding: "9px 16px",
                border: "none",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff",
                cursor: filteredRequests.length === 0 ? "not-allowed" : "pointer",
                opacity: filteredRequests.length === 0 ? 0.5 : 1,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={downloadPrayerWord}
              disabled={filteredRequests.length === 0}
              title="Download the filtered confidential register as a Word-compatible document"
              style={{
                padding: "9px 16px",
                border: "none",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #0369a1, #0ea5e9)",
                color: "#fff",
                cursor: filteredRequests.length === 0 ? "not-allowed" : "pointer",
                opacity: filteredRequests.length === 0 ? 0.5 : 1,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Export Word
            </button>
          </div>
        </div>

        {/* Section heading */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "20px",
          borderLeft: "4px solid #0ea5e9", paddingLeft: "12px",
        }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#38bdf8" }}>
            {filter === "all" ? "All Active Prayer Requests" : filter === "unread" ? "Unread — Awaiting Prayer" : filter === "read" ? "Prayed Over" : "Archived Prayer Requests"}
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
        {loading ? (
          <div role="status" style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading pastoral-care requests…</div>
        ) : filteredRequests.length === 0 ? (
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
              const { category, urgency, body } = getRequestDetails(pr);
              const isUrgent = urgency?.toLowerCase().includes("urgent");

              return (
                <div
                  key={pr._id}
                  className="pr-card"
                  style={{
                    background: pr.isRead || pr.isArchived
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
                    opacity: pr.isArchived ? 0.62 : pr.isRead ? 0.7 : 1,
                  }}
                >
                  {/* Card Header */}
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : pr._id)}
                    style={{
                      padding: "18px 24px",
                      cursor: "pointer",
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: "12px",
                      flexWrap: "wrap",
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                      textAlign: "left",
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
                  </button>

                  {/* Expandable body */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      padding: "20px 24px 24px",
                    }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: "10px",
                        marginBottom: "18px",
                      }}>
                        {[
                          ["Email", pr.email || "Not provided"],
                          ["Privacy", pr.isAnonymous ? "Anonymous request" : "Named request"],
                          ["Pastoral follow-up", pr.wantsCallback ? "Requested" : "Not requested"],
                          ...(pr.wantsCallback ? [
                            ["Contact method", pr.preferredContactMethod || "phone"],
                            ["Best time", pr.preferredContactTime || "anytime"],
                          ] : []),
                        ].map(([label, value]) => (
                          <div key={label} style={{ padding: "12px", borderRadius: "10px", background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.12)" }}>
                            <span style={{ display: "block", color: "#64748b", fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                            <strong style={{ display: "block", marginTop: "4px", color: pr.wantsCallback && label === "Pastoral follow-up" ? "#fbbf24" : "#cbd5e1", fontSize: "0.82rem", overflowWrap: "anywhere", textTransform: "capitalize" }}>{value}</strong>
                          </div>
                        ))}
                      </div>

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
                      {!pr.isRead && !pr.isArchived && (
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
                        {pr.isArchived ? (
                          <button
                            className="action-btn"
                            disabled={busyId === pr._id}
                            onClick={(e) => { e.stopPropagation(); restorePrayerRequest(pr._id); }}
                            style={{
                              padding: "9px 18px",
                              borderRadius: "10px",
                              border: "1px solid rgba(74,222,128,0.25)",
                              cursor: busyId === pr._id ? "wait" : "pointer",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              background: "rgba(34,197,94,0.1)",
                              color: "#86efac",
                            }}
                          >
                            {busyId === pr._id ? "Restoring…" : "Restore Request"}
                          </button>
                        ) : (
                          <>
                            <button
                              className="action-btn"
                              disabled={busyId === pr._id}
                              onClick={(e) => { e.stopPropagation(); toggleReadStatus(pr._id, pr.isRead); }}
                              style={{
                                padding: "9px 18px",
                                borderRadius: "10px",
                                cursor: busyId === pr._id ? "wait" : "pointer",
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
                              {busyId === pr._id ? "Saving…" : pr.isRead ? "↩ Mark as Unread" : "✓ Mark as Prayed Over"}
                            </button>

                            <button
                              className="action-btn"
                              disabled={busyId === pr._id}
                              onClick={(e) => { e.stopPropagation(); archivePrayerRequest(pr._id); }}
                              style={{
                                padding: "9px 18px",
                                borderRadius: "10px",
                                border: "1px solid rgba(245,158,11,0.25)",
                                cursor: busyId === pr._id ? "wait" : "pointer",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                background: "rgba(245,158,11,0.1)",
                                color: "#fbbf24",
                              }}
                            >
                              {busyId === pr._id ? "Archiving…" : "Archive Request"}
                            </button>
                          </>
                        )}
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
