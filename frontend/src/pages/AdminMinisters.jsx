import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL as API } from "../apiConfig";

const formatUploadDate = (value) => value
  ? new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
  : "Date unavailable";

function getAdminToken() {
  return localStorage.getItem("token") || localStorage.getItem("adminToken") || null;
}

const defaultForm = { name: "", role: "", bio: "", order: 0 };

export default function AdminMinisters() {
  const [ministers, setMinisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Add / Edit form
  const [form, setForm] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [galleryPhotoUrl, setGalleryPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add mode

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchMinisters() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/ministers`);
      setMinisters(res.data);
    } catch {
      showToast("Failed to load ministers.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGalleryImages() {
    setGalleryLoading(true);
    try {
      const res = await axios.get(`${API}/api/gallery`);
      const seen = new Set();
      const images = [];

      (res.data || []).forEach((folder) => {
        const files = folder.files || [];
        files
          .filter((file) => file.type === "image" && file.url)
          .forEach((file) => {
            if (seen.has(file.url)) return;
            seen.add(file.url);
            images.push({ url: file.url, title: folder.title || "Gallery image" });
          });

        if (folder.coverUrl && !seen.has(folder.coverUrl)) {
          seen.add(folder.coverUrl);
          images.push({ url: folder.coverUrl, title: folder.title || "Gallery cover" });
        }
      });

      setGalleryImages(images);
    } catch {
      showToast("Failed to load gallery images.", "error");
    } finally {
      setGalleryLoading(false);
    }
  }

  useEffect(() => {
    fetchMinisters();
    fetchGalleryImages();
  }, []);

  function mediaUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API}${url.startsWith("/") ? url : `/${url}`}`;
  }

  function photoPlaceholder(initial = "O") {
    const safeInitial = String(initial || "O").slice(0, 1).toUpperCase();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='320' height='220'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='#0ea5e9'/><stop offset='1' stop-color='#082f49'/></linearGradient></defs><rect width='320' height='220' fill='url(#g)'/><text x='50%' y='54%' text-anchor='middle' font-family='Arial, sans-serif' font-size='72' font-weight='700' fill='white'>${safeInitial}</text></svg>`)}`;
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setGalleryPhotoUrl("");
    setPhotoPreviewError(false);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleGalleryPhotoUrlChange(value) {
    setGalleryPhotoUrl(value);
    setPhotoFile(null);
    setPhotoPreviewError(false);
    setPhotoPreview(value.trim() ? mediaUrl(value.trim()) : "");
  }

  function selectGalleryImage(url) {
    handleGalleryPhotoUrlChange(url);
  }

  function startEdit(minister) {
    setEditingId(minister._id);
    setForm({
      name: minister.name,
      role: minister.role,
      bio: minister.bio || "",
      order: minister.order ?? 0,
    });
    setPhotoPreview(minister.photoUrl ? mediaUrl(minister.photoUrl) : "");
    setGalleryPhotoUrl("");
    setPhotoFile(null);
    setPhotoPreviewError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
    setPhotoFile(null);
    setGalleryPhotoUrl("");
    setPhotoPreview("");
    setPhotoPreviewError(false);
  }

  // ── Save (create or update) ──────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      showToast("Name and role are required.", "error");
      return;
    }
    const token = getAdminToken();
    if (!token) { showToast("Not authenticated.", "error"); return; }

    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("role", form.role);
    fd.append("bio", form.bio);
    fd.append("order", form.order);
    if (photoFile) fd.append("photo", photoFile);
    if (!photoFile && galleryPhotoUrl.trim()) fd.append("photoUrl", galleryPhotoUrl.trim());

    try {
      if (editingId) {
        await axios.put(`${API}/api/ministers/${editingId}`, fd, {
          headers: { Authorization: token, "Content-Type": "multipart/form-data" },
        });
        showToast("Minister updated successfully!");
      } else {
        await axios.post(`${API}/api/ministers`, fd, {
          headers: { Authorization: token, "Content-Type": "multipart/form-data" },
        });
        showToast("Minister added successfully!");
      }
      cancelEdit();
      fetchMinisters();
    } catch (err) {
      showToast(err.response?.data?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(minister) {
    if (!window.confirm(`Delete ${minister.name}? This cannot be undone.`)) return;
    const token = getAdminToken();
    if (!token) { showToast("Not authenticated.", "error"); return; }
    try {
      await axios.delete(`${API}/api/ministers/${minister._id}`, {
        headers: { Authorization: token },
      });
      showToast(`${minister.name} deleted.`);
      fetchMinisters();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "success" ? "#065f46" : "#7f1d1d" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div style={s.wrapper}>
        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <p style={s.label}>Admin Portal</p>
            <h1 style={s.h1}>Ministers Manager</h1>
            <p style={s.subtitle}>Add, edit, or remove ministers. Photos are saved to the database and visible to everyone.</p>
          </div>
          <Link to="/admin-dashboard" style={s.backBtn}>← Dashboard</Link>
        </div>

        {/* Form */}
        <section style={s.card}>
          <h2 style={s.sectionTitle}>{editingId ? "✏️ Edit Minister" : "➕ Add New Minister"}</h2>
          <form onSubmit={handleSave} style={s.form}>
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.fieldLabel}>Full Name *</label>
                <input
                  style={s.input}
                  placeholder="e.g. Rev. Clinton OKANGA"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.fieldLabel}>Role / Title *</label>
                <input
                  style={s.input}
                  placeholder="e.g. Senior Pastor"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.fieldLabel}>Display Order</label>
                <input
                  style={s.input}
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.fieldLabel}>Photo</label>
                <label style={s.photoLabel}>
                  {photoPreview && !photoPreviewError
                    ? (
                      <img
                        src={photoPreview}
                        alt="preview"
                        style={s.photoPreview}
                        onError={() => setPhotoPreviewError(true)}
                      />
                    )
                    : <span style={{ color: "#7dd3fc", fontSize: "0.88rem" }}>Click to choose a photo</span>
                  }
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                </label>
                {photoPreviewError && (
                  <span style={s.previewError}>Preview failed. Confirm the gallery URL still exists.</span>
                )}
              </div>
            </div>

            <div style={s.galleryTool}>
              <div style={s.formGroup}>
                <label style={s.fieldLabel}>Use Existing Gallery Image URL</label>
                <input
                  style={s.input}
                  placeholder="Paste /uploads/image.JPG or a full gallery image URL"
                  value={galleryPhotoUrl}
                  onChange={(e) => handleGalleryPhotoUrlChange(e.target.value)}
                />
                <span style={s.helperText}>
                  Leave this empty to keep the current photo while editing. Choosing a new file overrides this URL.
                </span>
              </div>

              <div style={s.galleryHeader}>
                <span style={s.fieldLabel}>Gallery Images</span>
                <button type="button" onClick={fetchGalleryImages} style={s.refreshBtn} disabled={galleryLoading}>
                  {galleryLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {galleryLoading ? (
                <p style={s.helperText}>Loading gallery images...</p>
              ) : galleryImages.length === 0 ? (
                <p style={s.helperText}>No gallery images found yet.</p>
              ) : (
                <div style={s.galleryThumbGrid}>
                  {galleryImages.slice(0, 24).map((image) => {
                    const selected = galleryPhotoUrl.trim() === image.url;
                    return (
                      <button
                        key={image.url}
                        type="button"
                        title={image.title}
                        style={{ ...s.galleryThumb, ...(selected ? s.galleryThumbActive : {}) }}
                        onClick={() => selectGalleryImage(image.url)}
                      >
                        <img src={mediaUrl(image.url)} alt={image.title} style={s.galleryThumbImg} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={s.formGroup}>
              <label style={s.fieldLabel}>Bio / Description</label>
              <textarea
                style={{ ...s.input, minHeight: "90px", resize: "vertical", fontFamily: "inherit" }}
                placeholder="Short bio for this minister…"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                maxLength={500}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
              <button type="submit" disabled={saving} style={s.primaryBtn}>
                {saving ? "Saving…" : editingId ? "Update Minister" : "Add Minister"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={s.secondaryBtn}>Cancel</button>
              )}
            </div>
          </form>
        </section>

        {/* Minister List */}
        <section style={s.card}>
          <h2 style={s.sectionTitle}>📋 Current Ministers ({ministers.length})</h2>
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading…</p>
          ) : ministers.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "30px 0" }}>
              No ministers yet. Add one above!
            </p>
          ) : (
            <div style={s.grid}>
              {ministers.map(m => (
                <div key={m._id} style={s.ministerCard}>
                  <div style={s.photoBox}>
                    {m.photoUrl
                      ? (
                        <img
                          src={mediaUrl(m.photoUrl)}
                          alt={m.name}
                          style={s.photo}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = photoPlaceholder(m.name);
                          }}
                        />
                      )
                      : <div style={s.photoPlaceholder}>{m.name.charAt(0)}</div>
                    }
                  </div>
                  <div style={s.cardBody}>
                    <h3 style={s.ministerName}>{m.name}</h3>
                    <p style={s.ministerRole}>{m.role}</p>
                    <p style={{ margin: "4px 0", color: "#7dd3fc", fontSize: "0.76rem", fontWeight: 600 }}>
                      Added: {formatUploadDate(m.createdAt)}
                    </p>
                    {m.bio && <p style={s.ministerBio}>{m.bio}</p>}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button onClick={() => startEdit(m)} style={s.editBtn}>✏️ Edit</button>
                      <button onClick={() => handleDelete(m)} style={s.deleteBtn}>🗑 Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #082f49 0%, #0f172a 45%, #111827 100%)", color: "#eff6ff", padding: "24px", fontFamily: "'Poppins','Segoe UI',sans-serif" },
  wrapper: { maxWidth: "1100px", margin: "0 auto" },
  toast: { position: "fixed", top: "20px", right: "20px", padding: "12px 20px", borderRadius: "10px", color: "#fff", fontWeight: 600, zIndex: 9999, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "28px", flexWrap: "wrap" },
  label: { textTransform: "uppercase", letterSpacing: "2px", color: "#7dd3fc", fontSize: "0.78rem", marginBottom: "4px" },
  h1: { margin: "0 0 6px", fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, color: "#fff" },
  subtitle: { color: "#cbd5e1", marginTop: 0, maxWidth: "700px", fontSize: "0.92rem" },
  backBtn: { textDecoration: "none", color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "10px", padding: "10px 16px", fontWeight: 600, whiteSpace: "nowrap" },
  card: { background: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(125, 211, 252, 0.15)", borderRadius: "20px", padding: "24px", boxShadow: "0 18px 40px rgba(8,47,73,0.35)", marginBottom: "24px" },
  sectionTitle: { margin: "0 0 20px", fontSize: "1.1rem", color: "#e0f2fe", fontWeight: 700 },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "0.82rem", fontWeight: 600, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", background: "rgba(15,23,42,0.7)", border: "1.5px solid rgba(125,211,252,0.2)", borderRadius: "10px", color: "#f8fafc", fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box" },
  photoLabel: { cursor: "pointer", width: "100%", height: "120px", border: "2px dashed rgba(125,211,252,0.4)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(14,165,233,0.05)" },
  photoPreview: { width: "100%", height: "100%", objectFit: "cover" },
  previewError: { color: "#fca5a5", fontSize: "0.78rem", lineHeight: 1.4 },
  helperText: { color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.45, margin: 0 },
  galleryTool: { display: "grid", gap: "12px", padding: "14px", border: "1px solid rgba(125,211,252,0.16)", borderRadius: "14px", background: "rgba(2,6,23,0.22)" },
  galleryHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" },
  refreshBtn: { background: "rgba(14,165,233,0.12)", color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 },
  galleryThumbGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "9px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" },
  galleryThumb: { height: "72px", padding: 0, border: "1px solid rgba(148,163,184,0.22)", borderRadius: "10px", overflow: "hidden", cursor: "pointer", background: "rgba(15,23,42,0.7)" },
  galleryThumbActive: { borderColor: "#fbbf24", boxShadow: "0 0 0 3px rgba(251,191,36,0.2)" },
  galleryThumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  primaryBtn: { background: "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 24px", fontWeight: 700, cursor: "pointer", fontSize: "0.92rem" },
  secondaryBtn: { background: "rgba(15,23,42,0.85)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.25)", borderRadius: "10px", padding: "11px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.92rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" },
  ministerCard: { background: "rgba(30,41,59,0.7)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: "16px", overflow: "hidden" },
  photoBox: { width: "100%", height: "180px", background: "rgba(15,23,42,0.8)", overflow: "hidden" },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", color: "#38bdf8", background: "rgba(14,165,233,0.1)" },
  cardBody: { padding: "16px" },
  ministerName: { margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" },
  ministerRole: { margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px" },
  ministerBio: { margin: "0 0 8px", fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 },
  editBtn: { background: "rgba(14,165,233,0.12)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
  deleteBtn: { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
};
