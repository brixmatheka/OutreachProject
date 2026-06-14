import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL as API } from "../apiConfig";

function getAdminToken() {
  return localStorage.getItem("token") || localStorage.getItem("adminToken") || null;
}

const defaultForm = { name: "", role: "", bio: "", order: 0 };

export default function AdminMinisters() {
  const [ministers, setMinisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Add / Edit form
  const [form, setForm] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
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

  useEffect(() => { fetchMinisters(); }, []);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function startEdit(minister) {
    setEditingId(minister._id);
    setForm({
      name: minister.name,
      role: minister.role,
      bio: minister.bio || "",
      order: minister.order ?? 0,
    });
    setPhotoPreview(minister.photoUrl ? `${API}${minister.photoUrl}` : "");
    setPhotoFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
    setPhotoFile(null);
    setPhotoPreview("");
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
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={s.photoPreview} />
                    : <span style={{ color: "#7dd3fc", fontSize: "0.88rem" }}>Click to choose a photo</span>
                  }
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                </label>
              </div>
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
                      ? <img src={`${API}${m.photoUrl}`} alt={m.name} style={s.photo} />
                      : <div style={s.photoPlaceholder}>{m.name.charAt(0)}</div>
                    }
                  </div>
                  <div style={s.cardBody}>
                    <h3 style={s.ministerName}>{m.name}</h3>
                    <p style={s.ministerRole}>{m.role}</p>
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
