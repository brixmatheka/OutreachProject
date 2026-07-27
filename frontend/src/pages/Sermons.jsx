import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL, SITE_URL } from "../apiConfig";
import CloseButton from "../components/CloseButton";
import { getWithRetry } from "../requestWithRetry";

const bookmarkKey = "bookmarkedSermons";
const emptyMeta = { page: 1, pages: 1, total: 0, categories: [], preachers: [] };

const palette = {
  ink: "#0f172a",
  muted: "#64748b",
  softText: "#334155",
  surface: "rgba(255,255,255,0.86)",
  primary: "#0369a1",
  primaryDark: "#0c4a6e",
  primarySoft: "#e0f2fe",
  accent: "#b45309",
  accentSoft: "#fff7ed",
  success: "#047857",
  successSoft: "#ecfdf5",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(150deg, #f8fafc 0%, #eef9ff 42%, #fffaf3 100%)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: palette.ink,
    padding: "32px clamp(14px, 4vw, 44px) 68px",
  },
  shell: { maxWidth: "1220px", margin: "0 auto" },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "22px",
    alignItems: "stretch",
    marginBottom: "22px",
  },
  card: {
    background: palette.surface,
    border: "none",
    borderRadius: "8px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.1)",
    overflow: "hidden",
    backdropFilter: "blur(14px)",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255,255,255,0.92)",
    color: palette.ink,
    outline: "none",
    font: "inherit",
    boxShadow: "inset 0 0 0 1px rgba(14, 116, 144, 0.08), 0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "0.84rem",
    lineHeight: 1.2,
    minHeight: "40px",
    transition: "transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    color: palette.primaryDark,
    fontSize: "0.72rem",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "0.72rem",
    fontWeight: 900,
  },
};

const buttonTones = {
  primary: { background: "linear-gradient(135deg, #0369a1, #0891b2)", color: "#fff", boxShadow: "0 12px 24px rgba(3, 105, 161, 0.22)" },
  secondary: { background: "rgba(224, 242, 254, 0.92)", color: palette.primary, boxShadow: "0 10px 22px rgba(3, 105, 161, 0.08)" },
  neutral: { background: "rgba(241, 245, 249, 0.94)", color: "#334155", boxShadow: "0 10px 22px rgba(15, 23, 42, 0.07)" },
  warm: { background: "rgba(255, 247, 237, 0.95)", color: palette.accent, boxShadow: "0 10px 22px rgba(180, 83, 9, 0.08)" },
  success: { background: "rgba(236, 253, 245, 0.95)", color: palette.success, boxShadow: "0 10px 22px rgba(4, 120, 87, 0.08)" },
  ghost: { background: "transparent", color: palette.primary },
};

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);

function SermonMotionStyles() {
  return (
    <style>{`
      .sermon-card,
      .sermon-feature,
      .sermon-saved-link,
      .sermon-filter-panel,
      .sermon-reader-panel {
        transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease;
      }

      .sermon-card:hover,
      .sermon-feature:hover,
      .sermon-saved-link:hover {
        transform: translateY(-6px);
        box-shadow: 0 30px 70px rgba(15, 23, 42, 0.14);
      }

      .sermon-card:hover .sermon-cover img,
      .sermon-feature:hover .sermon-cover img {
        transform: scale(1.04);
      }

      .sermon-cover img {
        transition: transform 420ms ease;
      }

      .sermon-action:hover {
        transform: translateY(-2px);
      }

      .sermon-detail-hero {
        animation: sermonRise 360ms ease both;
      }

      .sermon-reader-panel {
        animation: sermonRise 420ms ease both;
      }

      .sermon-detail-grid {
        display: grid;
        grid-template-columns: minmax(240px, 0.34fr) minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }

      @media (max-width: 860px) {
        .sermon-detail-grid {
          grid-template-columns: 1fr;
        }

        .sermon-detail-grid .sermon-reader-panel {
          position: static !important;
        }
      }

      @media (max-width: 720px) {
        .sermon-page {
          padding: 18px 12px 46px !important;
          overflow-x: hidden;
        }

        .sermon-shell {
          width: 100% !important;
          max-width: 100% !important;
        }

        .sermon-hero {
          gap: 16px !important;
          margin-bottom: 18px !important;
        }

        .sermon-hero-title {
          font-size: 2.55rem !important;
          line-height: 1.02 !important;
          overflow-wrap: anywhere;
        }

        .sermon-hero-copy {
          font-size: 0.95rem !important;
          line-height: 1.6 !important;
        }

        .sermon-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          max-width: 100% !important;
        }

        .sermon-card,
        .sermon-feature,
        .sermon-filter-panel,
        .sermon-reader-panel {
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.1) !important;
        }

        .sermon-card:hover,
        .sermon-feature:hover,
        .sermon-saved-link:hover,
        .sermon-action:hover {
          transform: none;
        }

        .sermon-card .sermon-cover {
          height: 154px !important;
        }

        .sermon-cover-tall {
          height: 220px !important;
        }

        .sermon-card-body {
          padding: 14px !important;
        }

        .sermon-card-title {
          font-size: 1rem !important;
        }

        .sermon-card-actions {
          display: grid !important;
          grid-template-columns: 1.2fr 0.9fr 0.9fr;
          gap: 8px !important;
          width: 100%;
        }

        .sermon-card-actions .sermon-action {
          justify-content: center;
          min-width: 0;
          min-height: 44px !important;
          padding: 11px 8px !important;
          text-align: center;
        }

        .sermon-filter-panel {
          padding: 14px !important;
          margin-bottom: 16px !important;
        }

        .sermon-filter-grid {
          grid-template-columns: 1fr !important;
          gap: 10px !important;
        }

        .sermon-filter-grid .sermon-action {
          width: 100%;
        }

        .sermon-list-grid,
        .sermon-loading-grid,
        .sermon-saved-grid {
          grid-template-columns: 1fr !important;
          gap: 14px !important;
        }

        .sermon-section-heading {
          align-items: flex-start !important;
        }

        .sermon-pagination {
          display: grid !important;
          grid-template-columns: 1fr auto 1fr;
          gap: 8px !important;
          width: 100%;
        }

        .sermon-pagination .sermon-action {
          min-height: 44px !important;
          padding: 10px 8px !important;
        }
      }

      @media (max-width: 560px) {
        .sermon-detail-visual {
          min-height: 430px !important;
        }

        .sermon-detail-hero > div {
          padding: 24px 16px !important;
        }

        .sermon-detail-title {
          font-size: 2.35rem !important;
          line-height: 1.02 !important;
          overflow-wrap: anywhere;
        }

        .sermon-detail-meta {
          font-size: 0.92rem !important;
          line-height: 1.55 !important;
        }

        .sermon-detail-summary {
          font-size: 0.92rem !important;
          line-height: 1.62 !important;
        }

        .sermon-back-action {
          width: 100%;
          margin-bottom: 12px !important;
        }

        .sermon-detail-actions {
          display: grid !important;
          grid-template-columns: 1fr 1fr;
        }

        .sermon-detail-actions .sermon-action,
        .sermon-download-actions .sermon-action {
          min-height: 46px !important;
        }

        .sermon-download-actions {
          grid-template-columns: 1fr !important;
        }

        .sermon-stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .sermon-reader-heading {
          padding: 14px !important;
        }

        .sermon-pdf-frame {
          height: 64vh !important;
          min-height: 430px;
        }

        .sermon-empty {
          padding: 24px 16px !important;
        }
      }

      @media (max-width: 380px) {
        .sermon-hero-title,
        .sermon-detail-title {
          font-size: 2rem !important;
        }

        .sermon-card-actions {
          grid-template-columns: 1fr !important;
        }

        .sermon-pagination {
          grid-template-columns: 1fr !important;
        }
      }

      @keyframes sermonRise {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}

const fileUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const sermonUrl = (id) => `${SITE_URL}/sermons/${id}`;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const truncate = (value = "", length = 130) => {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
};

const downloadField = (type) => (type === "word" ? "wordUrl" : "pdfUrl");
const downloadLabel = (type) => (type === "word" ? "Word" : "PDF");

function actionStyle(variant = "primary", disabled = false, extra = {}) {
  return {
    ...styles.button,
    ...(buttonTones[variant] || buttonTones.primary),
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    ...extra,
  };
}

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(bookmarkKey) || "[]");
    } catch {
      return [];
    }
  });

  const toggle = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem(bookmarkKey, JSON.stringify(next));
      return next;
    });
  };

  return { bookmarks, toggle };
}

function StatPill({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: { background: "rgba(248, 250, 252, 0.9)", color: "#334155", boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)" },
    primary: { background: "rgba(224, 242, 254, 0.95)", color: palette.primary, boxShadow: "0 8px 18px rgba(3, 105, 161, 0.08)" },
    warm: { background: "rgba(255, 247, 237, 0.95)", color: palette.accent, boxShadow: "0 8px 18px rgba(180, 83, 9, 0.07)" },
    success: { background: "rgba(236, 253, 245, 0.95)", color: palette.success, boxShadow: "0 8px 18px rgba(4, 120, 87, 0.07)" },
  };

  return (
    <span style={{ ...styles.badge, ...(tones[tone] || tones.neutral) }}>
      {value} {label}
    </span>
  );
}

function TagList({ tags = [], limit = 4 }) {
  const visible = tags.filter(Boolean).slice(0, limit);
  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
      {visible.map((tag) => (
        <span key={tag} style={{ ...styles.badge, background: "rgba(248,250,252,0.92)", color: "#475569", boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)" }}>
          {tag}
        </span>
      ))}
    </div>
  );
}

function SermonCover({ sermon, tall = false }) {
  return (
    <div
      className={`sermon-cover${tall ? " sermon-cover-tall" : ""}`}
      style={{
        position: "relative",
        height: tall ? "280px" : "172px",
        background: "linear-gradient(135deg, #082f49 0%, #0ea5e9 58%, #f59e0b 100%)",
        overflow: "hidden",
      }}
    >
      {sermon.coverImage ? (
        <img src={fileUrl(sermon.coverImage)} alt={sermon.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ height: "100%", display: "grid", placeItems: "center", padding: "24px", color: "#e0f2fe", textAlign: "center" }}>
          <div>
            <strong style={{ display: "block", fontSize: tall ? "2.4rem" : "1.4rem", letterSpacing: "0.04em" }}>OHC</strong>
            <span style={{ display: "block", marginTop: "6px", fontWeight: 800 }}>Outreach Hope Church</span>
          </div>
        </div>
      )}
      {sermon.isFeatured && (
        <span style={{ ...styles.badge, position: "absolute", top: "12px", left: "12px", background: "rgba(255,247,237,0.95)", color: palette.accent, boxShadow: "0 12px 24px rgba(15, 23, 42, 0.16)" }}>
          Featured
        </span>
      )}
    </div>
  );
}

function SermonCard({ sermon, bookmarks, onBookmark, onDownload, downloadingKey }) {
  const bookmarked = bookmarks.includes(sermon._id);
  const pdfKey = `${sermon._id}:pdf`;
  const wordKey = `${sermon._id}:word`;
  const pdfDisabled = !sermon.pdfUrl || downloadingKey === pdfKey;
  const wordDisabled = !sermon.wordUrl || downloadingKey === wordKey;

  return (
    <article className="sermon-card" style={{ ...styles.card, display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <SermonCover sermon={sermon} />
      <div className="sermon-card-body" style={{ padding: "16px", display: "flex", flex: 1, flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "10px", alignItems: "start" }}>
          <span style={{ ...styles.badge, background: palette.primarySoft, color: palette.primary }}>{sermon.category || "General"}</span>
          <button
            className="sermon-action"
            type="button"
            aria-label={bookmarked ? "Remove sermon bookmark" : "Bookmark sermon"}
            onClick={() => onBookmark(sermon._id)}
            style={actionStyle(bookmarked ? "success" : "ghost", false, { minHeight: "32px", padding: "6px 8px" })}
          >
            {bookmarked ? "Saved" : "Save"}
          </button>
        </div>

        <h3 className="sermon-card-title" style={{ margin: "0 0 8px", color: palette.primaryDark, fontSize: "1.05rem", lineHeight: 1.3, overflowWrap: "anywhere" }}>
          {sermon.title}
        </h3>
        <p style={{ margin: 0, color: "#475569", fontSize: "0.86rem" }}>
          {sermon.preacher} | {formatDate(sermon.sermonDate)}
        </p>
        <p style={{ margin: "10px 0", color: palette.primary, fontWeight: 800, fontSize: "0.84rem", overflowWrap: "anywhere" }}>
          {sermon.scripture}
        </p>
        <p style={{ margin: "0 0 12px", color: palette.muted, lineHeight: 1.55, fontSize: "0.86rem", minHeight: "62px" }}>
          {sermon.summary ? truncate(sermon.summary) : "Summary coming soon."}
        </p>

        <TagList tags={sermon.tags} limit={3} />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "14px 0" }}>
          <StatPill label="views" value={formatNumber(sermon.views)} tone="primary" />
          <StatPill label="downloads" value={formatNumber(sermon.downloads?.total)} tone="warm" />
        </div>

        <div className="sermon-card-actions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto" }}>
          <Link className="sermon-action" to={`/sermons/${sermon._id}`} style={{ ...actionStyle("primary"), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Read
          </Link>
          <button className="sermon-action" type="button" style={actionStyle("secondary", pdfDisabled)} disabled={pdfDisabled} onClick={() => onDownload(sermon, "pdf")}>
            {downloadingKey === pdfKey ? "Opening..." : "PDF"}
          </button>
          <button className="sermon-action" type="button" style={actionStyle("neutral", wordDisabled)} disabled={wordDisabled} onClick={() => onDownload(sermon, "word")}>
            {downloadingKey === wordKey ? "Opening..." : "Word"}
          </button>
        </div>
      </div>
    </article>
  );
}

function LoadingCards() {
  return (
    <div className="sermon-loading-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} style={{ ...styles.card, padding: "16px" }}>
          <div style={{ height: "148px", borderRadius: "8px", background: "#e2e8f0", marginBottom: "14px" }} />
          <div style={{ height: "16px", width: "46%", background: "#e2e8f0", borderRadius: "999px", marginBottom: "12px" }} />
          <div style={{ height: "22px", width: "80%", background: "#cbd5e1", borderRadius: "6px", marginBottom: "10px" }} />
          <div style={{ height: "14px", width: "62%", background: "#e2e8f0", borderRadius: "999px" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, message, action }) {
  return (
    <div className="sermon-empty" style={{ ...styles.card, padding: "34px", textAlign: "center", color: palette.muted }}>
      <h2 style={{ margin: "0 0 8px", color: palette.primaryDark, fontSize: "1.2rem" }}>{title}</h2>
      <p style={{ margin: "0 auto 18px", maxWidth: "520px", lineHeight: 1.6 }}>{message}</p>
      {action}
    </div>
  );
}

function PdfPreview({ sermon }) {
  const pdfUrl = sermon?.pdfUrl || "";
  const [preview, setPreview] = useState({ status: "loading", url: "", source: "" });

  useEffect(() => {
    if (!pdfUrl) return undefined;

    let active = true;
    let objectUrl = "";

    axios.get(fileUrl(pdfUrl), { responseType: "blob" })
      .then((res) => {
        if (!active) return;
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPreview({ status: "ready", url: objectUrl, source: pdfUrl });
      })
      .catch(() => {
        if (active) setPreview({ status: "error", url: "", source: pdfUrl });
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfUrl]);

  if (!pdfUrl) {
    return <EmptyState title="PDF unavailable" message="This sermon does not have a readable PDF attached yet." />;
  }

  const previewStatus = preview.source === pdfUrl ? preview.status : "loading";

  if (previewStatus === "loading") {
    return (
      <div className="sermon-reader-panel" style={{ ...styles.card, minHeight: "420px", display: "grid", placeItems: "center", padding: "34px", textAlign: "center", color: palette.muted }}>
        <div>
          <strong style={{ display: "block", color: palette.primaryDark, fontSize: "1.1rem", marginBottom: "6px" }}>Opening reader</strong>
          <span>Loading PDF preview...</span>
        </div>
      </div>
    );
  }

  if (previewStatus === "error") {
    return (
      <EmptyState
        title="Preview unavailable"
        message="The PDF preview could not load in the page, but you can still open the file directly."
        action={(
          <a
            href={fileUrl(pdfUrl)}
            target="_blank"
            rel="noreferrer"
            style={{ ...actionStyle("primary"), display: "inline-flex", alignItems: "center", textDecoration: "none" }}
          >
            Open PDF
          </a>
        )}
      />
    );
  }

  return (
    <iframe
      className="sermon-pdf-frame"
      title={sermon.title}
      src={preview.url}
      style={{ width: "100%", height: "min(78vh, 760px)", border: "none", borderRadius: "8px", background: "#fff", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)" }}
    />
  );
}

function SermonDetail({ id }) {
  const [sermon, setSermon] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [downloadingType, setDownloadingType] = useState("");
  const { bookmarks, toggle } = useBookmarks();
  const navigate = useNavigate();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(sermonUrl(sermon._id));
      setToast("Sermon link copied.");
    } catch {
      setToast("Could not copy the link in this browser.");
    }
  };

  const download = async (type) => {
    if (!sermon) return;
    if (!sermon[downloadField(type)]) {
      setToast(`${downloadLabel(type)} file is not available for this sermon.`);
      return;
    }

    setDownloadingType(type);
    setToast("");
    try {
      const res = await axios.post(`/api/sermons/${sermon._id}/download`, { type });
      const url = fileUrl(res.data.url);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      setSermon((prev) => prev ? { ...prev, downloads: res.data.downloads } : prev);
      setToast(`${downloadLabel(type)} opened in a new tab.`);
    } catch {
      setToast(`Could not open the ${downloadLabel(type)} right now.`);
    } finally {
      setDownloadingType("");
    }
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setToast("");

    getWithRetry(`/api/sermons/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!active) return;
        setSermon(res.data.sermon);
        setRelated(res.data.related || []);
        axios.post(`/api/sermons/${id}/view`)
          .then((viewRes) => {
            if (active) setSermon((prev) => prev ? { ...prev, views: viewRes.data.views } : prev);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (active) setError("We could not find that sermon.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="sermon-page" style={styles.page}>
        <CloseButton />
        <div className="sermon-shell" style={styles.shell}>
          <div style={{ ...styles.card, padding: "28px" }}>Loading sermon...</div>
        </div>
      </div>
    );
  }

  if (error || !sermon) {
    return (
      <div className="sermon-page" style={styles.page}>
        <CloseButton />
        <div className="sermon-shell" style={styles.shell}>
          <EmptyState
            title="Sermon unavailable"
            message={error || "This sermon is not available right now."}
            action={<button type="button" style={actionStyle("primary")} onClick={() => navigate("/sermons")}>Back to Library</button>}
          />
        </div>
      </div>
    );
  }

  const bookmarked = bookmarks.includes(sermon._id);
  const coverImageUrl = fileUrl(sermon.coverImage);
  const heroBackground = coverImageUrl
    ? `linear-gradient(90deg, rgba(8, 47, 73, 0.92) 0%, rgba(8, 47, 73, 0.72) 46%, rgba(180, 83, 9, 0.28) 100%), url(${coverImageUrl}) center / cover`
    : "linear-gradient(135deg, #082f49 0%, #0369a1 56%, #b45309 100%)";

  return (
    <div className="sermon-page" style={styles.page}>
      <SermonMotionStyles />
      <CloseButton />
      <div className="sermon-shell" style={styles.shell}>
        <button className="sermon-action sermon-back-action" type="button" style={actionStyle("secondary", false, { marginBottom: "16px" })} onClick={() => navigate("/sermons")}>
          Back to Library
        </button>

        <section
          className="sermon-detail-hero sermon-detail-visual"
          style={{
            minHeight: "clamp(360px, 54vh, 560px)",
            borderRadius: "8px",
            overflow: "hidden",
            background: heroBackground,
            boxShadow: "0 34px 80px rgba(8, 47, 73, 0.22)",
            marginBottom: "18px",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div style={{ padding: "clamp(22px, 5vw, 52px)", width: "100%" }}>
            <div style={{ maxWidth: "880px" }}>
              <span style={{ ...styles.badge, background: "rgba(255,255,255,0.92)", color: palette.primaryDark, boxShadow: "0 14px 30px rgba(0,0,0,0.14)" }}>
                {sermon.category || "General"}
              </span>
              <h1 className="sermon-detail-title" style={{ margin: "14px 0 10px", color: "#fff", fontSize: "4.4rem", lineHeight: 0.96, textShadow: "0 18px 42px rgba(0,0,0,0.34)" }}>
                {sermon.title}
              </h1>
              <p className="sermon-detail-meta" style={{ margin: 0, color: "rgba(255,255,255,0.88)", lineHeight: 1.65, fontSize: "1rem", fontWeight: 700 }}>
                {sermon.preacher} | {formatDate(sermon.sermonDate)} | {sermon.scripture}
              </p>
              {sermon.summary && (
                <p className="sermon-detail-summary" style={{ maxWidth: "760px", margin: "18px 0 0", color: "rgba(255,255,255,0.82)", lineHeight: 1.75, fontSize: "0.98rem" }}>
                  {sermon.summary}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="sermon-detail-grid">
          <aside className="sermon-reader-panel" style={{ ...styles.card, padding: "18px", position: "sticky", top: "18px" }}>
            <div className="sermon-detail-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              <button className="sermon-action" type="button" style={actionStyle(bookmarked ? "success" : "secondary")} onClick={() => toggle(sermon._id)}>
                {bookmarked ? "Saved" : "Save"}
              </button>
              <button className="sermon-action" type="button" style={actionStyle("warm")} onClick={copyLink}>Copy Link</button>
            </div>

            <div className="sermon-download-actions" style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
              <button className="sermon-action" type="button" style={actionStyle("primary", downloadingType === "pdf" || !sermon.pdfUrl, { width: "100%" })} disabled={downloadingType === "pdf" || !sermon.pdfUrl} onClick={() => download("pdf")}>
                {downloadingType === "pdf" ? "Opening PDF..." : "Download PDF"}
              </button>
              <button className="sermon-action" type="button" style={actionStyle("neutral", downloadingType === "word" || !sermon.wordUrl, { width: "100%" })} disabled={downloadingType === "word" || !sermon.wordUrl} onClick={() => download("word")}>
                {downloadingType === "word" ? "Opening Word..." : "Download Word"}
              </button>
            </div>

            {toast && <p style={{ color: palette.primary, fontSize: "0.86rem", fontWeight: 800, margin: "0 0 14px" }}>{toast}</p>}

            <div className="sermon-stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              <StatPill label="views" value={formatNumber(sermon.views)} tone="primary" />
              <StatPill label="PDF" value={formatNumber(sermon.downloads?.pdf)} tone="neutral" />
              <StatPill label="Word" value={formatNumber(sermon.downloads?.word)} tone="warm" />
              <StatPill label="total" value={formatNumber(sermon.downloads?.total)} tone="success" />
            </div>

            <TagList tags={sermon.tags} limit={8} />
          </aside>

          <main style={{ minWidth: 0 }}>
            <div className="sermon-reader-panel sermon-reader-heading" style={{ padding: "18px clamp(14px, 3vw, 24px)", marginBottom: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.7)", boxShadow: "0 18px 45px rgba(15,23,42,0.08)", backdropFilter: "blur(12px)" }}>
              <span style={{ color: palette.accent, fontWeight: 900, fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Reader</span>
              <h2 style={{ margin: "5px 0 0", color: palette.primaryDark, fontSize: "1.2rem" }}>Sermon Document</h2>
            </div>
            <PdfPreview sermon={sermon} />
          </main>
        </section>

        {related.length > 0 && (
          <section style={{ marginTop: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "end", marginBottom: "12px" }}>
              <div>
                <span style={{ color: palette.accent, fontWeight: 900, fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Keep studying</span>
                <h2 style={{ color: palette.primaryDark, margin: "4px 0 0" }}>Related Sermons</h2>
              </div>
            </div>
            <div className="sermon-list-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {related.map((item) => (
                <SermonCard
                  key={item._id}
                  sermon={item}
                  bookmarks={bookmarks}
                  onBookmark={toggle}
                  onDownload={async (s, type) => {
                    const res = await axios.post(`/api/sermons/${s._id}/download`, { type });
                    const url = fileUrl(res.data.url);
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  downloadingKey=""
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Sermons() {
  const { id } = useParams();
  const [sermons, setSermons] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [filters, setFilters] = useState({ q: "", category: "", preacher: "", date: "", sort: "latest", page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { bookmarks, toggle } = useBookmarks();
  const debouncedQuery = useDebouncedValue(filters.q);

  const params = useMemo(() => ({
    q: debouncedQuery || undefined,
    category: filters.category || undefined,
    preacher: filters.preacher || undefined,
    date: filters.date || undefined,
    sort: filters.sort,
    page: filters.page,
    limit: 9,
  }), [debouncedQuery, filters.category, filters.date, filters.page, filters.preacher, filters.sort]);

  const hasActiveFilters = Boolean(filters.q || filters.category || filters.preacher || filters.date || filters.sort !== "latest");
  const heroSermon = featured[0] || latest[0];

  const knownSermons = useMemo(() => {
    const byId = new Map();
    [...featured, ...latest, ...sermons].forEach((sermon) => {
      if (sermon?._id) byId.set(sermon._id, sermon);
    });
    return Array.from(byId.values());
  }, [featured, latest, sermons]);

  const savedSermons = useMemo(
    () => knownSermons.filter((sermon) => bookmarks.includes(sermon._id)).slice(0, 4),
    [bookmarks, knownSermons]
  );

  const updateDownloads = (idToUpdate, downloads) => {
    const updater = (items) => items.map((item) => item._id === idToUpdate ? { ...item, downloads } : item);
    setSermons(updater);
    setFeatured(updater);
    setLatest(updater);
  };

  const resetFilters = () => {
    setFilters({ q: "", category: "", preacher: "", date: "", sort: "latest", page: 1 });
  };

  const download = async (sermon, type) => {
    if (!sermon[downloadField(type)]) {
      setToast(`${downloadLabel(type)} file is not available for "${sermon.title}".`);
      return;
    }

    const key = `${sermon._id}:${type}`;
    setDownloadingKey(key);
    setToast("");
    try {
      const res = await axios.post(`/api/sermons/${sermon._id}/download`, { type });
      const url = fileUrl(res.data.url);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      updateDownloads(sermon._id, res.data.downloads);
      setToast(`${downloadLabel(type)} opened for "${sermon.title}".`);
    } catch {
      setToast(`Could not open the ${downloadLabel(type)} for "${sermon.title}".`);
    } finally {
      setDownloadingKey("");
    }
  };

  useEffect(() => {
    if (id) return;
    let active = true;
    setLoading(true);
    setError("");

    const controller = new AbortController();
    Promise.allSettled([
      getWithRetry("/api/sermons", { params, signal: controller.signal }),
      getWithRetry("/api/sermons/featured", { signal: controller.signal }),
    ])
      .then(([listResult, featuredResult]) => {
        if (!active) return;
        if (listResult.status === "rejected") throw listResult.reason;

        const listRes = listResult.value;
        setSermons(listRes.data.sermons || []);
        setMeta({ ...emptyMeta, ...listRes.data });
        if (featuredResult.status === "fulfilled") {
          setFeatured(featuredResult.value.data.featured || []);
          setLatest(featuredResult.value.data.latest || []);
        } else {
          setFeatured([]);
          setLatest(listRes.data.sermons?.slice(0, 6) || []);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not load the sermon library right now.");
          setSermons([]);
          setMeta(emptyMeta);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, params, reloadKey]);

  if (id) return <SermonDetail id={id} />;

  return (
    <div className="sermon-page" style={styles.page}>
      <SermonMotionStyles />
      <CloseButton />
      <div className="sermon-shell" style={styles.shell}>
        <section className="sermon-hero" style={styles.hero}>
          <div style={{ padding: "18px 0 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ color: palette.accent, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
              Sermon Library
            </span>
            <h1 className="sermon-hero-title" style={{ margin: "10px 0", color: palette.primaryDark, fontSize: "3.8rem", lineHeight: 1 }}>
              Read, save, and revisit the Word
            </h1>
            <p className="sermon-hero-copy" style={{ color: "#475569", lineHeight: 1.7, maxWidth: "680px", margin: "0 0 18px" }}>
              Teaching notes and sermon documents from Outreach Hope Church Sunshine for study, reflection, and ministry preparation.
            </p>
            <div className="sermon-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", maxWidth: "680px" }}>
              {[
                ["Library", formatNumber(meta.total)],
                ["Categories", formatNumber(meta.categories?.length)],
                ["Preachers", formatNumber(meta.preachers?.length)],
                ["Saved", formatNumber(bookmarks.length)],
              ].map(([label, value]) => (
                <div key={label} className="sermon-reader-panel" style={{ ...styles.card, padding: "14px" }}>
                  <strong style={{ display: "block", color: palette.primaryDark, fontSize: "1.3rem" }}>{value}</strong>
                  <span style={{ color: palette.muted, fontWeight: 800, fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {heroSermon && (
            <Link className="sermon-feature" to={`/sermons/${heroSermon._id}`} style={{ ...styles.card, textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
              <SermonCover sermon={heroSermon} tall />
              <div style={{ padding: "18px" }}>
                <span style={{ ...styles.badge, background: palette.accentSoft, color: palette.accent }}>{heroSermon.isFeatured ? "Featured" : "Latest"}</span>
                <h2 style={{ margin: "10px 0 8px", color: palette.primaryDark, lineHeight: 1.2 }}>{heroSermon.title}</h2>
                <p style={{ margin: 0, color: palette.muted }}>{heroSermon.preacher} | {formatDate(heroSermon.sermonDate)}</p>
              </div>
            </Link>
          )}
        </section>

        {savedSermons.length > 0 && (
          <section style={{ padding: "4px 0 18px", marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
              <div>
                <span style={{ color: palette.success, fontWeight: 900, fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Saved</span>
                <h2 style={{ margin: "4px 0 0", color: palette.primaryDark, fontSize: "1.05rem" }}>Continue where you left off</h2>
              </div>
              <span style={{ color: palette.muted, fontWeight: 700, fontSize: "0.84rem" }}>{bookmarks.length} saved total</span>
            </div>
            <div className="sermon-saved-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
              {savedSermons.map((sermon) => (
                <Link key={sermon._id} className="sermon-saved-link" to={`/sermons/${sermon._id}`} style={{ borderRadius: "8px", padding: "12px", background: "rgba(255,255,255,0.84)", color: "inherit", textDecoration: "none", boxShadow: "0 16px 34px rgba(15, 23, 42, 0.08)" }}>
                  <strong style={{ display: "block", color: palette.primaryDark, marginBottom: "4px", overflowWrap: "anywhere" }}>{sermon.title}</strong>
                  <span style={{ color: palette.muted, fontSize: "0.84rem" }}>{sermon.preacher} | {formatDate(sermon.sermonDate)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="sermon-filter-panel" style={{ ...styles.card, padding: "16px", marginBottom: "18px" }}>
          <div className="sermon-filter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", alignItems: "end" }}>
            <label>
              <span style={styles.label}>Search</span>
              <input
                style={styles.input}
                placeholder="Title, preacher, scripture..."
                value={filters.q}
                onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
              />
            </label>
            <label>
              <span style={styles.label}>Category</span>
              <select style={styles.input} value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))}>
                <option value="">All Categories</option>
                {meta.categories?.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              <span style={styles.label}>Preacher</span>
              <select style={styles.input} value={filters.preacher} onChange={(e) => setFilters((prev) => ({ ...prev, preacher: e.target.value, page: 1 }))}>
                <option value="">All Preachers</option>
                {meta.preachers?.map((preacher) => <option key={preacher} value={preacher}>{preacher}</option>)}
              </select>
            </label>
            <label>
              <span style={styles.label}>Date</span>
              <input style={styles.input} type="date" value={filters.date} onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value, page: 1 }))} />
            </label>
            <label>
              <span style={styles.label}>Sort</span>
              <select style={styles.input} value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Viewed</option>
                <option value="downloads">Most Downloaded</option>
              </select>
            </label>
            <button className="sermon-action" type="button" style={actionStyle("warm", !hasActiveFilters)} disabled={!hasActiveFilters} onClick={resetFilters}>
              Reset
            </button>
          </div>

          {hasActiveFilters && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
              {filters.q && <StatPill label="search" value={filters.q} tone="primary" />}
              {filters.category && <StatPill label="category" value={filters.category} tone="warm" />}
              {filters.preacher && <StatPill label="preacher" value={filters.preacher} tone="neutral" />}
              {filters.date && <StatPill label="date" value={formatDate(filters.date)} tone="success" />}
              {filters.sort !== "latest" && <StatPill label="sort" value={filters.sort === "views" ? "Most Viewed" : filters.sort === "downloads" ? "Most Downloaded" : "Oldest"} tone="primary" />}
            </div>
          )}
        </section>

        <div className="sermon-section-heading" style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h2 style={{ margin: 0, color: palette.primaryDark, fontSize: "1.2rem" }}>All Sermons</h2>
            <p style={{ margin: "4px 0 0", color: palette.muted, fontSize: "0.86rem" }}>
              {loading ? "Refreshing library..." : `${formatNumber(meta.total || sermons.length)} sermon${(meta.total || sermons.length) === 1 ? "" : "s"} found`}
            </p>
          </div>
          {toast && <span style={{ color: palette.primary, fontWeight: 800, fontSize: "0.86rem" }}>{toast}</span>}
        </div>

        {loading ? (
          <LoadingCards />
        ) : error ? (
          <EmptyState title="Library unavailable" message={error} action={<button type="button" style={actionStyle("primary")} onClick={() => setReloadKey((key) => key + 1)}>Try Again</button>} />
        ) : sermons.length === 0 ? (
          <EmptyState title="No sermons found" message="There are no sermons matching this view." action={<button type="button" style={actionStyle("primary")} onClick={resetFilters}>Show All Sermons</button>} />
        ) : (
          <div className="sermon-list-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {sermons.map((sermon) => (
              <SermonCard key={sermon._id} sermon={sermon} bookmarks={bookmarks} onBookmark={toggle} onDownload={download} downloadingKey={downloadingKey} />
            ))}
          </div>
        )}

        {!loading && !error && sermons.length > 0 && (
          <div className="sermon-pagination" style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="sermon-action"
              type="button"
              style={actionStyle("secondary", filters.page <= 1)}
              disabled={filters.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center", color: palette.muted, fontWeight: 800 }}>
              Page {meta.page || 1} of {meta.pages || 1}
            </span>
            <button
              className="sermon-action"
              type="button"
              style={actionStyle("primary", filters.page >= meta.pages)}
              disabled={filters.page >= meta.pages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sermons;
