import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../apiConfig";
import { downloadCsvReport, downloadPdfReport, downloadWordReport, formatReportDate } from "../adminReports";

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
    boxSizing: "border-box",
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
const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};
const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  : "No date";
const formatUploadDate = (value) => value
  ? new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
  : "Date unavailable";
const formatNumber = (value) => new Intl.NumberFormat("en-KE").format(Number(value) || 0);
const getDownloadCount = (sermon) => Number(sermon.downloads?.total ?? sermon.downloads ?? 0) || 0;
const isAuthError = (error) => [401, 403].includes(error.response?.status);
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const requestSermonInventory = async () => {
  const firstResponse = await axios.get("/api/admin/sermons", {
    params: { page: 1, limit: 50 },
  });
  const firstPayload = firstResponse.data;
  if (Array.isArray(firstPayload)) return firstPayload;

  const firstPage = firstPayload?.sermons || [];
  const pageCount = Math.max(Number(firstPayload?.pages) || 1, 1);
  if (pageCount === 1) return firstPage;

  const remainingResponses = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      axios.get("/api/admin/sermons", {
        params: { page: index + 2, limit: 50 },
      })
    )
  );

  return remainingResponses.reduce(
    (allSermons, response) => allSermons.concat(response.data?.sermons || []),
    firstPage
  );
};

function AdminSermons() {
  const [form, setForm] = useState(emptyForm);
  const [sermons, setSermons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [preacherFilter, setPreacherFilter] = useState("All");
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [busyActions, setBusyActions] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);
  const navigate = useNavigate();

  const categories = useMemo(
    () => [...new Set(sermons.map((sermon) => sermon.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [sermons]
  );

  const preachers = useMemo(
    () => [...new Set(sermons.map((sermon) => sermon.preacher).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [sermons]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons.filter((sermon) => {
      const matchesQuery = !q || [
        sermon.title,
        sermon.preacher,
        sermon.scripture,
        sermon.category,
        sermon.summary,
        ...(sermon.tags || []),
      ].some((value) => String(value || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "All"
        || (statusFilter === "Published" && sermon.isPublished)
        || (statusFilter === "Draft" && !sermon.isPublished)
        || (statusFilter === "Featured" && sermon.isFeatured);
      const matchesCategory = categoryFilter === "All" || sermon.category === categoryFilter;
      const matchesPreacher = preacherFilter === "All" || sermon.preacher === preacherFilter;
      return matchesQuery && matchesStatus && matchesCategory && matchesPreacher;
    });
  }, [categoryFilter, preacherFilter, query, sermons, statusFilter]);

  const fetchSermons = async ({ showLoading = true } = {}) => {
    if (showLoading) setLibraryLoading(true);
    setLibraryError("");
    try {
      const inventory = await requestSermonInventory();
      setSermons(inventory);
      return true;
    } catch (error) {
      if (isAuthError(error)) {
        navigate("/admin-login");
      } else {
        setLibraryError(getErrorMessage(error, "Could not load the sermon library. Please retry."));
      }
      return false;
    } finally {
      if (showLoading) setLibraryLoading(false);
    }
  };

  const fetchAnalytics = async ({ showLoading = true } = {}) => {
    if (showLoading) setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const response = await axios.get("/api/admin/sermons/analytics");
      setAnalytics(response.data);
      return true;
    } catch (error) {
      if (isAuthError(error)) {
        navigate("/admin-login");
      } else {
        setAnalyticsError(getErrorMessage(error, "Engagement analytics are temporarily unavailable."));
      }
      return false;
    } finally {
      if (showLoading) setAnalyticsLoading(false);
    }
  };

  const refresh = async ({ showLoading = false } = {}) => {
    await Promise.allSettled([
      fetchSermons({ showLoading }),
      fetchAnalytics({ showLoading }),
    ]);
  };

  useEffect(() => {
    let active = true;

    requestSermonInventory()
      .then((inventory) => {
        if (active) setSermons(inventory);
      })
      .catch((error) => {
        if (!active) return;
        if (isAuthError(error)) navigate("/admin-login");
        else setLibraryError(getErrorMessage(error, "Could not load the sermon library. Please retry."));
      })
      .finally(() => {
        if (active) setLibraryLoading(false);
      });

    axios.get("/api/admin/sermons/analytics")
      .then((response) => {
        if (active) setAnalytics(response.data);
      })
      .catch((error) => {
        if (!active) return;
        if (isAuthError(error)) navigate("/admin-login");
        else setAnalyticsError(getErrorMessage(error, "Engagement analytics are temporarily unavailable."));
      })
      .finally(() => {
        if (active) setAnalyticsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

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

  const replaceSermon = (updatedSermon) => {
    setSermons((current) => current.map((sermon) =>
      sermon._id === updatedSermon._id ? updatedSermon : sermon
    ));
  };

  const setActionBusy = (sermonId, action) => {
    setBusyActions((current) => ({ ...current, [sermonId]: action }));
  };

  const clearActionBusy = (sermonId) => {
    setBusyActions((current) => {
      const next = { ...current };
      delete next[sermonId];
      return next;
    });
  };

  const getReportFilters = () => ({
    Search: query.trim() || "All sermons",
    Status: statusFilter === "All" ? "All statuses" : statusFilter,
    Category: categoryFilter === "All" ? "All categories" : categoryFilter,
    Preacher: preacherFilter === "All" ? "All preachers" : preacherFilter,
  });

  const getReportSummary = () => {
    const published = filtered.filter((sermon) => sermon.isPublished).length;
    const views = filtered.reduce((total, sermon) => total + (Number(sermon.views) || 0), 0);
    const downloads = filtered.reduce((total, sermon) => total + getDownloadCount(sermon), 0);
    return {
      "Sermons listed": filtered.length,
      Published: published,
      Drafts: filtered.length - published,
      Featured: filtered.filter((sermon) => sermon.isFeatured).length,
      "Total views": formatNumber(views),
      "Total downloads": formatNumber(downloads),
    };
  };

  const ensureReportRows = () => {
    if (filtered.length > 0) return true;
    setActionFeedback({
      type: "error",
      message: "No sermons match the selected filters. Adjust the filters before exporting.",
    });
    return false;
  };

  const downloadSermonCsv = () => {
    if (!ensureReportRows()) return;
    downloadCsvReport({
      title: "Sermon Inventory and Engagement Register",
      filters: getReportFilters(),
      headers: [
        "Title",
        "Preacher",
        "Scripture",
        "Category",
        "Status",
        "Featured",
        "Sermon Date",
        "Uploaded",
        "Published",
        "Views",
        "Downloads",
        "Summary",
      ],
      rows: filtered.map((sermon) => [
        sermon.title || "",
        sermon.preacher || "",
        sermon.scripture || "",
        sermon.category || "",
        sermon.isPublished ? "Published" : "Draft",
        sermon.isFeatured ? "Yes" : "No",
        formatReportDate(sermon.sermonDate),
        formatReportDate(sermon.createdAt, true),
        formatReportDate(sermon.publishedAt, true),
        Number(sermon.views) || 0,
        getDownloadCount(sermon),
        sermon.summary || "",
      ]),
      summary: getReportSummary(),
    });
  };

  const getSermonDocument = () => ({
      title: "Sermon Inventory and Engagement Report",
      subtitle: "Publication status, content inventory, upload history, and audience engagement",
      filters: getReportFilters(),
      summary: getReportSummary(),
      columns: [
        { label: "Title", value: (sermon) => sermon.title || "—" },
        { label: "Preacher", value: (sermon) => sermon.preacher || "—" },
        { label: "Scripture", value: (sermon) => sermon.scripture || "—" },
        { label: "Category", value: (sermon) => sermon.category || "—" },
        { label: "Status", value: (sermon) => sermon.isPublished ? "Published" : "Draft" },
        { label: "Featured", value: (sermon) => sermon.isFeatured ? "Yes" : "No" },
        { label: "Sermon date", value: (sermon) => formatReportDate(sermon.sermonDate) },
        { label: "Uploaded", value: (sermon) => formatReportDate(sermon.createdAt, true) },
        { label: "Published", value: (sermon) => formatReportDate(sermon.publishedAt, true) },
        { label: "Views", value: (sermon) => formatNumber(sermon.views) },
        { label: "Downloads", value: (sermon) => formatNumber(getDownloadCount(sermon)) },
        { label: "Summary", value: (sermon) => sermon.summary || "—" },
      ],
      rows: filtered,
    });

  const downloadSermonWord = () => {
    if (!ensureReportRows()) return;
    downloadWordReport(getSermonDocument());
  };

  const downloadSermonPdf = () => {
    if (!ensureReportRows()) return;
    downloadPdfReport(getSermonDocument());
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
    if (busyActions[sermon._id]) return;
    const nextStatus = !sermon.isPublished;
    setActionBusy(sermon._id, "publish");
    setActionFeedback(null);
    try {
      const response = await axios.patch(`/api/admin/sermons/${sermon._id}/publish`, {
        isPublished: nextStatus,
      });
      replaceSermon(response.data?.sermon || { ...sermon, isPublished: nextStatus });
      setActionFeedback({
        id: sermon._id,
        type: "success",
        message: nextStatus ? "Sermon published successfully." : "Sermon moved back to drafts.",
      });
      await fetchAnalytics({ showLoading: false });
    } catch (error) {
      if (isAuthError(error)) navigate("/admin-login");
      else {
        setActionFeedback({
          id: sermon._id,
          type: "error",
          message: getErrorMessage(error, `Could not ${nextStatus ? "publish" : "unpublish"} this sermon.`),
        });
      }
    } finally {
      clearActionBusy(sermon._id);
    }
  };

  const toggleFeatured = async (sermon) => {
    if (busyActions[sermon._id]) return;
    const nextFeatured = !sermon.isFeatured;
    const updateData = new FormData();
    [
      ["title", sermon.title || ""],
      ["preacher", sermon.preacher || ""],
      ["scripture", sermon.scripture || ""],
      ["category", sermon.category || "General"],
      ["sermonDate", dateInput(sermon.sermonDate)],
      ["summary", sermon.summary || ""],
      ["tags", (sermon.tags || []).join(", ")],
      ["isPublished", String(Boolean(sermon.isPublished))],
      ["isFeatured", String(nextFeatured)],
    ].forEach(([key, value]) => updateData.append(key, value));

    setActionBusy(sermon._id, "feature");
    setActionFeedback(null);
    try {
      const response = await axios.put(`/api/admin/sermons/${sermon._id}`, updateData);
      replaceSermon(response.data?.sermon || { ...sermon, isFeatured: nextFeatured });
      setActionFeedback({
        id: sermon._id,
        type: "success",
        message: nextFeatured ? "Sermon added to featured content." : "Sermon removed from featured content.",
      });
    } catch (error) {
      if (isAuthError(error)) navigate("/admin-login");
      else {
        setActionFeedback({
          id: sermon._id,
          type: "error",
          message: getErrorMessage(error, "Could not update the featured status."),
        });
      }
    } finally {
      clearActionBusy(sermon._id);
    }
  };

  const removeSermon = async (sermon) => {
    if (!window.confirm(`Delete "${sermon.title}"?`)) return;
    if (busyActions[sermon._id]) return;
    setActionBusy(sermon._id, "delete");
    setActionFeedback(null);
    try {
      await axios.delete(`/api/admin/sermons/${sermon._id}`);
      setSermons((current) => current.filter((item) => item._id !== sermon._id));
      if (editing?._id === sermon._id) resetForm();
      setActionFeedback({
        type: "success",
        message: `"${sermon.title}" was deleted from the sermon library.`,
      });
      await fetchAnalytics({ showLoading: false });
    } catch (error) {
      if (isAuthError(error)) navigate("/admin-login");
      else {
        setActionFeedback({
          id: sermon._id,
          type: "error",
          message: getErrorMessage(error, "Could not delete this sermon."),
        });
      }
    } finally {
      clearActionBusy(sermon._id);
    }
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
            ["Total Sermons", analytics?.totalSermons],
            ["Published", analytics?.publishedSermons],
            ["Total Views", analytics?.totalViews],
            ["Downloads", analytics?.totalDownloads],
          ].map(([label, value]) => (
            <div key={label} style={{ ...styles.card, padding: "18px" }}>
              <strong style={{ display: "block", color: "#38bdf8", fontSize: "1.7rem" }}>
                {analyticsLoading && !analytics ? "…" : value == null ? "—" : formatNumber(value)}
              </strong>
              <span style={{ color: "#94a3b8", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
            </div>
          ))}
        </section>

        {analyticsError && (
          <div
            role="alert"
            style={{
              ...styles.card,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              padding: "14px 16px",
              marginBottom: "18px",
              borderColor: "rgba(251,191,36,0.35)",
              color: "#fde68a",
            }}
          >
            <span>{analyticsError} Sermon management remains available.</span>
            <button
              type="button"
              style={{ ...styles.button, background: "rgba(251,191,36,0.16)", color: "#fde68a" }}
              onClick={() => fetchAnalytics()}
              disabled={analyticsLoading}
            >
              {analyticsLoading ? "Retrying…" : "Retry analytics"}
            </button>
          </div>
        )}

        {analytics?.mostRead && (
          <div style={{ ...styles.card, padding: "16px 18px", marginBottom: "22px", borderLeft: "4px solid #38bdf8" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Most-read sermon</span>
            <strong style={{ display: "block", marginTop: "4px" }}>{analytics.mostRead.title}</strong>
            <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
              {formatNumber(analytics.mostRead.views)} views · {formatNumber(getDownloadCount(analytics.mostRead))} downloads
            </span>
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

        <section style={{ ...styles.card, padding: "18px", marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem" }}>Sermon Library Admin</h2>
              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.78rem" }}>
                Filter the complete inventory and export an organization-ready engagement report.
              </p>
            </div>
            <span style={{ color: "#7dd3fc", fontSize: "0.8rem", fontWeight: 700 }}>
              {libraryLoading && sermons.length > 0 ? "Refreshing · " : ""}
              Showing {filtered.length} of {sermons.length}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))", gap: "10px" }}>
            <input
              style={styles.input}
              placeholder="Search title, preacher, scripture…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search sermons"
            />
            <select
              style={styles.input}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by publication status"
            >
              <option value="All">All statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Drafts</option>
              <option value="Featured">Featured</option>
            </select>
            <select
              style={styles.input}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select
              style={styles.input}
              value={preacherFilter}
              onChange={(e) => setPreacherFilter(e.target.value)}
              aria-label="Filter by preacher"
            >
              <option value="All">All preachers</option>
              {preachers.map((preacher) => <option key={preacher} value={preacher}>{preacher}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", marginTop: "12px" }}>
            <button
              type="button"
              style={{
                ...styles.button,
                background: "linear-gradient(90deg, #be123c, #e11d48)",
                color: "#fff",
                opacity: filtered.length === 0 ? 0.55 : 1,
              }}
              onClick={downloadSermonPdf}
              disabled={filtered.length === 0}
            >
              Export PDF
            </button>
            <button
              type="button"
              style={{
                ...styles.button,
                background: "linear-gradient(90deg, #059669, #10b981)",
                color: "#fff",
                opacity: filtered.length === 0 ? 0.55 : 1,
              }}
              onClick={downloadSermonCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </button>
            <button
              type="button"
              style={{
                ...styles.button,
                background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
                color: "#fff",
                opacity: filtered.length === 0 ? 0.55 : 1,
              }}
              onClick={downloadSermonWord}
              disabled={filtered.length === 0}
            >
              Export Word Report
            </button>
            <button
              type="button"
              style={{ ...styles.button, background: "rgba(255,255,255,0.08)", color: "#cbd5e1" }}
              onClick={() => {
                setQuery("");
                setStatusFilter("All");
                setCategoryFilter("All");
                setPreacherFilter("All");
              }}
            >
              Reset filters
            </button>
          </div>
        </section>

        {actionFeedback && (
          <div
            role={actionFeedback.type === "error" ? "alert" : "status"}
            style={{
              ...styles.card,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "13px 16px",
              marginBottom: "16px",
              borderColor: actionFeedback.type === "error"
                ? "rgba(248,113,113,0.35)"
                : "rgba(74,222,128,0.35)",
              color: actionFeedback.type === "error" ? "#fecaca" : "#bbf7d0",
            }}
          >
            <span>{actionFeedback.message}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setActionFeedback(null)}
              style={{ ...styles.button, padding: "5px 9px", background: "rgba(255,255,255,0.08)", color: "inherit" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {libraryError && (
          <div
            role="alert"
            style={{
              ...styles.card,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              padding: "16px",
              marginBottom: "16px",
              borderColor: "rgba(248,113,113,0.35)",
              color: "#fecaca",
            }}
          >
            <span>{libraryError}{sermons.length > 0 ? " The last loaded inventory is shown below." : ""}</span>
            <button
              type="button"
              style={{ ...styles.button, background: "rgba(248,113,113,0.16)", color: "#fecaca" }}
              onClick={() => fetchSermons()}
              disabled={libraryLoading}
            >
              {libraryLoading ? "Retrying…" : "Retry library"}
            </button>
          </div>
        )}

        {libraryLoading && sermons.length === 0 ? (
          <div style={{ ...styles.card, padding: "28px", color: "#bae6fd" }} role="status">
            Loading the complete sermon inventory…
          </div>
        ) : libraryError && sermons.length === 0 ? null : sermons.length === 0 ? (
          <div style={{ ...styles.card, padding: "32px", textAlign: "center", color: "#94a3b8" }}>
            No sermons have been uploaded yet. Use the upload form above to create the library.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...styles.card, padding: "32px", textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", color: "#94a3b8" }}>No sermons match the current filters.</p>
            <button
              type="button"
              style={{ ...styles.button, background: "rgba(56,189,248,0.14)", color: "#7dd3fc" }}
              onClick={() => {
                setQuery("");
                setStatusFilter("All");
                setCategoryFilter("All");
                setPreacherFilter("All");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "16px" }}>
            {filtered.map((sermon) => {
              const activeAction = busyActions[sermon._id];
              const rowBusy = Boolean(activeAction);
              return (
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
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.84rem" }}>
                      {sermon.preacher} · {formatDate(sermon.sermonDate)}
                    </p>
                    <p style={{ margin: "7px 0 0", color: "#7dd3fc", fontSize: "0.76rem", fontWeight: 700 }}>
                      Uploaded: {formatUploadDate(sermon.createdAt)}
                    </p>
                    {sermon.publishedAt && (
                      <p style={{ margin: "3px 0 0", color: "#86efac", fontSize: "0.74rem" }}>
                        Published: {formatUploadDate(sermon.publishedAt)}
                      </p>
                    )}
                    <p style={{ margin: "9px 0 0", color: "#94a3b8", fontSize: "0.76rem" }}>
                      {sermon.category || "General"}
                    </p>
                    <p style={{ color: "#cbd5e1", fontSize: "0.84rem", marginBottom: "6px" }}>{sermon.scripture}</p>
                    {sermon.summary && (
                      <p style={{ color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.5, margin: "0 0 12px" }}>
                        {sermon.summary}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "12px", color: "#94a3b8", fontSize: "0.78rem", marginBottom: "12px" }}>
                      <span>{formatNumber(sermon.views)} views</span>
                      <span>{formatNumber(getDownloadCount(sermon))} downloads</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <button
                        type="button"
                        style={{ ...styles.button, background: "#38bdf8", color: "#082f49", opacity: rowBusy ? 0.55 : 1 }}
                        onClick={() => startEdit(sermon)}
                        disabled={rowBusy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.button, background: "rgba(255,255,255,0.08)", color: "#fff", opacity: rowBusy ? 0.55 : 1 }}
                        onClick={() => togglePublish(sermon)}
                        disabled={rowBusy}
                      >
                        {activeAction === "publish" ? "Updating…" : sermon.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.button, background: "rgba(251,191,36,0.13)", color: "#fde68a", opacity: rowBusy ? 0.55 : 1 }}
                        onClick={() => toggleFeatured(sermon)}
                        disabled={rowBusy}
                      >
                        {activeAction === "feature" ? "Updating…" : sermon.isFeatured ? "Unfeature" : "Feature"}
                      </button>
                      {sermon.pdfUrl && (
                        <a
                          style={{ ...styles.button, background: "rgba(14,165,233,0.12)", color: "#7dd3fc", textDecoration: "none" }}
                          href={fileUrl(sermon.pdfUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          PDF
                        </a>
                      )}
                      {sermon.wordUrl && (
                        <a
                          style={{ ...styles.button, background: "rgba(14,165,233,0.12)", color: "#7dd3fc", textDecoration: "none" }}
                          href={fileUrl(sermon.wordUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Word
                        </a>
                      )}
                      <button
                        type="button"
                        style={{ ...styles.button, background: "rgba(239,68,68,0.16)", color: "#fca5a5", opacity: rowBusy ? 0.55 : 1 }}
                        onClick={() => removeSermon(sermon)}
                        disabled={rowBusy}
                      >
                        {activeAction === "delete" ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminSermons;
