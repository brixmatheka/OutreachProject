import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL as API } from "../apiConfig";

// ─── Helper: always read token fresh from localStorage ───────────────────────
function getAdminToken() {
  return localStorage.getItem("token") || localStorage.getItem("adminToken") || null;
}

export default function AdminGallery() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [folderName, setFolderName]  = useState("");
  const [files, setFiles]            = useState([]);
  const [previews, setPreviews]      = useState([]);
  const fileRef   = useRef(null);
  const folderRef = useRef(null);

  // Folder navigation
  const [openFolder, setOpenFolder] = useState(null); // null = list view
  const [filter, setFilter]         = useState("all");

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Fetch all folders from server ───────────────────────────────────────────
  async function fetchGallery() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/gallery`);
      setItems(res.data);
    } catch {
      showToast("Failed to load gallery.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGallery();
  }, []);

  // ── File change (individual files) ──────────────────────────────────────────
  function handleFileChange(e) {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    })));
    if (!folderName.trim()) {
      setFolderName(`Upload - ${new Date().toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}`);
    }
  }

  // ── Folder change (webkitdirectory) ─────────────────────────────────────────
  function handleFolderChange(e) {
    const selected = Array.from(e.target.files).filter(
      f => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (selected.length === 0) {
      showToast("No images or videos found in the selected folder.", "error");
      return;
    }
    setFiles(selected);
    const first = selected[0];
    if (first?.webkitRelativePath) {
      const parts = first.webkitRelativePath.split("/");
      if (parts[0]) setFolderName(parts[0]);
    }
    setPreviews(selected.slice(0, 10).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    })));
    showToast(`Loaded ${selected.length} file(s). Ready to upload!`);
  }

  // ── Upload handler ───────────────────────────────────────────────────────────
  async function handleUpload(e) {
    e.preventDefault();
    if (files.length === 0) {
      showToast("Please select at least one file.", "error");
      return;
    }
    const token = getAdminToken();
    if (!token) {
      showToast("Not authenticated. Please log in as admin.", "error");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append("media", f));
    fd.append("title", title);
    fd.append("description", description);
    fd.append("folder", folderName.trim() || `Upload - ${new Date().toLocaleDateString("en-KE")}`);
    try {
      await axios.post(`${API}/api/gallery/upload`, fd, {
        headers: { Authorization: token, "Content-Type": "multipart/form-data" },
      });
      showToast(`Folder "${folderName}" uploaded successfully! 🎉`);
      setFiles([]); setPreviews([]); setTitle(""); setDescription(""); setFolderName("");
      if (fileRef.current)   fileRef.current.value   = "";
      if (folderRef.current) folderRef.current.value = "";
      fetchGallery();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  // ── DELETE FOLDER ────────────────────────────────────────────────────────────
  async function handleDeleteFolder(folderId, folderTitle) {
    if (!window.confirm(`Delete folder "${folderTitle}" and all its contents?`)) return;

    // Read token fresh right now
    const token = getAdminToken();
    if (!token) {
      showToast("No admin token found. Please log in again.", "error");
      window.location.href = "/admin-login";
      return;
    }

    setDeletingId(folderId);

    try {
      await axios.delete(`${API}/api/gallery/${folderId}`, {
        headers: { Authorization: token },
      });

      // Close open folder view if we just deleted it
      if (openFolder && openFolder._id === folderId) {
        setOpenFolder(null);
      }

      // Remove from local state immediately
      setItems(prev => prev.filter(i => i._id !== folderId));

      showToast(`Folder "${folderTitle}" deleted.`);

      // Sync with server
      fetchGallery();

    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || err.message || "Delete failed.";

      if (status === 401 || status === 403) {
        showToast("Session expired — please log in again.", "error");
        setTimeout(() => { window.location.href = "/admin-login"; }, 1500);
      } else if (status === 404) {
        showToast("Folder not found — it may have already been deleted.", "error");
        setItems(prev => prev.filter(i => i._id !== folderId));
      } else {
        showToast(message, "error");
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ── Filtered files in open folder ────────────────────────────────────────────
  const visibleFiles = openFolder
    ? (openFolder.files || []).filter(f => filter === "all" || f.type === filter)
    : [];

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ag-root">

      {/* ── Toast ── */}
      {toast && (
        <div className={`ag-toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="ag-sidebar">
        <div className="ag-sidebar-brand">
          <span className="ag-sidebar-icon">🏛</span>
          <span>Church Gallery</span>
        </div>
        <nav className="ag-sidebar-nav">
          <Link to="/admin-dashboard"     className="ag-sidebar-link">📊 Dashboard</Link>
          <Link to="/admin/gallery"       className="ag-sidebar-link active">🖼 Gallery</Link>
          <Link to="/admin/events"        className="ag-sidebar-link">📅 Events</Link>
          <Link to="/admin/members"       className="ag-sidebar-link">👥 Members</Link>
          <Link to="/admin/transactions"  className="ag-sidebar-link">💰 Transactions</Link>
          <Link to="/admin/prayer-requests" className="ag-sidebar-link">🙏 Prayers</Link>
          <Link to="/admin/baptism"       className="ag-sidebar-link">💧 Baptism</Link>
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="ag-main">

        {/* Header */}
        <header className="ag-header">
          <div>
            <h1 className="ag-title">Church Gallery Management</h1>
            <p className="ag-subtitle">Upload and manage church photos &amp; videos as folders</p>
          </div>
          <div className="ag-header-stats">
            <div className="ag-stat">
              <span className="ag-stat-num">{items.length}</span>
              <span className="ag-stat-label">Folders</span>
            </div>
            <div className="ag-stat">
              <span className="ag-stat-num">
                {items.reduce((acc, f) => acc + (f.files?.length || 0), 0)}
              </span>
              <span className="ag-stat-label">Total Files</span>
            </div>
          </div>
        </header>

        {/* ── Upload Form ── */}
        <section className="ag-upload-section">
          <h2 className="ag-section-title">📤 Upload New Folder</h2>
          <form className="ag-upload-form" onSubmit={handleUpload}>
            <div className="ag-form-row">
              <div className="ag-form-group">
                <label className="ag-label">Folder Name</label>
                <input
                  className="ag-input"
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="e.g. Youth Seminar, Sunday Service"
                  maxLength={100}
                />
              </div>
              <div className="ag-form-group">
                <label className="ag-label">Description (optional)</label>
                <input
                  className="ag-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this folder…"
                  maxLength={300}
                />
              </div>
            </div>

            <div className="ag-drop-options">
              <div className="ag-drop-zone" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*"
                  style={{ display: "none" }} onChange={handleFileChange} />
                <span className="ag-drop-icon">🖼️</span>
                <p className="ag-drop-text">Choose Photos/Videos<br /><small>Select individual files</small></p>
              </div>
              <div className="ag-drop-zone folder-zone" onClick={() => folderRef.current?.click()}>
                <input ref={folderRef} type="file" webkitdirectory="true" directory="true" multiple
                  style={{ display: "none" }} onChange={handleFolderChange} />
                <span className="ag-drop-icon">📁</span>
                <p className="ag-drop-text">Choose a Folder<br /><small>Uploads folder &amp; auto-tags name</small></p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="ag-previews">
                {previews.map((p, i) => (
                  <div key={i} className="ag-preview-item">
                    {p.type === "image"
                      ? <img src={p.url} alt={p.name} className="ag-preview-thumb" />
                      : <video src={p.url} className="ag-preview-thumb" muted />}
                    <span className="ag-preview-name">{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="ag-upload-btn" disabled={uploading || files.length === 0}>
              {uploading ? "Uploading Folder…" : `Upload ${files.length > 0 ? `${files.length} file(s) as Folder` : "Media Folder"}`}
            </button>
          </form>
        </section>

        {/* ── Gallery Section ── */}
        <section className="ag-gallery-section">

          {openFolder === null ? (
            /* ── Folder list view ── */
            <>
              <div className="ag-gallery-header">
                <h2 className="ag-section-title">📁 Media Folders</h2>
              </div>

              {loading ? (
                <div className="ag-loading">
                  <div className="ag-spinner" />
                  <p>Loading folders…</p>
                </div>
              ) : items.length === 0 ? (
                <div className="ag-empty">
                  <span>📭</span>
                  <p>No folders found. Upload one above!</p>
                </div>
              ) : (
                <div className="ag-folders-grid">
                  {items.map(folderItem => (
                    <div key={folderItem._id} className="ag-folder-card">

                      {/* Clickable top area → open folder */}
                      <div
                        className="ag-folder-clickable-area"
                        onClick={() => { setOpenFolder(folderItem); setFilter("all"); }}
                      >
                        <div className="ag-folder-preview-container">
                          {folderItem.coverUrl && (
                            <img
                              src={`${API}${folderItem.coverUrl}`}
                              alt={folderItem.title}
                              className="ag-folder-preview"
                            />
                          )}
                          <div className="ag-folder-overlay-badge">📁</div>
                        </div>
                        <div className="ag-folder-details">
                          <h3 className="ag-folder-name">{folderItem.title}</h3>
                          <p className="ag-folder-meta">
                            {folderItem.files?.length || 0}{" "}
                            {(folderItem.files?.length || 0) === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>

                      {/* Delete button — separate from clickable area */}
                      <div className="ag-folder-actions">
                        <button
                          type="button"
                          className="ag-delete-folder-btn"
                          disabled={deletingId === folderItem._id}
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteFolder(folderItem._id, folderItem.title);
                          }}
                        >
                          {deletingId === folderItem._id ? "Deleting…" : "🗑 Delete Folder"}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ── Inside folder view ── */
            <>
              <div className="ag-gallery-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button className="ag-back-folders-btn" onClick={() => setOpenFolder(null)}>
                    ← Back to Folders
                  </button>
                  <h2 className="ag-section-title" style={{ margin: 0 }}>
                    📁 {openFolder.title}
                  </h2>
                </div>
                <div className="ag-filter-tabs">
                  {["all", "image", "video"].map(f => (
                    <button
                      key={f}
                      className={`ag-filter-tab ${filter === f ? "active" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "All" : f === "image" ? "📸 Photos" : "🎬 Videos"}
                    </button>
                  ))}
                </div>
              </div>

              {openFolder.description && (
                <p style={{ color: "#9ca3af", margin: "-10px 0 20px 0", fontSize: "0.9rem" }}>
                  {openFolder.description}
                </p>
              )}

              {visibleFiles.length === 0 ? (
                <div className="ag-empty"><span>📭</span><p>No media found matching filter.</p></div>
              ) : (
                <div className="ag-grid">
                  {visibleFiles.map((file, idx) => (
                    <div key={idx} className="ag-item">
                      {file.type === "image" ? (
                        <img src={`${API}${file.url}`} alt="" className="ag-item-thumb" />
                      ) : (
                        <div className="ag-item-video-wrap">
                          <video src={`${API}${file.url}`} className="ag-item-thumb" muted preload="metadata" />
                          <span className="ag-item-play">▶</span>
                        </div>
                      )}
                      <div className="ag-item-info" style={{ justifyContent: "center" }}>
                        <span className="ag-item-badge">{file.type === "image" ? "📸" : "🎬"}</span>
                        <div className="ag-item-meta">
                          <p className="ag-item-title" style={{ wordBreak: "break-all" }}>
                            {file.url.split("/").pop()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </section>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        .ag-folders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
          margin-top: 20px;
        }
        .ag-folder-card {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ag-folder-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.35);
          border-color: #374151;
        }
        .ag-folder-clickable-area {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .ag-folder-preview-container {
          position: relative;
          height: 150px;
          background: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .ag-folder-preview {
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.85;
        }
        .ag-folder-overlay-badge {
          position: absolute;
          top: 10px; left: 10px;
          background: rgba(17,24,39,0.8);
          border: 1px solid rgba(255,255,255,0.1);
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
        }
        .ag-folder-details {
          padding: 14px;
          flex-grow: 1;
        }
        .ag-folder-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f3f4f6;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ag-folder-meta {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
        }
        .ag-folder-actions {
          padding: 10px 14px;
          border-top: 1px solid #1f2937;
          background: #0f172a;
        }
        .ag-delete-folder-btn {
          width: 100%;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .ag-delete-folder-btn:hover:not(:disabled) {
          background: #ef4444;
          border-color: #ef4444;
          color: #fff;
        }
        .ag-delete-folder-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ag-back-folders-btn {
          background: #1f2937;
          border: 1px solid #374151;
          color: #d1d5db;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.2s, color 0.2s;
        }
        .ag-back-folders-btn:hover {
          background: #374151;
          color: #fff;
        }
        .ag-drop-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .ag-drop-options { grid-template-columns: 1fr; }
        }
        .folder-zone {
          border-color: rgba(59,130,246,0.4);
          background: rgba(59,130,246,0.02);
        }
        .folder-zone:hover {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.05);
        }
      `}</style>
    </div>
  );
}
