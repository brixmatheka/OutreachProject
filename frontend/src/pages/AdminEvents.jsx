import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { SITE_URL } from "../apiConfig";
import {
  downloadCsvReport,
  downloadPdfReport,
  downloadWordReport,
  formatReportDate,
  maskSensitiveId,
} from "../adminReports";

const formatUploadDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Nairobi",
      })
    : "Date unavailable";

const styles = {
  page: {
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    minHeight: "100vh",
    color: "#f8fafc",
  },
  header: {
    background: "rgba(15, 23, 42, 0.9)",
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
  headerLeft: { display: "flex", alignItems: "center", gap: "14px" },
  headerTitle: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#fff",
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "0.7rem",
    color: "#64748b",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
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
    fontSize: "1rem",
    fontWeight: 700,
    color: "#38bdf8",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderLeft: "4px solid #0ea5e9",
    paddingLeft: "12px",
  },
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
    background: "rgba(15, 23, 42, 0.6)",
    color: "#f8fafc",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    fontSize: "0.9rem",
    background: "rgba(15, 23, 42, 0.6)",
    color: "#f8fafc",
    outline: "none",
    transition: "all 0.2s",
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
    boxShadow: "0 4px 14px rgba(14,165,233,0.4)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  deleteBtn: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "8px",
    padding: "7px 16px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  shareBtn: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#4ade80",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "8px",
    padding: "7px 16px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  eventCardActive: {
    background: "rgba(30, 41, 59, 0.65)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(14,165,233,0.2)",
    borderLeft: "4px solid #0ea5e9",
    borderRadius: "18px",
    padding: "22px 26px",
    marginBottom: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
    transition: "all 0.25s ease",
  },
  eventCardPast: {
    background: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderLeft: "4px solid #475569",
    borderRadius: "18px",
    padding: "20px 24px",
    marginBottom: "16px",
    opacity: 0.6,
    transition: "all 0.25s ease",
  },
  eventTitle: {
    margin: "0 0 5px",
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#fff",
  },
  eventTitlePast: {
    margin: "0 0 5px",
    fontSize: "1.02rem",
    fontWeight: 700,
    color: "#94a3b8",
    textDecoration: "line-through",
  },
  eventDate: {
    margin: "0 0 10px",
    fontSize: "0.8rem",
    color: "#38bdf8",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  eventDatePast: {
    margin: "0 0 10px",
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  eventDesc: {
    margin: "0 0 16px",
    fontSize: "0.88rem",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  eventDescPast: {
    margin: "0 0 16px",
    fontSize: "0.88rem",
    color: "#64748b",
    lineHeight: 1.6,
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 0",
    color: "#64748b",
    fontSize: "0.9rem",
  },

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
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
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

function AnnouncementAdmin({ items, refresh }) {
  const blank = {
    title: "",
    category: "General",
    description: "",
    publishDate: "",
    expiryDate: "",
    targetAudience: "Everyone",
    isPinned: false,
  };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState("");
  const [pdf, setPdf] = useState(null);
  const [busy, setBusy] = useState(false);
  const audiences = [
    "Everyone",
    "Members",
    "Leaders",
    "Youth",
    "Choir",
    "Women",
    "Men",
    "Children",
    "Visitors",
  ];
  const change = (e) =>
    setForm((old) => ({
      ...old,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const reset = () => {
    setForm(blank);
    setEditing("");
    setPdf(null);
  };
  const edit = (item) => {
    setEditing(item._id);
    setForm({
      title: item.title || "",
      category: item.category || "General",
      description: item.description || "",
      publishDate: item.date
        ? new Date(item.date).toISOString().slice(0, 16)
        : "",
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toISOString().slice(0, 16)
        : "",
      targetAudience: item.targetAudience || "Everyone",
      isPinned: Boolean(item.isPinned),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        data.append(key, String(value)),
      );
      if (pdf) data.append("pdf", pdf);
      await axios({
        method: editing ? "patch" : "post",
        url: editing ? `/announcements/${editing}` : "/announcements",
        data,
      });
      reset();
      await refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Announcement could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete announcement “${item.title}”?`)) return;
    await axios.delete(`/events/${item._id}`);
    await refresh();
  };
  const pin = async (item) => {
    await axios.patch(`/announcements/${item._id}/pin`, {
      isPinned: !item.isPinned,
    });
    await refresh();
  };
  const expire = async (item) => {
    if (!window.confirm(`Expire “${item.title}” now?`)) return;
    const data = new FormData();
    data.append("expiryDate", new Date().toISOString());
    await axios.patch(`/announcements/${item._id}`, data);
    await refresh();
  };
  return (
    <section
      style={{ ...styles.glassCard, borderColor: "rgba(251,191,36,.25)" }}
      className="no-print"
    >
      <h3
        style={{
          ...styles.sectionHeading,
          color: "#fbbf24",
          borderColor: "#f59e0b",
        }}
      >
        Announcements — shown before events
      </h3>
      <form onSubmit={save}>
        <div style={styles.formGrid}>
          <input
            name="title"
            value={form.title}
            onChange={change}
            placeholder="Announcement title"
            required
            style={styles.input}
          />
          <input
            name="category"
            value={form.category}
            onChange={change}
            placeholder="Category"
            required
            style={styles.input}
          />
          <label>
            Publish date
            <input
              name="publishDate"
              type="datetime-local"
              value={form.publishDate}
              onChange={change}
              required
              style={styles.input}
            />
          </label>
          <label>
            Expiry date
            <input
              name="expiryDate"
              type="datetime-local"
              value={form.expiryDate}
              onChange={change}
              style={styles.input}
            />
          </label>
          <select
            name="targetAudience"
            value={form.targetAudience}
            onChange={change}
            style={styles.input}
          >
            {audiences.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              name="isPinned"
              type="checkbox"
              checked={form.isPinned}
              onChange={change}
            />{" "}
            Pin announcement
          </label>
        </div>
        <textarea
          name="description"
          value={form.description}
          onChange={change}
          placeholder="Full announcement description"
          required
          style={styles.textarea}
        />
        <div style={{ marginTop: "14px", marginBottom: "14px" }}>
          <label>
            Attach PDF (optional)
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdf(e.target.files[0] || null)}
              style={styles.input}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button disabled={busy} style={styles.primaryBtn}>
            {busy
              ? "Saving..."
              : editing
                ? "Update Announcement"
                : "Create Announcement"}
          </button>
          {editing && (
            <button type="button" onClick={reset} style={styles.backBtn}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
        {items
          .sort(
            (a, b) =>
              Number(b.isPinned) - Number(a.isPinned) ||
              new Date(b.date) - new Date(a.date),
          )
          .map((item) => (
            <article
              key={item._id}
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(15,23,42,.6)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <b>
                {item.isPinned ? "Pinned · " : ""}
                {item.title}
              </b>
              <p style={{ color: "#94a3b8", margin: "6px 0" }}>
                {item.category} · {item.targetAudience} · Publishes{" "}
                {formatUploadDate(item.date)}
                {item.expiryDate
                  ? ` · Expires ${formatUploadDate(item.expiryDate)}`
                  : ""}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => edit(item)}>Edit</button>
                <button onClick={() => pin(item)}>
                  {item.isPinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => expire(item)}>Expire now</button>
                <button onClick={() => remove(item)} style={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

function AdminEvents() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [lastCreatedEvent, setLastCreatedEvent] = useState(null);

  // Report Filters
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAttendeesFor, setShowAttendeesFor] = useState(null);

  const navigate = useNavigate();

  const getAttendeeCount = (event) =>
    Number(event.attendeesCount ?? event.attendees?.length ?? 0) || 0;

  const getEventStatus = (event, today) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today ? "Upcoming" : "Past";
  };

  const getReportFilters = () => ({
    Status: filterType === "All" ? "All events" : filterType,
    Search: searchQuery.trim() || "None",
    "Date from": startDate ? formatReportDate(startDate) : "Any",
    "Date to": endDate ? formatReportDate(endDate) : "Any",
  });

  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      if (event.contentType === "announcement") return false;
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

  const downloadEventsCSV = () => {
    const filtered = getFilteredEvents();
    if (filtered.length === 0) {
      alert("No events match the current filters.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingCount = filtered.filter(
      (event) => getEventStatus(event, today) === "Upcoming",
    ).length;

    downloadCsvReport({
      title: "Events and Programs Register",
      filters: getReportFilters(),
      headers: [
        "Event Code",
        "Title",
        "Event Date",
        "Status",
        "Location",
        "Time",
        "Attendees",
        "Uploaded",
        "Description",
      ],
      rows: filtered.map((event) => [
        event.eventCode || "",
        event.title || "",
        formatReportDate(event.date),
        getEventStatus(event, today),
        event.location || "",
        event.time || "",
        getAttendeeCount(event),
        formatReportDate(event.createdAt, true),
        event.description || "",
      ]),
      summary: {
        "Total events": filtered.length,
        Upcoming: upcomingCount,
        Past: filtered.length - upcomingCount,
        "Total registrations": filtered.reduce(
          (sum, event) => sum + getAttendeeCount(event),
          0,
        ),
      },
    });
  };

  const buildEventsDocument = () => {
    const filtered = getFilteredEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingCount = filtered.filter(
      (event) => getEventStatus(event, today) === "Upcoming",
    ).length;
    return {
      title: "Events and Programs Report",
      subtitle: "Program schedule, venue, attendance, and publication register",
      filters: getReportFilters(),
      summary: {
        "Total events": filtered.length,
        Upcoming: upcomingCount,
        Past: filtered.length - upcomingCount,
        Registrations: filtered.reduce(
          (sum, event) => sum + getAttendeeCount(event),
          0,
        ),
      },
      columns: [
        { label: "Code", value: (event) => event.eventCode || "—" },
        { label: "Event", value: (event) => event.title || "—" },
        { label: "Date", value: (event) => formatReportDate(event.date) },
        { label: "Status", value: (event) => getEventStatus(event, today) },
        { label: "Location", value: (event) => event.location || "—" },
        { label: "Time", value: (event) => event.time || "—" },
        { label: "Attendees", value: getAttendeeCount },
        {
          label: "Uploaded",
          value: (event) => formatReportDate(event.createdAt, true),
        },
        { label: "Description", value: (event) => event.description || "—" },
      ],
      rows: filtered,
    };
  };

  const downloadEventsWord = () => {
    const filtered = getFilteredEvents();
    if (filtered.length === 0) {
      alert("No events match the current filters.");
      return;
    }
    downloadWordReport(buildEventsDocument());
  };

  const downloadAttendeesReport = (event) => {
    const attendees = event.attendees || [];
    if (attendees.length === 0) {
      alert("No attendees to report for this event.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    downloadWordReport({
      title: `Event Attendees - ${event.title || "Untitled Event"}`,
      subtitle: "Registration and attendance contact register",
      filters: {
        "Event code": event.eventCode || "Not assigned",
        "Event date": formatReportDate(event.date),
        Status: getEventStatus(event, today),
      },
      summary: {
        "Registered attendees": attendees.length,
        Members: attendees.filter((attendee) => attendee.memberId).length,
        Guests: attendees.filter((attendee) => !attendee.memberId).length,
      },
      columns: [
        { label: "Name", value: (attendee) => attendee.name || "—" },
        {
          label: "Member ID",
          value: (attendee) => attendee.memberId || "Guest",
        },
        {
          label: "National ID (masked)",
          value: (attendee) =>
            maskSensitiveId(attendee.idNo || attendee.idNumber),
        },
        { label: "Phone", value: (attendee) => attendee.phone || "—" },
      ],
      rows: attendees,
    });
  };

  const handlePrint = () => {
    if (getFilteredEvents().length === 0) {
      alert("No events match the current filters.");
      return;
    }
    downloadPdfReport(buildEventsDocument());
  };

  const fetchEvents = async () => {
    setError("");
    try {
      const res = await axios.get("/api/admin/events");
      setEvents(res.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Events could not be refreshed.",
      );
    }
  };

  useEffect(() => {
    let active = true;

    axios
      .get("/api/admin/events")
      .then((res) => {
        if (active) {
          setEvents(res.data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!active) return;
        if ([401, 403].includes(requestError.response?.status)) {
          navigate("/admin-login");
        } else {
          setError(
            requestError.response?.data?.message ||
              "Events could not be loaded. Check the connection and retry.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(
    () => () => {
      if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    },
    [bannerPreview],
  );

  const shareToWhatsApp = (eventData) => {
    const formattedDate = new Date(eventData.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const message =
      `OUTREACH HOPE CHURCH Sunshine\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      ` NEW EVENT ANNOUNCEMENT \n\n` +
      `Topic: ${eventData.title.toUpperCase()}\n` +
      `Date: ${formattedDate}\n` +
      `Location: ${eventData.location || "OHC Sunshine Sanctuary"}\n` +
      `${eventData.time ? `Time: ${eventData.time}\n` : ""}\n` +
      `About: \n${eventData.description}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `View more details here:\n` +
      `${SITE_URL}/events\n\n` +
      `#OutreachHopeChurch #ChurchEvents #Sunshine`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    } else {
      setBannerFile(null);
      setBannerPreview("");
    }
  };

  const resetEventForm = () => {
    if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setTitle("");
    setDate("");
    setDescription("");
    setLocation("");
    setTime("");
    setBannerFile(null);
    setBannerPreview("");
    setEditingId("");
  };

  const editEvent = (event) => {
    if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setEditingId(event._id);
    setTitle(event.title || "");
    setDate(event.date ? new Date(event.date).toISOString().slice(0, 10) : "");
    setDescription(event.description || "");
    setLocation(event.location || "");
    setTime(event.time || "");
    setBannerFile(null);
    setBannerPreview(event.banner || "");
    setLastCreatedEvent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    if (!editingId && selectedDate < today) {
      alert(
        "Cannot publish an event with a past date. Please select today or a future date.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("date", date);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("time", time);
      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      const response = editingId
        ? await axios.patch(`/events/${editingId}`, formData)
        : await axios.post("/events", formData);
      const savedEvent = response.data?.event || {
        title,
        date,
        description,
        location,
        time,
      };
      if (!editingId) setLastCreatedEvent(savedEvent);
      resetEventForm();
      await fetchEvents();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Event could not be ${editingId ? "updated" : "created"}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id) => {
    const event = events.find((item) => item._id === id);
    if (
      !window.confirm(
        `Permanently delete "${event?.title || "this event"}" and its attendee register? This cannot be undone.`,
      )
    )
      return;
    setDeletingId(id);
    setError("");
    try {
      await axios.delete(`/events/${id}`);
      await fetchEvents();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "The event could not be deleted.",
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div style={styles.page}>
      <GlobalStyle />
      <header style={styles.header} className="no-print">
        <div style={styles.headerLeft}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background:
                "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.1))",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              border: "1px solid rgba(14,165,233,0.3)",
            }}
          >
            📅
          </div>
          <div>
            <h2 style={styles.headerTitle}>Manage Events</h2>
            <p style={styles.headerSubtitle}>
              Create &amp; publish church events
            </p>
          </div>
        </div>
        <button
          className="back-btn"
          onClick={() => navigate("/admin-dashboard")}
          style={styles.backBtn}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main style={styles.main}>
        <AnnouncementAdmin
          items={events.filter((item) => item.contentType === "announcement")}
          refresh={fetchEvents}
        />
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "18px",
              padding: "13px 15px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(248,113,113,0.24)",
              color: "#fecaca",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchEvents}
              style={{ ...styles.backBtn, padding: "7px 12px" }}
            >
              Retry
            </button>
          </div>
        )}

        {lastCreatedEvent && (
          <div
            role="status"
            className="no-print"
            style={{
              marginBottom: "18px",
              padding: "13px 15px",
              borderRadius: "12px",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(74,222,128,0.22)",
              color: "#bbf7d0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span>
              <strong>{lastCreatedEvent.title}</strong> was published
              successfully.
            </span>
            <button
              type="button"
              onClick={() => shareToWhatsApp(lastCreatedEvent)}
              style={styles.shareBtn}
            >
              Share to WhatsApp
            </button>
          </div>
        )}

        {/* Print Header */}
        <div
          className="print-only"
          style={{ display: "none", textAlign: "center", marginBottom: "40px" }}
        >
          <h1
            style={{
              color: "#0369a1",
              margin: "0 0 5px",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Outreach Hope Church
          </h1>
          <h2
            style={{
              color: "#475569",
              fontSize: "1.2rem",
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Events &amp; Programs Report
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Generated on: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Create Event Form */}
        <div style={styles.glassCard} className="no-print">
          <h3 style={styles.sectionHeading}>
            {editingId ? "Edit Event" : "Post a New Event"}
          </h3>
          <div style={styles.formGrid}>
            <input
              className="dash-input"
              placeholder="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
            <input
              className="dash-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={
                editingId ? undefined : new Date().toISOString().split("T")[0]
              }
              style={styles.input}
            />
          </div>
          <div style={styles.formGrid}>
            <input
              className="dash-input"
              placeholder="Location (for example, Main Sanctuary)"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              style={styles.input}
            />
            <input
              className="dash-input"
              type="time"
              aria-label="Event time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "0.85rem",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              Event Banner Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              style={{ ...styles.input, padding: "8px", fontSize: "0.85rem" }}
            />
            {bannerPreview && (
              <div
                style={{
                  marginTop: "10px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  maxHeight: "180px",
                }}
              >
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  style={{
                    width: "100%",
                    objectFit: "cover",
                    maxHeight: "180px",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}
          </div>
          <textarea
            className="dash-input"
            placeholder="Event description…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
          />
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              className="primary-btn"
              disabled={saving}
              onClick={createEvent}
              style={{ ...styles.primaryBtn, opacity: saving ? 0.65 : 1 }}
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Save Event Changes"
                  : "Publish Event"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetEventForm}
                disabled={saving}
                style={styles.backBtn}
              >
                Cancel editing
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filters & Modern Report Panel */}
        <div style={styles.filterRow} className="no-print">
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              flex: 1,
              alignItems: "center",
            }}
          >
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
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#38bdf8",
                  fontWeight: 600,
                }}
              >
                From:
              </span>
              <input
                className="dash-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...styles.input, width: "135px", padding: "6px 10px" }}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#38bdf8",
                  fontWeight: 600,
                }}
              >
                To:
              </span>
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
            <button
              style={{
                ...styles.downloadBtn,
                background: "linear-gradient(90deg, #10b981, #059669)",
              }}
              onClick={downloadEventsCSV}
            >
              📊 CSV
            </button>
            <button style={styles.downloadBtn} onClick={downloadEventsWord}>
              📄 Word Doc
            </button>
            <button
              style={{
                ...styles.downloadBtn,
                background: "linear-gradient(90deg, #be123c, #e11d48)",
              }}
              onClick={handlePrint}
            >
              PDF Report
            </button>
          </div>
        </div>

        {/* Events List - Split by Date & Filters */}
        {loading ? (
          <div role="status" style={styles.emptyState}>
            <p>Loading events and attendee records…</p>
          </div>
        ) : (
          (() => {
            const filtered = getFilteredEvents();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvents = filtered.filter((event) => {
              const evDate = new Date(event.date);
              evDate.setHours(0, 0, 0, 0);
              return evDate >= today;
            });

            const pastEvents = filtered.filter((event) => {
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
                      <span
                        style={{
                          background: "linear-gradient(90deg,#0369a1,#0ea5e9)",
                          color: "#fff",
                          borderRadius: "999px",
                          padding: "2px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          marginLeft: "10px",
                        }}
                      >
                        {upcomingEvents.length}
                      </span>
                    </h3>
                    {upcomingEvents.length === 0 ? (
                      <div style={styles.emptyState}>
                        <p>No upcoming events match the current criteria.</p>
                      </div>
                    ) : (
                      upcomingEvents.map((event) => (
                        <div
                          className="event-card-active-hover"
                          key={event._id}
                          style={styles.eventCardActive}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginBottom: "8px",
                            }}
                          >
                            <div>
                              <h4 style={styles.eventTitle}>
                                {event.title}{" "}
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#94a3b8",
                                    fontWeight: 400,
                                  }}
                                >
                                  ({event.eventCode || "N/A"})
                                </span>
                              </h4>
                              <p
                                style={{
                                  margin: "0 0 6px",
                                  color: "#94a3b8",
                                  fontSize: "0.74rem",
                                }}
                              >
                                Uploaded: {formatUploadDate(event.createdAt)}
                              </p>
                              <p style={styles.eventDate}>
                                <span>📅</span>{" "}
                                {new Date(event.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "4px 10px",
                                borderRadius: "999px",
                                background: "rgba(14,165,233,0.15)",
                                color: "#38bdf8",
                                border: "1px solid rgba(14,165,233,0.25)",
                                letterSpacing: "0.05em",
                              }}
                            >
                              ⚡ ACTIVE
                            </span>
                          </div>
                          {event.banner && (
                            <div
                              style={{
                                marginBottom: "12px",
                                borderRadius: "10px",
                                overflow: "hidden",
                                maxHeight: "200px",
                              }}
                            >
                              <img
                                src={event.banner}
                                alt={`${event.title} banner`}
                                style={{
                                  width: "100%",
                                  objectFit: "cover",
                                  maxHeight: "200px",
                                  borderRadius: "10px",
                                }}
                              />
                            </div>
                          )}
                          <p style={styles.eventDesc}>{event.description}</p>
                          {(event.location || event.time) && (
                            <p
                              style={{
                                margin: "8px 0 0",
                                color: "#94a3b8",
                                fontSize: "0.78rem",
                              }}
                            >
                              {event.location
                                ? `Location: ${event.location}`
                                : ""}
                              {event.location && event.time ? " · " : ""}
                              {event.time ? `Time: ${event.time}` : ""}
                            </p>
                          )}

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginTop: "12px",
                            }}
                            className="no-print"
                          >
                            {(event.attendeesCount > 0 ||
                              (event.attendees &&
                                event.attendees.length > 0)) && (
                              <button
                                onClick={() =>
                                  setShowAttendeesFor(
                                    showAttendeesFor === event._id
                                      ? null
                                      : event._id,
                                  )
                                }
                                style={{
                                  background: "rgba(14, 165, 233, 0.1)",
                                  color: "#38bdf8",
                                  border: "1px solid rgba(14, 165, 233, 0.2)",
                                  borderRadius: "8px",
                                  padding: "7px 16px",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                }}
                              >
                                👥 Attendees (
                                {event.attendees
                                  ? event.attendees.length
                                  : event.attendeesCount}
                                )
                              </button>
                            )}
                            <button
                              className="share-btn"
                              onClick={() => shareToWhatsApp(event)}
                              style={styles.shareBtn}
                            >
                              💬 Re-Share to WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => editEvent(event)}
                              style={styles.backBtn}
                            >
                              Edit Event
                            </button>
                            <button
                              className="delete-btn"
                              disabled={deletingId === event._id}
                              onClick={() => deleteEvent(event._id)}
                              style={{
                                ...styles.deleteBtn,
                                opacity: deletingId === event._id ? 0.6 : 1,
                              }}
                            >
                              {deletingId === event._id
                                ? "Deleting…"
                                : "🗑️ Delete Event"}
                            </button>
                          </div>

                          {showAttendeesFor === event._id &&
                            event.attendees &&
                            event.attendees.length > 0 && (
                              <div
                                style={{
                                  marginTop: "16px",
                                  padding: "16px",
                                  background: "rgba(15, 23, 42, 0.6)",
                                  borderRadius: "10px",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "12px",
                                  }}
                                >
                                  <h5
                                    style={{
                                      margin: 0,
                                      color: "#38bdf8",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    Attendee Record
                                  </h5>
                                  <button
                                    onClick={() =>
                                      downloadAttendeesReport(event)
                                    }
                                    style={{
                                      background:
                                        "linear-gradient(90deg, #10b981, #059669)",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "4px 10px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    ⬇ Download Report
                                  </button>
                                </div>
                                <table
                                  style={{
                                    width: "100%",
                                    fontSize: "0.8rem",
                                    color: "#cbd5e1",
                                    borderCollapse: "collapse",
                                    textAlign: "left",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        Name
                                      </th>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        Member ID
                                      </th>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        National ID (masked)
                                      </th>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        Phone
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {event.attendees.map((a, i) => (
                                      <tr key={i}>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {a.name}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {a.memberId || "N/A"}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {maskSensitiveId(
                                            a.idNo || a.idNumber,
                                          )}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {a.phone}
                                        </td>
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
                    <h3
                      style={{
                        ...styles.sectionHeading,
                        marginTop: "20px",
                        borderLeftColor: "#475569",
                        color: "#94a3b8",
                      }}
                    >
                      Past Events (Archived)
                      <span
                        style={{
                          background: "linear-gradient(90deg,#475569,#64748b)",
                          color: "#fff",
                          borderRadius: "999px",
                          padding: "2px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          marginLeft: "10px",
                        }}
                      >
                        {pastEvents.length}
                      </span>
                    </h3>
                    {pastEvents.length === 0 ? (
                      <div style={styles.emptyState}>
                        <p>No past events match the current criteria.</p>
                      </div>
                    ) : (
                      pastEvents.map((event) => (
                        <div
                          className="event-card-past-hover"
                          key={event._id}
                          style={styles.eventCardPast}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginBottom: "8px",
                            }}
                          >
                            <div>
                              <h4 style={styles.eventTitlePast}>
                                {event.title}{" "}
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#64748b",
                                    fontWeight: 400,
                                    textDecoration: "none",
                                  }}
                                >
                                  ({event.eventCode || "N/A"})
                                </span>
                              </h4>
                              <p
                                style={{
                                  margin: "0 0 6px",
                                  color: "#64748b",
                                  fontSize: "0.74rem",
                                }}
                              >
                                Uploaded: {formatUploadDate(event.createdAt)}
                              </p>
                              <p style={styles.eventDatePast}>
                                <span>📁</span>{" "}
                                {new Date(event.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}{" "}
                                (Passed)
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "4px 10px",
                                borderRadius: "999px",
                                background: "rgba(100,116,139,0.1)",
                                color: "#64748b",
                                border: "1px solid rgba(100,116,139,0.15)",
                                letterSpacing: "0.05em",
                              }}
                            >
                              PASSED
                            </span>
                          </div>
                          {event.banner && (
                            <div
                              style={{
                                marginBottom: "12px",
                                borderRadius: "10px",
                                overflow: "hidden",
                                maxHeight: "150px",
                                opacity: 0.8,
                              }}
                            >
                              <img
                                src={event.banner}
                                alt={`${event.title} banner`}
                                style={{
                                  width: "100%",
                                  objectFit: "cover",
                                  maxHeight: "150px",
                                  borderRadius: "10px",
                                }}
                              />
                            </div>
                          )}
                          <p style={styles.eventDescPast}>
                            {event.description}
                          </p>
                          {(event.location || event.time) && (
                            <p
                              style={{
                                margin: "8px 0 0",
                                color: "#64748b",
                                fontSize: "0.78rem",
                              }}
                            >
                              {event.location
                                ? `Location: ${event.location}`
                                : ""}
                              {event.location && event.time ? " · " : ""}
                              {event.time ? `Time: ${event.time}` : ""}
                            </p>
                          )}

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginTop: "12px",
                            }}
                            className="no-print"
                          >
                            {(event.attendeesCount > 0 ||
                              (event.attendees &&
                                event.attendees.length > 0)) && (
                              <button
                                onClick={() =>
                                  setShowAttendeesFor(
                                    showAttendeesFor === event._id
                                      ? null
                                      : event._id,
                                  )
                                }
                                style={{
                                  background: "rgba(100, 116, 139, 0.1)",
                                  color: "#94a3b8",
                                  border: "1px solid rgba(100, 116, 139, 0.2)",
                                  borderRadius: "8px",
                                  padding: "7px 16px",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                }}
                              >
                                👥 View Attendees (
                                {event.attendees
                                  ? event.attendees.length
                                  : event.attendeesCount}
                                )
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => editEvent(event)}
                              style={styles.backBtn}
                            >
                              Edit Event
                            </button>
                            <button
                              className="delete-btn"
                              disabled={deletingId === event._id}
                              onClick={() => deleteEvent(event._id)}
                              style={{
                                ...styles.deleteBtn,
                                opacity: deletingId === event._id ? 0.6 : 1,
                              }}
                            >
                              {deletingId === event._id
                                ? "Deleting…"
                                : "🗑️ Delete Event"}
                            </button>
                          </div>

                          {showAttendeesFor === event._id &&
                            event.attendees &&
                            event.attendees.length > 0 && (
                              <div
                                style={{
                                  marginTop: "16px",
                                  padding: "16px",
                                  background: "rgba(15, 23, 42, 0.6)",
                                  borderRadius: "10px",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "12px",
                                  }}
                                >
                                  <h5
                                    style={{
                                      margin: 0,
                                      color: "#94a3b8",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    Attendee Record
                                  </h5>
                                  <button
                                    onClick={() =>
                                      downloadAttendeesReport(event)
                                    }
                                    style={{
                                      background:
                                        "linear-gradient(90deg, #10b981, #059669)",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "4px 10px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    ⬇ Download Report
                                  </button>
                                </div>
                                <table
                                  style={{
                                    width: "100%",
                                    fontSize: "0.8rem",
                                    color: "#94a3b8",
                                    borderCollapse: "collapse",
                                    textAlign: "left",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        Name
                                      </th>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        Member ID
                                      </th>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        National ID (masked)
                                      </th>
                                      <th
                                        style={{
                                          paddingBottom: "8px",
                                          borderBottom:
                                            "1px solid rgba(255,255,255,0.1)",
                                        }}
                                      >
                                        Phone
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {event.attendees.map((a, i) => (
                                      <tr key={i}>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {a.name}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {a.memberId || "N/A"}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {maskSensitiveId(
                                            a.idNo || a.idNumber,
                                          )}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 0",
                                            borderBottom:
                                              "1px solid rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          {a.phone}
                                        </td>
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
          })()
        )}
      </main>
    </div>
  );
}

export default AdminEvents;
