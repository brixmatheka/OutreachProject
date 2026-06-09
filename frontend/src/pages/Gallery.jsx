import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL as API } from "../apiConfig";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | image | video
  const [selectedFolder, setSelectedFolder] = useState(null); // stores the currently selected folder object
  const [lightbox, setLightbox] = useState(null); // opened media file item { url, type }

  useEffect(() => {
    axios
      .get(`${API}/api/gallery`)
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter files within the opened folder
  const activeFiles = selectedFolder ? (selectedFolder.files || []) : [];
  const filtered = activeFiles.filter(
    (i) => filter === "all" || i.type === filter
  );

  const openLightbox = useCallback((item) => setLightbox(item), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const navigate = (dir) => {
    const idx = filtered.findIndex((i) => i.url === lightbox.url);
    const next = filtered[idx + dir];
    if (next) setLightbox(next);
  };

  return (
    <div className="gallery-root">
      {/* Header */}
      <header className="gallery-page-header">
        <div className="gallery-header-nav">
          <Link to="/" className="gallery-back-btn">← Back to Home</Link>
          {selectedFolder !== null && (
            <button
              className="gallery-back-folders-btn"
              onClick={() => setSelectedFolder(null)}
            >
              📂 Back to Folders
            </button>
          )}
        </div>
        <div className="gallery-hero-text">
          <h1>{selectedFolder !== null ? selectedFolder.title : "Church Gallery"}</h1>
          <p>
            {selectedFolder !== null 
              ? selectedFolder.description || `Viewing media inside the folder "${selectedFolder.title}"`
              : "Moments of faith, love, and community captured in time"}
          </p>
        </div>

        {selectedFolder !== null && (
          <div className="gallery-filters">
            {["all", "image", "video"].map((f) => (
              <button
                key={f}
                className={`gallery-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "🖼 All" : f === "image" ? "📸 Photos" : "🎬 Videos"}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Grid */}
      <main className="gallery-main">
        {loading ? (
          <div className="gallery-loading">
            <div className="gallery-spinner" />
            <p>Loading gallery…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="gallery-empty">
            <span className="gallery-empty-icon">📷</span>
            <p>No media uploaded yet. Check back soon!</p>
          </div>
        ) : selectedFolder === null ? (
          // Folders Grid View
          <div className="gallery-folders-grid">
            {items.map((folder) => (
              <div
                key={folder._id}
                className="gallery-folder-card"
                onClick={() => {
                  setSelectedFolder(folder);
                  setFilter("all");
                }}
              >
                <div className="gallery-folder-preview-container">
                  {folder.coverUrl && (
                    <img
                      src={`${API}${folder.coverUrl}`}
                      alt={folder.title}
                      className="gallery-folder-preview"
                      loading="lazy"
                    />
                  )}
                  <div className="gallery-folder-badge">📁</div>
                </div>
                <div className="gallery-folder-details">
                  <h3 className="gallery-folder-name">
                    {folder.title}
                  </h3>
                  <p className="gallery-folder-count">
                    {folder.files?.length || 0} {(folder.files?.length || 0) === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="gallery-empty">
            <span className="gallery-empty-icon">📂</span>
            <p>No photos or videos found matching this filter.</p>
          </div>
        ) : (
          // Folder Items Grid View
          <div className="gallery-grid">
            {filtered.map((item, index) => (
              <div
                key={index}
                className="gallery-card"
                onClick={() => openLightbox(item)}
              >
                {item.type === "image" ? (
                  <img
                    src={`${API}${item.url}`}
                    alt="Church photo"
                    className="gallery-thumb"
                    loading="lazy"
                  />
                ) : (
                  <div className="gallery-video-thumb">
                    <video
                      src={`${API}${item.url}`}
                      className="gallery-thumb"
                      muted
                      preload="metadata"
                    />
                    <div className="gallery-play-icon">▶</div>
                  </div>
                )}
                <div className="gallery-card-overlay">
                  <span className="gallery-card-type">
                    {item.type === "image" ? "📸" : "🎬"}
                  </span>
                  <p className="gallery-card-title">
                    {item.url.split("/").pop()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div className="gallery-lightbox" onClick={closeLightbox}>
          <div className="gallery-lb-box" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-lb-close" onClick={closeLightbox}>✕</button>
            {lightbox.type === "image" ? (
              <img
                src={`${API}${lightbox.url}`}
                alt=""
                className="gallery-lb-media"
              />
            ) : (
              <video
                src={`${API}${lightbox.url}`}
                controls
                autoPlay
                className="gallery-lb-media"
              />
            )}
            <div className="gallery-lb-info">
              <h3>{lightbox.url.split("/").pop()}</h3>
              <span className="gallery-lb-date">
                Folder: {selectedFolder.title}
              </span>
            </div>
            <div className="gallery-lb-nav">
              <button
                className="gallery-lb-nav-btn"
                onClick={() => navigate(-1)}
                disabled={filtered.findIndex((i) => i.url === lightbox.url) === 0}
              >
                ‹ Prev
              </button>
              <button
                className="gallery-lb-nav-btn"
                onClick={() => navigate(1)}
                disabled={
                  filtered.findIndex((i) => i.url === lightbox.url) ===
                  filtered.length - 1
                }
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Self-contained responsive folder styles */
        .gallery-header-nav {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .gallery-back-folders-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f1f5f9;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .gallery-back-folders-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .gallery-folders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 24px;
          padding: 10px 0;
        }

        .gallery-folder-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .gallery-folder-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(30, 41, 59, 0.6);
        }

        .gallery-folder-preview-container {
          position: relative;
          height: 160px;
          background: rgba(15, 23, 42, 0.6);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gallery-folder-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .gallery-folder-card:hover .gallery-folder-preview {
          transform: scale(1.05);
        }

        .gallery-folder-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          color: #f1f5f9;
        }

        .gallery-folder-details {
          padding: 18px;
        }

        .gallery-folder-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .gallery-folder-count {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
