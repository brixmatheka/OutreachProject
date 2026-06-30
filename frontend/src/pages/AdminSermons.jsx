import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../apiConfig";

const emptyForm = {
  title: "",
  preacher: "",
  scripture: "",
  category: "Sunday Service",
  sermonDate: "",
  summary: "",
  tags: "",
  isPublished: true,
  isFeatured: false,
  cover: null,
  pdf: null,
  word: null,
};

const styles = {
  page: {
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 52%, #0b1120 100%)",
    minHeight: "100vh",
    color: "#f8fafc",
  },
  header: {
    minHeight: "68px",
    padding: "12px clamp(14px, 4vw, 34px)",
    background: "rgba(15, 23, 42, 0.9)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  main: { padding: "28px clamp(14px, 4vw, 42px)", maxWidth: "1280px", margin: "0 auto" },
  card: {
    background: "rgba(30, 41, 59, 0.62)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    boxShadow: "0 14px 38px rgba(0,0,0,0.24)",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(15, 23, 42, 0.82)",
    color: "#f8fafc",
    outline: "none",
    font: "inherit",
  },
  label: { fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.84rem",
  },
};

const fileUrl = (url) => url ? `${API_URL}${url}` : "";
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "No date";

function AdminSermons() {
  const [form, setForm] = useState(emptyForm);
  const [sermons, setSermons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sermons;
    return sermons.filter((sermon) =>
      [sermon.title, sermon.preacher, sermon.scripture, sermon.category, sermon.summary]
        .some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [query, sermons]);

  const fetchSermons = async () => {
    const res = await axios.get("/api/admin/sermons", { params: { limit: 50 } });
    setSermons(res.data.sermons || []);
  };

  const fetchAnalytics = async () => {
    const res = await axios.get("/api/admin/sermons/analytics");
    setAnalytics(res.data);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSermons(), fetchAnalytics()]);
    } catch {
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (sermon) => {
    setEditing(sermon);
    setForm({
      title: sermon.title || "",
      preacher: sermon.preacher || "",
      scripture: sermon.scripture || "",
      category: sermon.category || "Sunday Service",
      sermonDate: dateInput(sermon.sermonDate),
      summary: sermon.summary || "",
      tags: (sermon.tags || []).join(", "),
      isPublished: !!sermon.isPublished,
      isFeatured: !!sermon.isFeatured,
      cover: null,
      pdf: null,
      word: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.preacher || !form.scripture || !form.sermonDate) {
      setToast("Fill in title, preacher, scripture, and sermon date.");
      return;
    }
    if (!editing && (!form.pdf || !form.word)) {
      setToast("PDF and Word document are required for a new sermon.");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (["cover", "pdf", "word"].includes(key)) {
        if (value) fd.append(key, value);
      } else {
        fd.append(key, value);
      }
    });

    setSaving(true);
    setToast("");
    try {
      if (editing) {
        await axios.put(`/api/admin/sermons/${editing._id}`, fd);
        setToast("Sermon updated.");
      } else {
        await axios.post("/api/admin/sermons", fd);
        setToast("Sermon uploaded.");
      }
      resetForm();
      await refresh();
    } catch (err) {
      setToast(err.response?.data?.message || "Could not save sermon.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (sermon) => {
    await axios.patch(`/api/admin/sermons/${sermon._id}/publish`, { isPublished: !sermon.isPublished });
    await refresh();
  };

  const removeSermon = async (sermon) => {
    if (!window.confirm(`Delete "${sermon.title}"?`)) return;
    await axios.delete(`/api/admin/sermons/${sermon._id}`);
    await refresh();
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Sermon Management</h1>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.78rem" }}>Upload, publish, and measure sermon engagement</p>
        </div>
        <button style={{ ...styles.button, background: "rgba(255,255,255,0.08)", color: "#fff" }} onClick={() => navigate("/admin-dashboard")}>
          Back to Dashboard
        </button>
      </header>

      <main style={styles.main}>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "22px" }}>
          {[
            ["Total Sermons", analytics?.totalSermons || 0],
            ["Published", analytics?.publishedSermons || 0],
            ["Total Views", analytics?.totalViews || 0],
            ["Downloads", analytics?.totalDownloads || 0],
          ].map(([label, value]) => (
            <div key={label} style={{ ...styles.card, padding: "18px" }}>
              <strong style={{ display: "block", color: "#38bdf8", fontSize: "1.7rem" }}>{value}</strong>
              <span style={{ color: "#94a3b8", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
            </div>
          ))}
        </section>

        {analytics?.mostRead && (
          <div style={{ ...styles.card, padding: "16px 18px", marginBottom: "22px", borderLeft: "4px solid #38bdf8" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Most-read sermon</span>
            <strong style={{ display: "block", marginTop: "4px" }}>{analytics.mostRead.title}</strong>
          </div>
        )}

        <form onSubmit={submit} style={{ ...styles.card, padding: "22px", marginBottom: "26px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1rem", color: "#38bdf8" }}>{editing ? "Edit Sermon" : "Upload Sermon"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            {[
              ["title", "Title"],
              ["preacher", "Preacher"],
              ["scripture", "Scripture"],
              ["category", "Category"],
            ].map(([name, label]) => (
              <label key={name} style={{ display: "grid", gap: "6px" }}>
                <span style={styles.label}>{label}</span>
                <input style={styles.input} value={form[name]} onChange={(e) => updateField(name, e.target.value)} />
              </label>
            ))}
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={styles.label}>Sermon Date</span>
              <input style={styles.input} type="date" value={form.sermonDate} onChange={(e) => updateField("sermonDate", e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={styles.label}>Tags</span>
              <input style={styles.input} placeholder="faith, prayer, hope" value={form.tags} onChange={(e) => updateField("tags", e.target.value)} />
            </label>
          </div>

          <label style={{ display: "grid", gap: "6px", marginTop: "14px" }}>
            <span style={styles.label}>Summary</span>
            <textarea style={{ ...styles.input, minHeight: "96px", resize: "vertical" }} value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "14px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={styles.label}>Cover Image</span>
              <input style={styles.input} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => updateField("cover", e.target.files[0] || null)} />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={styles.label}>PDF</span>
              <input style={styles.input} type="file" accept="application/pdf" onChange={(e) => updateField("pdf", e.target.files[0] || null)} />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={styles.label}>Word Document</span>
              <input style={styles.input} type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => updateField("word", e.target.files[0] || null)} />
            </label>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginTop: "16px" }}>
            <label><input type="checkbox" checked={form.isPublished} onChange={(e) => updateField("isPublished", e.target.checked)} /> Published</label>
            <label><input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField("isFeatured", e.target.checked)} /> Featured</label>
            <button style={{ ...styles.button, background: "#38bdf8", color: "#082f49" }} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Upload Sermon"}
            </button>
            {editing && <button type="button" style={{ ...styles.button, background: "rgba(255,255,255,0.08)", color: "#fff" }} onClick={resetForm}>Cancel</button>}
            {toast && <span style={{ color: "#bae6fd", fontSize: "0.86rem" }}>{toast}</span>}
          </div>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Sermon Library Admin</h2>
          <input style={{ ...styles.input, maxWidth: "360px" }} placeholder="Search sermons..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ ...styles.card, padding: "24px" }}>Loading sermons...</div>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {filtered.map((sermon) => (
              <article key={sermon._id} style={{ ...styles.card, overflow: "hidden" }}>
                <div style={{ height: "142px", background: "#082f49" }}>
                  {sermon.coverImage ? (
                    <img src={fileUrl(sermon.coverImage)} alt={sermon.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#bae6fd", fontWeight: 800 }}>Sermon</div>
                  )}
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ color: sermon.isPublished ? "#86efac" : "#fbbf24", fontSize: "0.76rem", fontWeight: 800 }}>
                      {sermon.isPublished ? "Published" : "Draft"}
                    </span>
                    {sermon.isFeatured && <span style={{ color: "#38bdf8", fontSize: "0.76rem", fontWeight: 800 }}>Featured</span>}
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{sermon.title}</h3>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.84rem" }}>{sermon.preacher} | {formatDate(sermon.sermonDate)}</p>
                  <p style={{ color: "#cbd5e1", fontSize: "0.84rem", minHeight: "42px" }}>{sermon.scripture}</p>
                  <div style={{ display: "flex", gap: "12px", color: "#94a3b8", fontSize: "0.78rem", marginBottom: "12px" }}>
                    <span>{sermon.views || 0} views</span>
                    <span>{sermon.downloads?.total || 0} downloads</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <button style={{ ...styles.button, background: "#38bdf8", color: "#082f49" }} onClick={() => startEdit(sermon)}>Edit</button>
                    <button style={{ ...styles.button, background: "rgba(255,255,255,0.08)", color: "#fff" }} onClick={() => togglePublish(sermon)}>
                      {sermon.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <a style={{ ...styles.button, background: "rgba(14,165,233,0.12)", color: "#7dd3fc", textDecoration: "none" }} href={fileUrl(sermon.pdfUrl)} target="_blank" rel="noreferrer">PDF</a>
                    <button style={{ ...styles.button, background: "rgba(239,68,68,0.16)", color: "#fca5a5" }} onClick={() => removeSermon(sermon)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminSermons;
