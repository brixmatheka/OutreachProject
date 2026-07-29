import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL as API } from "../apiConfig";
import { downloadCsvReport, downloadPdfReport, downloadWordReport, formatReportDate } from "../adminReports";

const formatUploadDate = (value) => value
  ? new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
  : "Date unavailable";

function getAdminToken() {
  return localStorage.getItem("token") || localStorage.getItem("adminToken") || null;
}

const defaultForm = { name: "", role: "", bio: "", order: 0 };

function extractGalleryImages(payload) {
  const seen = new Set();
  const images = [];

  (payload || []).forEach((folder) => {
    (folder.files || [])
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

  return images;
}

function photoKey(value) {
  const photo = String(value || "").trim();
  if (!photo) return "";
  try {
    return new URL(photo, API).pathname.toLowerCase();
  } catch {
    return photo.toLowerCase();
  }
}

function sortMinistryRoster(roster) {
  return [...roster].sort((left, right) => {
    const orderDifference = (Number(left.order) || 0) - (Number(right.order) || 0);
    if (orderDifference !== 0) return orderDifference;
    return String(left.createdAt || "").localeCompare(String(right.createdAt || ""));
  });
}

export default function AdminMinisters() {
  const [ministers, setMinisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [busyActions, setBusyActions] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);
  const toastTimerRef = useRef(null);

  // Add / Edit form
  const [form, setForm] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [galleryPhotoUrl, setGalleryPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add mode

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function showToast(msg, type = "success") {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  }

  const fetchMinisters = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(`${API}/api/ministers`);
      setMinisters(Array.isArray(res.data) ? res.data : []);
      return true;
    } catch (error) {
      setLoadError(error.response?.data?.message || "Failed to load the ministry-team roster.");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchGalleryImages = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setGalleryLoading(true);
    setGalleryError("");
    try {
      const res = await axios.get(`${API}/api/gallery`);
      setGalleryImages(extractGalleryImages(res.data));
      return true;
    } catch (error) {
      setGalleryError(error.response?.data?.message || "Failed to load gallery images.");
      return false;
    } finally {
      if (showLoading) setGalleryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMinisters();
    fetchGalleryImages();
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [fetchGalleryImages, fetchMinisters]);

  const roles = useMemo(
    () => [...new Set(ministers.map((minister) => minister.role).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [ministers]
  );

  const filteredMinisters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ministers.filter((minister) => {
      const matchesSearch = !query || [minister.name, minister.role, minister.bio]
        .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesRole = roleFilter === "All" || minister.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [ministers, roleFilter, searchQuery]);

  const galleryPhotoKeys = useMemo(
    () => new Set(galleryImages.map((image) => photoKey(image.url))),
    [galleryImages]
  );

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
    setFormError("");
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
    setFormError("");
  }

  function getPhotoSource(minister) {
    if (!minister.photoUrl) return "No photo";
    if (galleryPhotoKeys.has(photoKey(minister.photoUrl))) return "Gallery image";
    return "Uploaded / stored image";
  }

  function getReportFilters() {
    return {
      Search: searchQuery.trim() || "All ministers",
      "Active role": roleFilter === "All" ? "All roles" : roleFilter,
    };
  }

  function getReportSummary() {
    return {
      "Roster total": filteredMinisters.length,
      "Roles represented": new Set(filteredMinisters.map((minister) => minister.role).filter(Boolean)).size,
      "With photos": filteredMinisters.filter((minister) => minister.photoUrl).length,
      "Gallery photos": filteredMinisters.filter(
        (minister) => minister.photoUrl && galleryPhotoKeys.has(photoKey(minister.photoUrl))
      ).length,
      "Without photos": filteredMinisters.filter((minister) => !minister.photoUrl).length,
    };
  }

  function reportRows() {
    return filteredMinisters.map((minister, index) => ({
      ...minister,
      rosterPosition: index + 1,
      photoSource: getPhotoSource(minister),
    }));
  }

  function downloadMinistersCsv() {
    if (filteredMinisters.length === 0) {
      setActionFeedback({ type: "error", message: "No ministers match the selected report filters." });
      return;
    }

    downloadCsvReport({
      title: "Ministry Team Roster",
      filters: getReportFilters(),
      headers: [
        "Roster Position",
        "Name",
        "Role",
        "Display Order",
        "Photo Source",
        "Photo Reference",
        "Created / Uploaded",
        "Biography",
      ],
      rows: reportRows().map((minister) => [
        minister.rosterPosition,
        minister.name || "",
        minister.role || "",
        Number(minister.order) || 0,
        minister.photoSource,
        minister.photoUrl || "",
        formatReportDate(minister.createdAt, true),
        minister.bio || "",
      ]),
      summary: getReportSummary(),
    });
  }

  function getMinistersDocument() {
    return {
      title: "Ministry Team Roster",
      subtitle: "Official ministry roles, display order, photo records, and roster dates",
      filters: getReportFilters(),
      summary: getReportSummary(),
      columns: [
        { label: "#", value: "rosterPosition" },
        { label: "Name", value: (minister) => minister.name || "—" },
        { label: "Role", value: (minister) => minister.role || "—" },
        { label: "Order", value: (minister) => Number(minister.order) || 0 },
        { label: "Photo source", value: "photoSource" },
        { label: "Photo reference", value: (minister) => minister.photoUrl || "—" },
        { label: "Created / uploaded", value: (minister) => formatReportDate(minister.createdAt, true) },
        { label: "Biography", value: (minister) => minister.bio || "—" },
      ],
      rows: reportRows(),
    };
  }

  function downloadMinistersWord() {
    if (filteredMinisters.length === 0) {
      setActionFeedback({ type: "error", message: "No ministers match the selected report filters." });
      return;
    }
    downloadWordReport(getMinistersDocument());
  }

  function downloadMinistersPdf() {
    if (filteredMinisters.length === 0) {
      setActionFeedback({ type: "error", message: "No ministers match the selected report filters." });
      return;
    }
    downloadPdfReport(getMinistersDocument());
  }

  function setActionBusy(ministerId, action) {
    setBusyActions((current) => ({ ...current, [ministerId]: action }));
  }

  function clearActionBusy(ministerId) {
    setBusyActions((current) => {
      const next = { ...current };
      delete next[ministerId];
      return next;
    });
  }

  // ── Save (create or update) ──────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      setFormError("Name and role are required.");
      showToast("Name and role are required.", "error");
      return;
    }
    const token = getAdminToken();
    if (!token) {
      setFormError("Your admin session is unavailable. Sign in again before saving.");
      showToast("Not authenticated.", "error");
      return;
    }

    setSaving(true);
    setFormError("");
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("role", form.role.trim());
    fd.append("bio", form.bio.trim());
    fd.append("order", form.order);
    if (photoFile) fd.append("photo", photoFile);
    if (!photoFile && galleryPhotoUrl.trim()) fd.append("photoUrl", galleryPhotoUrl.trim());

    try {
      let savedMinister;
      if (editingId) {
        const response = await axios.put(`${API}/api/ministers/${editingId}`, fd, {
          headers: { Authorization: token, "Content-Type": "multipart/form-data" },
        });
        savedMinister = response.data;
        showToast("Minister updated successfully!");
      } else {
        const response = await axios.post(`${API}/api/ministers`, fd, {
          headers: { Authorization: token, "Content-Type": "multipart/form-data" },
        });
        savedMinister = response.data;
        showToast("Minister added successfully!");
      }
      setMinisters((current) => sortMinistryRoster(
        editingId
          ? current.map((minister) => minister._id === savedMinister._id ? savedMinister : minister)
          : [...current, savedMinister]
      ));
      cancelEdit();
    } catch (err) {
      const message = err.response?.data?.message || "Save failed. Please check the form and retry.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(minister) {
    if (!window.confirm(`Delete ${minister.name}? This cannot be undone.`)) return;
    const token = getAdminToken();
    if (!token) {
      setActionFeedback({
        type: "error",
        message: "Your admin session is unavailable. Sign in again before deleting a minister.",
      });
      return;
    }

    if (busyActions[minister._id]) return;
    setActionBusy(minister._id, "delete");
    setActionFeedback(null);
    try {
      await axios.delete(`${API}/api/ministers/${minister._id}`, {
        headers: { Authorization: token },
      });
      setMinisters((current) => current.filter((item) => item._id !== minister._id));
      if (editingId === minister._id) cancelEdit();
      showToast(`${minister.name} deleted.`);
      setActionFeedback({ type: "success", message: `${minister.name} was removed from the ministry roster.` });
    } catch (err) {
      const message = err.response?.data?.message || `Could not delete ${minister.name}. Please retry.`;
      setActionFeedback({ id: minister._id, type: "error", message });
      showToast(message, "error");
    } finally {
      clearActionBusy(minister._id);
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div
          role={toast.type === "success" ? "status" : "alert"}
          aria-live="polite"
          style={{ ...s.toast, background: toast.type === "success" ? "#065f46" : "#7f1d1d" }}
        >
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
                <label htmlFor="minister-name" style={s.fieldLabel}>Full Name *</label>
                <input
                  id="minister-name"
                  style={s.input}
                  placeholder="e.g. Rev. Clinton OKANGA"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>
              <div style={s.formGroup}>
                <label htmlFor="minister-role" style={s.fieldLabel}>Role / Title *</label>
                <input
                  id="minister-role"
                  style={s.input}
                  placeholder="e.g. Senior Pastor"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  maxLength={100}
                  required
                />
              </div>
              <div style={s.formGroup}>
                <label htmlFor="minister-order" style={s.fieldLabel}>Display Order</label>
                <input
                  id="minister-order"
                  style={s.input}
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                />
              </div>
              <div style={s.formGroup}>
                <span style={s.fieldLabel}>Photo</span>
                <label style={s.photoLabel}>
                  {photoPreview && !photoPreviewError
                    ? (
                      <img
                        src={photoPreview}
                        alt={`${form.name || "Minister"} photo preview`}
                        style={s.photoPreview}
                        onError={() => setPhotoPreviewError(true)}
                      />
                    )
                    : <span style={{ color: "#7dd3fc", fontSize: "0.88rem" }}>Click to choose a photo</span>
                  }
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} aria-label="Choose minister photo" />
                </label>
                {photoPreviewError && (
                  <span style={s.previewError}>Preview failed. Confirm the gallery URL still exists.</span>
                )}
              </div>
            </div>

            <div style={s.galleryTool}>
              <div style={s.formGroup}>
                <label htmlFor="minister-gallery-url" style={s.fieldLabel}>Use Existing Gallery Image URL</label>
                <input
                  id="minister-gallery-url"
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
                <button type="button" onClick={() => fetchGalleryImages()} style={s.refreshBtn} disabled={galleryLoading}>
                  {galleryLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {galleryError && (
                <div role="alert" style={s.inlineError}>
                  <span>{galleryError}</span>
                  <button
                    type="button"
                    onClick={() => fetchGalleryImages()}
                    style={s.inlineRetryBtn}
                    disabled={galleryLoading}
                  >
                    {galleryLoading ? "Retrying…" : "Retry"}
                  </button>
                </div>
              )}

              {galleryLoading && galleryImages.length === 0 ? (
                <p style={s.helperText} role="status">Loading gallery images...</p>
              ) : galleryError && galleryImages.length === 0 ? (
                <p style={s.helperText}>You can still upload a new photo while the gallery is unavailable.</p>
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
                        aria-label={`Use ${image.title}`}
                        aria-pressed={selected}
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
              <label htmlFor="minister-bio" style={s.fieldLabel}>Bio / Description</label>
              <textarea
                id="minister-bio"
                style={{ ...s.input, minHeight: "90px", resize: "vertical", fontFamily: "inherit" }}
                placeholder="Short bio for this minister…"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                maxLength={500}
              />
            </div>

            {formError && <div role="alert" style={s.formError}>{formError}</div>}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                style={{ ...s.primaryBtn, opacity: saving ? 0.62 : 1, cursor: saving ? "wait" : "pointer" }}
              >
                {saving ? "Saving…" : editingId ? "Update Minister" : "Add Minister"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={s.secondaryBtn} disabled={saving}>Cancel</button>
              )}
            </div>
          </form>
        </section>

        {/* Minister List */}
        <section style={s.card}>
          <h2 style={s.sectionTitle}>📋 Current Ministers ({ministers.length})</h2>
          <div style={s.rosterToolbar}>
            <div style={s.filterGrid}>
              <label style={s.filterGroup}>
                <span style={s.fieldLabel}>Search roster</span>
                <input
                  type="search"
                  style={s.input}
                  placeholder="Search name, role, or biography"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <label style={s.filterGroup}>
                <span style={s.fieldLabel}>Active role</span>
                <select
                  style={s.input}
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="All">All active roles</option>
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
            </div>
            <div style={s.toolbarFooter}>
              <span style={s.resultCount}>
                {loading && ministers.length > 0 ? "Refreshing · " : ""}
                Showing {filteredMinisters.length} of {ministers.length}
              </span>
              <div style={s.reportActions}>
                <button
                  type="button"
                  onClick={downloadMinistersPdf}
                  disabled={filteredMinisters.length === 0}
                  style={{ ...s.wordBtn, background: "linear-gradient(135deg,#be123c,#e11d48)", opacity: filteredMinisters.length === 0 ? 0.55 : 1 }}
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={downloadMinistersCsv}
                  disabled={filteredMinisters.length === 0}
                  style={{ ...s.csvBtn, opacity: filteredMinisters.length === 0 ? 0.55 : 1 }}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={downloadMinistersWord}
                  disabled={filteredMinisters.length === 0}
                  style={{ ...s.wordBtn, opacity: filteredMinisters.length === 0 ? 0.55 : 1 }}
                >
                  Export Word Roster
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("All");
                  }}
                  style={s.secondaryBtn}
                >
                  Reset filters
                </button>
              </div>
            </div>
          </div>

          {actionFeedback && (
            <div
              role={actionFeedback.type === "error" ? "alert" : "status"}
              style={{
                ...s.feedback,
                borderColor: actionFeedback.type === "error"
                  ? "rgba(248,113,113,0.35)"
                  : "rgba(74,222,128,0.35)",
                color: actionFeedback.type === "error" ? "#fecaca" : "#bbf7d0",
              }}
            >
              <span>{actionFeedback.message}</span>
              <button type="button" onClick={() => setActionFeedback(null)} style={s.dismissBtn}>
                Dismiss
              </button>
            </div>
          )}

          {loadError && (
            <div role="alert" style={{ ...s.feedback, borderColor: "rgba(248,113,113,0.35)", color: "#fecaca" }}>
              <span>
                {loadError}{ministers.length > 0 ? " The last loaded roster remains visible." : ""}
              </span>
              <button
                type="button"
                onClick={() => fetchMinisters()}
                style={s.inlineRetryBtn}
                disabled={loading}
              >
                {loading ? "Retrying…" : "Retry roster"}
              </button>
            </div>
          )}

          {loading && ministers.length === 0 ? (
            <p style={{ color: "#94a3b8" }} role="status">Loading the ministry roster…</p>
          ) : loadError && ministers.length === 0 ? null : ministers.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "30px 0" }}>
              No ministers yet. Add one above!
            </p>
          ) : filteredMinisters.length === 0 ? (
            <div style={s.emptyState}>
              <p style={{ margin: "0 0 12px" }}>No ministers match the current search and role filter.</p>
              <button
                type="button"
                style={s.inlineRetryBtn}
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("All");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div style={s.grid}>
              {filteredMinisters.map(m => (
                <article key={m._id} style={s.ministerCard} aria-busy={Boolean(busyActions[m._id])}>
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
                    <p style={s.orderText}>Display order: {Number(m.order) || 0} · {getPhotoSource(m)}</p>
                    <p style={{ margin: "4px 0", color: "#7dd3fc", fontSize: "0.76rem", fontWeight: 600 }}>
                      Added: {formatUploadDate(m.createdAt)}
                    </p>
                    {m.bio && <p style={s.ministerBio}>{m.bio}</p>}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        style={{ ...s.editBtn, opacity: busyActions[m._id] ? 0.55 : 1 }}
                        disabled={Boolean(busyActions[m._id])}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
                        style={{ ...s.deleteBtn, opacity: busyActions[m._id] ? 0.55 : 1 }}
                        disabled={Boolean(busyActions[m._id])}
                      >
                        {busyActions[m._id] === "delete" ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
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
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #082f49 0%, #0f172a 45%, #111827 100%)", color: "#eff6ff", padding: "clamp(14px, 3vw, 24px)", fontFamily: "'Poppins','Segoe UI',sans-serif" },
  wrapper: { maxWidth: "1100px", margin: "0 auto" },
  toast: { position: "fixed", top: "20px", right: "clamp(12px, 3vw, 20px)", maxWidth: "calc(100vw - 24px)", padding: "12px 20px", borderRadius: "10px", color: "#fff", fontWeight: 600, zIndex: 9999, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "28px", flexWrap: "wrap" },
  label: { textTransform: "uppercase", letterSpacing: "2px", color: "#7dd3fc", fontSize: "0.78rem", marginBottom: "4px" },
  h1: { margin: "0 0 6px", fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, color: "#fff" },
  subtitle: { color: "#cbd5e1", marginTop: 0, maxWidth: "700px", fontSize: "0.92rem" },
  backBtn: { textDecoration: "none", color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "10px", padding: "10px 16px", fontWeight: 600, whiteSpace: "nowrap" },
  card: { background: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(125, 211, 252, 0.15)", borderRadius: "20px", padding: "clamp(16px, 3vw, 24px)", boxShadow: "0 18px 40px rgba(8,47,73,0.35)", marginBottom: "24px" },
  sectionTitle: { margin: "0 0 20px", fontSize: "1.1rem", color: "#e0f2fe", fontWeight: 700 },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "14px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "0.82rem", fontWeight: 600, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", background: "rgba(15,23,42,0.7)", border: "1.5px solid rgba(125,211,252,0.2)", borderRadius: "10px", color: "#f8fafc", fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box" },
  photoLabel: { cursor: "pointer", width: "100%", height: "120px", border: "2px dashed rgba(125,211,252,0.4)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(14,165,233,0.05)" },
  photoPreview: { width: "100%", height: "100%", objectFit: "cover" },
  previewError: { color: "#fca5a5", fontSize: "0.78rem", lineHeight: 1.4 },
  formError: { padding: "10px 12px", color: "#fecaca", background: "rgba(127,29,29,0.24)", border: "1px solid rgba(248,113,113,0.28)", borderRadius: "9px", fontSize: "0.84rem" },
  helperText: { color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.45, margin: 0 },
  inlineError: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", padding: "10px 12px", color: "#fecaca", background: "rgba(127,29,29,0.2)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "9px", fontSize: "0.8rem" },
  inlineRetryBtn: { background: "rgba(14,165,233,0.14)", color: "#bae6fd", border: "1px solid rgba(56,189,248,0.28)", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 },
  galleryTool: { display: "grid", gap: "12px", padding: "14px", border: "1px solid rgba(125,211,252,0.16)", borderRadius: "14px", background: "rgba(2,6,23,0.22)" },
  galleryHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" },
  refreshBtn: { background: "rgba(14,165,233,0.12)", color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 },
  galleryThumbGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "9px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" },
  galleryThumb: { height: "72px", padding: 0, border: "1px solid rgba(148,163,184,0.22)", borderRadius: "10px", overflow: "hidden", cursor: "pointer", background: "rgba(15,23,42,0.7)" },
  galleryThumbActive: { borderColor: "#fbbf24", boxShadow: "0 0 0 3px rgba(251,191,36,0.2)" },
  galleryThumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  primaryBtn: { background: "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 24px", fontWeight: 700, cursor: "pointer", fontSize: "0.92rem" },
  secondaryBtn: { background: "rgba(15,23,42,0.85)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.25)", borderRadius: "10px", padding: "11px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.92rem" },
  rosterToolbar: { display: "grid", gap: "12px", padding: "16px", marginBottom: "16px", background: "rgba(2,6,23,0.3)", border: "1px solid rgba(125,211,252,0.12)", borderRadius: "14px" },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "12px" },
  filterGroup: { display: "grid", gap: "6px" },
  toolbarFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" },
  resultCount: { color: "#7dd3fc", fontSize: "0.8rem", fontWeight: 700 },
  reportActions: { display: "flex", flexWrap: "wrap", gap: "8px" },
  csvBtn: { background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", border: "none", borderRadius: "9px", padding: "9px 14px", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" },
  wordBtn: { background: "linear-gradient(135deg, #0369a1, #0ea5e9)", color: "#fff", border: "none", borderRadius: "9px", padding: "9px 14px", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" },
  feedback: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "12px 14px", marginBottom: "14px", background: "rgba(15,23,42,0.7)", border: "1px solid", borderRadius: "10px", fontSize: "0.84rem" },
  dismissBtn: { background: "rgba(255,255,255,0.08)", color: "inherit", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "7px", padding: "5px 9px", cursor: "pointer", fontWeight: 700 },
  emptyState: { color: "#94a3b8", textAlign: "center", padding: "30px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "18px" },
  ministerCard: { background: "rgba(30,41,59,0.7)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: "16px", overflow: "hidden" },
  photoBox: { width: "100%", height: "180px", background: "rgba(15,23,42,0.8)", overflow: "hidden" },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", color: "#38bdf8", background: "rgba(14,165,233,0.1)" },
  cardBody: { padding: "16px" },
  ministerName: { margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" },
  ministerRole: { margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px" },
  orderText: { margin: "0 0 6px", color: "#94a3b8", fontSize: "0.74rem" },
  ministerBio: { margin: "0 0 8px", fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 },
  editBtn: { background: "rgba(14,165,233,0.12)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
  deleteBtn: { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
};
