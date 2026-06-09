import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SITE_URL } from "../apiConfig";

const styles = {
  page: {
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    minHeight: "100vh",
    color: "#f8fafc",
  },
  header: {
    background: "rgba(15, 23, 42, 0.9)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "0 32px",
    height: "68px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "14px" },
  headerTitle: { margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff" },
  headerSubtitle: { margin: 0, fontSize: "0.7rem", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase" },
  backBtn: {
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  main: { padding: "32px 40px", maxWidth: "1050px", margin: "0 auto" },
  glassCard: {
    background: "rgba(30, 41, 59, 0.5)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "18px",
    padding: "28px 30px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    marginBottom: "32px",
  },
  sectionHeading: {
    fontSize: "1rem", fontWeight: 700, color: "#38bdf8", marginBottom: "18px",
    display: "flex", alignItems: "center", gap: "10px",
    borderLeft: "4px solid #0ea5e9", paddingLeft: "12px",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" },
  input: {
    width: "100%", padding: "11px 14px", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    fontSize: "0.9rem", background: "rgba(15, 23, 42, 0.6)", color: "#f8fafc", outline: "none",
    transition: "all 0.2s", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "11px 14px", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    fontSize: "0.9rem", background: "rgba(15, 23, 42, 0.6)", color: "#f8fafc", outline: "none",
    transition: "all 0.2s", resize: "vertical", minHeight: "90px",
    boxSizing: "border-box", fontFamily: "inherit",
  },
  primaryBtn: {
    background: "linear-gradient(90deg, #0369a1, #0ea5e9)", color: "#fff", border: "none",
    borderRadius: "10px", padding: "11px 28px", cursor: "pointer", fontSize: "0.9rem",
    fontWeight: 700, boxShadow: "0 4px 14px rgba(14,165,233,0.4)", transition: "transform 0.15s, box-shadow 0.15s",
  },
  deleteBtn: {
    background: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "8px", padding: "7px 16px", cursor: "pointer", fontSize: "0.8rem",
    fontWeight: 600, transition: "all 0.2s",
  },
  shareBtn: {
    background: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "8px", padding: "7px 16px", cursor: "pointer", fontSize: "0.8rem",
    fontWeight: 600, transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "6px"
  },
  eventCardActive: {
    background: "rgba(30, 41, 59, 0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(14,165,233,0.2)",
    borderLeft: "4px solid #0ea5e9", borderRadius: "18px", padding: "22px 26px", marginBottom: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)", transition: "all 0.25s ease",
  },
  eventCardPast: {
    background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.04)",
    borderLeft: "4px solid #475569", borderRadius: "18px", padding: "20px 24px", marginBottom: "16px",
    opacity: 0.6, transition: "all 0.25s ease",
  },
  eventTitle: { margin: "0 0 5px", fontSize: "1.05rem", fontWeight: 700, color: "#fff" },
  eventTitlePast: { margin: "0 0 5px", fontSize: "1.02rem", fontWeight: 700, color: "#94a3b8", textDecoration: "line-through" },
  eventDate: { margin: "0 0 10px", fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" },
  eventDatePast: { margin: "0 0 10px", fontSize: "0.8rem", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" },
  eventDesc: { margin: "0 0 16px", fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6 },
  eventDescPast: { margin: "0 0 16px", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 },
  emptyState: { textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "0.9rem" },

  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    alignItems: "center",
    marginBottom: "28px",
    background: "rgba(30, 41, 59, 0.4)",
    padding: "18px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
  },
  filterSelect: {
    padding: "10px 14px",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    fontSize: "0.88rem",
    background: "rgba(15, 23, 42, 0.6)",
    color: "#fff",
    outline: "none",
    cursor: "pointer",
  },
  downloadBtn: {
    background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 18px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
    transition: "all 0.2s",
  },
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .event-card-active-hover:hover { transform: translateY(-2px); border-color: rgba(14,165,233,0.4) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.25) !important; }
    .event-card-past-hover:hover { opacity: 0.8; transform: translateY(-1px); }
    .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(14,165,233,0.55) !important; }
    .delete-btn:hover { background: rgba(239, 68, 68, 0.25) !important; color: #ff8787 !important; }
    .share-btn:hover { background: rgba(34, 197, 94, 0.25) !important; color: #6ee7b7 !important; }
    .back-btn:hover { background: rgba(255,255,255,0.1) !important; }
    .dash-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 3px rgba(14,165,233,0.15) !important; background: rgba(15, 23, 42, 0.8) !important; }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; color: black !important; }
      .event-card { box-shadow: none !important; border: 1px solid #ccc !important; background: white !important; }
    }
  `}</style>
);

function AdminEvents() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState([]);

  // Report Filters
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAttendeesFor, setShowAttendeesFor] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter(event => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title?.toLowerCase().includes(query);
        const matchesDesc = event.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Type Filter
      const evDate = new Date(event.date);
      evDate.setHours(0, 0, 0, 0);
      if (filterType === "Upcoming" && evDate < today) return false;
      if (filterType === "Past" && evDate >= today) return false;

      // 3. Date Range
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (evDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (evDate > end) return false;
      }

      return true;
    });
  };

  const downloadCSV = () => {
    const filtered = getFilteredEvents();
    if (filtered.length === 0) {
      alert("No events match the current filters.");
      return;
    }

    const headers = ["Title", "Date", "Status", "Description"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = filtered.map(r => {
      const evDate = new Date(r.date);
      evDate.setHours(0, 0, 0, 0);
      const status = evDate >= today ? "Upcoming" : "Past";
      const titleClean = `"${(r.title || "").replace(/"/g, '""')}"`;
      const descClean = `"${(r.description || "").replace(/"/g, '""')}"`;
      return [
        titleClean,
        new Date(r.date).toLocaleDateString(),
        status,
        descClean
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_Events_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    const filtered = getFilteredEvents();
    if (filtered.length === 0) {
      alert("No events match the current filters.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Outreach Hope Church — Events Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 11pt; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { text-align: center; color: #0369a1; font-size: 18pt; margin-bottom: 5pt; }
        h2 { text-align: center; color: #475569; font-size: 14pt; margin-top: 0; }
        p { text-align: center; color: #64748b; font-size: 10pt; }
      </style>
      </head>
      <body>
        <h1>Outreach Hope Church</h1>
        <h2>Events & Programs Report</h2>
        <p>Filters applied: Type: ${filterType} | Search: ${searchQuery || "None"} | Date Range: ${startDate || "Any"} to ${endDate || "Any"}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(r => {
      const evDate = new Date(r.date);
      evDate.setHours(0, 0, 0, 0);
      const status = evDate >= today ? "Upcoming" : "Past";
      return `
                <tr>
                  <td><b>${r.title}</b></td>
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td>${status}</td>
                  <td>${r.description}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_Events_Report_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAttendeesReport = (event) => {
    if (!event.attendees || event.attendees.length === 0) {
      alert("No attendees to report for this event.");
      return;
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Outreach Hope Church — Attendee Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 11pt; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { text-align: center; color: #0369a1; font-size: 18pt; margin-bottom: 5pt; }
        h2 { text-align: center; color: #475569; font-size: 14pt; margin-top: 0; }
        p { text-align: center; color: #64748b; font-size: 10pt; }
      </style>
      </head>
      <body>
        <h1>Outreach Hope Church</h1>
        <h2>Attendee Report: ${event.title}</h2>
        <p>Event Code: ${event.eventCode || "N/A"} | Date: ${new Date(event.date).toLocaleDateString()}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Member ID</th>
              <th>National ID</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            ${event.attendees.map(a => `
              <tr>
                <td>${a.name}</td>
                <td>${a.memberId || "N/A"}</td>
                <td>${a.idNo || a.idNumber || "N/A"}</td>
                <td>${a.phone}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_Event_Attendees_${event.eventCode || event._id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchEvents = async () => {
    const res = await axios.get("http://localhost:5000/events");
    setEvents(res.data);
  };

  useEffect(() => {
    if (token) fetchEvents();
    else navigate("/admin-login");
  }, [token]);

  const shareToWhatsApp = (eventData) => {
    const formattedDate = new Date(eventData.date).toLocaleDateString("en-US", {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const message =
      `OUTREACH HOPE CHURCH Sunshine\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      ` NEW EVENT ANNOUNCEMENT \n\n` +
      `Topic: ${eventData.title.toUpperCase()}\n` +
      `Date: ${formattedDate}\n` +
      `Location: OHC Sunshine Sanctuary\n\n` +
      `About: \n${eventData.description}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `View more details here:\n` +
      `${SITE_URL}/events\n\n` +
      `#OutreachHopeChurch #ChurchEvents #Sunshine`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const createEvent = async () => {
    if (!title.trim() || !date || !description.trim()) {
      alert("All fields are required to post an event.");
      return;
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("Cannot publish an event with a past date. Please select today or a future date.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/events", { title, date, description }, { headers: { Authorization: token } });
      const newEvent = { title, date, description };
      setTitle(""); setDate(""); setDescription("");
      fetchEvents();

      shareToWhatsApp(newEvent);
    } catch (err) { alert("Error creating event"); }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    await axios.delete(`http://localhost:5000/events/${id}`, { headers: { Authorization: token } });
    fetchEvents();
  };

  return (
    <div style={styles.page}>
      <GlobalStyle />
      <header style={styles.header} className="no-print">
        <div style={styles.headerLeft}>
          <div style={{
            width: "40px", height: "40px",
            background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.1))",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
            border: "1px solid rgba(14,165,233,0.3)",
          }}>📅</div>
          <div>
            <h2 style={styles.headerTitle}>Manage Events</h2>
            <p style={styles.headerSubtitle}>Create &amp; publish church events</p>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate("/admin-dashboard")} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </header>

      <main style={styles.main}>
        {/* Print Header */}
        <div className="print-only" style={{ display: "none", textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#0369a1", margin: "0 0 5px", fontFamily: "'Poppins', sans-serif" }}>Outreach Hope Church</h1>
          <h2 style={{ color: "#475569", fontSize: "1.2rem", margin: 0, fontFamily: "'Poppins', sans-serif" }}>Events &amp; Programs Report</h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Create Event Form */}
        <div style={styles.glassCard} className="no-print">
          <h3 style={styles.sectionHeading}>Post a New Event</h3>
          <div style={styles.formGrid}>
            <input className="dash-input" placeholder="Event Title" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
            <input
              className="dash-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={styles.input}
            />
          </div>
          <textarea className="dash-input" placeholder="Event description…" value={description} onChange={(e) => setDescription(e.target.value)} style={styles.textarea} />
          <button className="primary-btn" onClick={createEvent} style={{ ...styles.primaryBtn, marginTop: "14px" }}>
            🚀 Publish &amp; Share
          </button>
        </div>

        {/* Dynamic Filters & Modern Report Panel */}
        <div style={styles.filterRow} className="no-print">
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1, alignItems: "center" }}>
            <input
              className="dash-input"
              placeholder="🔍 Search title or desc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...styles.input, width: "200px" }}
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Events</option>
              <option value="Upcoming">Upcoming Only</option>
              <option value="Past">Past Only</option>
            </select>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>From:</span>
              <input
                className="dash-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...styles.input, width: "135px", padding: "6px 10px" }}
              />
              <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>To:</span>
              <input
                className="dash-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...styles.input, width: "135px", padding: "6px 10px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #10b981, #059669)" }} onClick={downloadCSV}>📊 CSV</button>
            <button style={styles.downloadBtn} onClick={downloadReport}>📄 Word Doc</button>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #475569, #64748b)" }} onClick={handlePrint}>🖨️ Print PDF</button>
          </div>
        </div>

        {/* Events List - Split by Date & Filters */}
        {(() => {
          const filtered = getFilteredEvents();
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcomingEvents = filtered.filter(event => {
            const evDate = new Date(event.date);
            evDate.setHours(0, 0, 0, 0);
            return evDate >= today;
          });

          const pastEvents = filtered.filter(event => {
            const evDate = new Date(event.date);
            evDate.setHours(0, 0, 0, 0);
            return evDate < today;
          });

          return (
            <>
              {/* Upcoming Events */}
              {(filterType === "All" || filterType === "Upcoming") && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={styles.sectionHeading}>
                    Upcoming Events
                    <span style={{ background: "linear-gradient(90deg,#0369a1,#0ea5e9)", color: "#fff", borderRadius: "999px", padding: "2px 12px", fontSize: "0.75rem", fontWeight: 700, marginLeft: "10px" }}>
                      {upcomingEvents.length}
                    </span>
                  </h3>
                  {upcomingEvents.length === 0 ? (
                    <div style={styles.emptyState}><p>No upcoming events match the current criteria.</p></div>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div className="event-card-active-hover" key={event._id} style={styles.eventCardActive}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                          <div>
                            <h4 style={styles.eventTitle}>{event.title} <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 400 }}>({event.eventCode || "N/A"})</span></h4>
                            <p style={styles.eventDate}>
                              <span>📅</span> {new Date(event.date).toLocaleDateString("en-US", { weekday: 'long', year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700,
                            padding: "4px 10px", borderRadius: "999px",
                            background: "rgba(14,165,233,0.15)",
                            color: "#38bdf8",
                            border: "1px solid rgba(14,165,233,0.25)",
                            letterSpacing: "0.05em"
                          }}>
                            ⚡ ACTIVE
                          </span>
                        </div>
                        <p style={styles.eventDesc}>{event.description}</p>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }} className="no-print">
                          {(event.attendeesCount > 0 || (event.attendees && event.attendees.length > 0)) && (
                            <button
                              onClick={() => setShowAttendeesFor(showAttendeesFor === event._id ? null : event._id)}
                              style={{
                                background: "rgba(14, 165, 233, 0.1)", color: "#38bdf8", border: "1px solid rgba(14, 165, 233, 0.2)",
                                borderRadius: "8px", padding: "7px 16px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600
                              }}
                            >
                              👥 Attendees ({event.attendees ? event.attendees.length : event.attendeesCount})
                            </button>
                          )}
                          <button className="share-btn" onClick={() => shareToWhatsApp(event)} style={styles.shareBtn}>
                            💬 Re-Share to WhatsApp
                          </button>
                          <button className="delete-btn" onClick={() => deleteEvent(event._id)} style={styles.deleteBtn}>
                            🗑️ Delete Event
                          </button>
                        </div>

                        {showAttendeesFor === event._id && event.attendees && event.attendees.length > 0 && (
                          <div style={{ marginTop: "16px", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                              <h5 style={{ margin: 0, color: "#38bdf8", fontSize: "0.85rem" }}>Attendee Record</h5>
                              <button
                                onClick={() => downloadAttendeesReport(event)}
                                style={{ background: "linear-gradient(90deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                              >
                                ⬇ Download Report
                              </button>
                            </div>
                            <table style={{ width: "100%", fontSize: "0.8rem", color: "#cbd5e1", borderCollapse: "collapse", textAlign: "left" }}>
                              <thead>
                                <tr>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Name</th>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Member ID</th>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>National ID</th>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Phone</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.attendees.map((a, i) => (
                                  <tr key={i}>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.name}</td>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.memberId || "N/A"}</td>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.idNo || a.idNumber || "N/A"}</td>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.phone}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Past Events */}
              {(filterType === "All" || filterType === "Past") && (
                <div>
                  <h3 style={{ ...styles.sectionHeading, marginTop: "20px", borderLeftColor: "#475569", color: "#94a3b8" }}>
                    Past Events (Archived)
                    <span style={{ background: "linear-gradient(90deg,#475569,#64748b)", color: "#fff", borderRadius: "999px", padding: "2px 12px", fontSize: "0.75rem", fontWeight: 700, marginLeft: "10px" }}>
                      {pastEvents.length}
                    </span>
                  </h3>
                  {pastEvents.length === 0 ? (
                    <div style={styles.emptyState}><p>No past events match the current criteria.</p></div>
                  ) : (
                    pastEvents.map((event) => (
                      <div className="event-card-past-hover" key={event._id} style={styles.eventCardPast}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                          <div>
                            <h4 style={styles.eventTitlePast}>{event.title} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 400, textDecoration: "none" }}>({event.eventCode || "N/A"})</span></h4>
                            <p style={styles.eventDatePast}>
                              <span>📁</span> {new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} (Passed)
                            </p>
                          </div>
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700,
                            padding: "4px 10px", borderRadius: "999px",
                            background: "rgba(100,116,139,0.1)",
                            color: "#64748b",
                            border: "1px solid rgba(100,116,139,0.15)",
                            letterSpacing: "0.05em"
                          }}>
                            PASSED
                          </span>
                        </div>
                        <p style={styles.eventDescPast}>{event.description}</p>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }} className="no-print">
                          {(event.attendeesCount > 0 || (event.attendees && event.attendees.length > 0)) && (
                            <button
                              onClick={() => setShowAttendeesFor(showAttendeesFor === event._id ? null : event._id)}
                              style={{
                                background: "rgba(100, 116, 139, 0.1)", color: "#94a3b8", border: "1px solid rgba(100, 116, 139, 0.2)",
                                borderRadius: "8px", padding: "7px 16px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600
                              }}
                            >
                              👥 View Attendees ({event.attendees ? event.attendees.length : event.attendeesCount})
                            </button>
                          )}
                          <button className="delete-btn" onClick={() => deleteEvent(event._id)} style={styles.deleteBtn}>
                            🗑️ Delete Event
                          </button>
                        </div>

                        {showAttendeesFor === event._id && event.attendees && event.attendees.length > 0 && (
                          <div style={{ marginTop: "16px", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                              <h5 style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>Attendee Record</h5>
                              <button
                                onClick={() => downloadAttendeesReport(event)}
                                style={{ background: "linear-gradient(90deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                              >
                                ⬇ Download Report
                              </button>
                            </div>
                            <table style={{ width: "100%", fontSize: "0.8rem", color: "#94a3b8", borderCollapse: "collapse", textAlign: "left" }}>
                              <thead>
                                <tr>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Name</th>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Member ID</th>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>National ID</th>
                                  <th style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Phone</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.attendees.map((a, i) => (
                                  <tr key={i}>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.name}</td>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.memberId || "N/A"}</td>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.idNo || a.idNumber || "N/A"}</td>
                                    <td style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{a.phone}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          );
        })()}
      </main>
    </div>
  );
}

export default AdminEvents;
