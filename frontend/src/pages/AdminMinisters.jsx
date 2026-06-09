import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "ministersPhotos";

const defaultMinisters = [
  { name: "Rev. Clinton OKANGA", role: "Senior Pastor", bio: "Rev. Clinton leads Outreach Hope Church with a vision to raise disciples and impact the Sunshine community with hope." },
  { name: "Pastor DAVID NDUNGU", role: "Associate Pastor", bio: "Pastor DAVID oversees discipleship and homecells, encouraging believers to grow in faith and service." },
  { name: "Pastor John Ndirangu", role: "Youth Pastor", bio: "Pastor John leads the youth fellowship, inspiring young people to live boldly for Christ and serve their community." },
];

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

export default function AdminMinisters() {
  const [photos, setPhotos] = useState(defaultMinisters.map(() => ""));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === defaultMinisters.length) {
          setPhotos(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load saved minister photos:", error);
    }
  }, []);

  const hasSavedPhotos = useMemo(() => photos.some(Boolean), [photos]);

  async function handleImageFile(index, file) {
    if (!file || !file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    try {
      const dataUrl = await toDataUrl(file);
      setPhotos(prev => {
        const next = [...prev];
        next[index] = dataUrl;
        return next;
      });
      setMessage("Image added. Click save to store it for the ministers page.");
    } catch (error) {
      setMessage(error.message || "Could not read the selected image.");
    }
  }

  async function handleImageChange(index, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleImageFile(index, file);
  }

  function handleDrop(index, event) {
    event.preventDefault();
    setDraggingIndex(null);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(index, file);
    }
  }

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
      setMessage("Minister photos saved successfully.");
    } catch (error) {
      setMessage("Saving failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPhotos(defaultMinisters.map(() => ""));
    localStorage.removeItem(STORAGE_KEY);
    setMessage("Removed the uploaded minister photos. The public page will fall back to default placeholders.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #082f49 0%, #0f172a 45%, #111827 100%)", color: "#eff6ff", padding: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div>
            <p style={{ textTransform: "uppercase", letterSpacing: "2px", color: "#7dd3fc", fontSize: "0.78rem", marginBottom: "4px" }}>Admin Portal</p>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#fff" }}>Ministers Photo Manager</h1>
            <p style={{ color: "#cbd5e1", marginTop: "6px", maxWidth: "700px" }}>
              Upload the three minister portraits here. These images are stored in the browser for this site and are shown on the public ministers page.
            </p>
          </div>
          <Link to="/admin-dashboard" style={{ textDecoration: "none", color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "10px", padding: "10px 14px", fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>

        <section style={{ background: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(125, 211, 252, 0.15)", borderRadius: "24px", padding: "24px", boxShadow: "0 18px 40px rgba(8, 47, 73, 0.35)", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem", color: "#e0f2fe" }}>Upload minister portraits</h2>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem" }}>Select an image for each minister card on the frontend page.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>{saving ? "Saving…" : "Save Photos"}</button>
              <button onClick={handleReset} style={styles.secondaryBtn}>Reset</button>
            </div>
          </div>

          {message ? <p style={{ color: hasSavedPhotos ? "#86efac" : "#bfdbfe", marginBottom: 0, marginTop: "10px", fontSize: "0.92rem" }}>{message}</p> : null}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          {defaultMinisters.map((minister, index) => (
            <article key={minister.name} style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: "20px", padding: "18px", boxShadow: "0 14px 30px rgba(15, 23, 42, 0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{minister.name}</h3>
                  <p style={{ margin: "4px 0 0", color: "#7dd3fc", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>{minister.role}</p>
                </div>
                <span style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.22)", color: "#bae6fd", borderRadius: "999px", padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700 }}>Photo {index + 1}</span>
              </div>

              <label
                style={{
                  ...styles.imageBox,
                  borderColor: draggingIndex === index ? "rgba(125, 211, 252, 0.9)" : "rgba(125, 211, 252, 0.4)",
                  background: draggingIndex === index
                    ? "linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(30, 41, 59, 0.98))"
                    : "linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(30, 41, 59, 0.95))",
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDraggingIndex(index);
                }}
                onDragLeave={() => setDraggingIndex(null)}
                onDrop={(event) => handleDrop(index, event)}
              >
                {photos[index] ? <img src={photos[index]} alt={minister.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }} /> : <span style={{ color: "#bfdbfe", textAlign: "center", fontWeight: 600, padding: "0 12px" }}>Drag & drop an image here<br />or click to choose</span>}
                <input type="file" accept="image/*" onChange={(event) => handleImageChange(index, event)} style={{ display: "none" }} />
              </label>
              <p style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.5, marginTop: "10px" }}>{minister.bio}</p>
            </article>
          ))}
        </section>
      </div>

      <style>{`
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const styles = {
  primaryBtn: {
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    color: "#fff",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(14, 165, 233, 0.25)",
  },
  secondaryBtn: {
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.85)",
    color: "#e2e8f0",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  imageBox: {
    width: "100%",
    height: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    border: "1px dashed rgba(125, 211, 252, 0.4)",
    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(30, 41, 59, 0.95))",
    cursor: "pointer",
    overflow: "hidden",
  },
};
