import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const styles = {
  page: {
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #e0f7ff 0%, #bae6fd 40%, #e0f2fe 100%)",
    minHeight: "100vh",
  },
  header: {
    background: "linear-gradient(90deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)",
    padding: "0 32px", height: "68px", display: "flex", alignItems: "center",
    justifyContent: "space-between", boxShadow: "0 4px 24px rgba(3,105,161,0.35)",
    position: "sticky", top: 0, zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerTitle: { margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#fff" },
  headerSubtitle: { margin: 0, fontSize: "0.72rem", color: "#bae6fd", letterSpacing: "1px", textTransform: "uppercase" },
  backBtn: {
    background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)",
    borderRadius: "8px", padding: "8px 20px", cursor: "pointer", fontSize: "0.85rem",
    fontWeight: 600, backdropFilter: "blur(6px)", transition: "all 0.2s",
  },
  main: { padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" },
  glassCard: {
    background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)",
    border: "1.5px solid rgba(186,230,253,0.6)", borderRadius: "18px",
    padding: "28px 30px", boxShadow: "0 8px 32px rgba(3,105,161,0.10)", marginBottom: "32px",
  },
  sectionHeading: {
    fontSize: "1.05rem", fontWeight: 700, color: "#0369a1", marginBottom: "18px",
    display: "flex", alignItems: "center", gap: "10px",
    borderLeft: "4px solid #38bdf8", paddingLeft: "12px",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" },
  input: {
    width: "100%", padding: "11px 14px", border: "1.5px solid #bae6fd", borderRadius: "10px",
    fontSize: "0.9rem", background: "rgba(240,249,255,0.8)", color: "#0c4a6e", outline: "none",
    transition: "border 0.2s, box-shadow 0.2s", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "11px 14px", border: "1.5px solid #bae6fd", borderRadius: "10px",
    fontSize: "0.9rem", background: "rgba(240,249,255,0.8)", color: "#0c4a6e", outline: "none",
    transition: "border 0.2s, box-shadow 0.2s", resize: "vertical", minHeight: "90px",
    boxSizing: "border-box", fontFamily: "inherit",
  },
  primaryBtn: {
    background: "linear-gradient(90deg, #7c3aed, #9333ea)", color: "#fff", border: "none",
    borderRadius: "10px", padding: "11px 28px", cursor: "pointer", fontSize: "0.9rem",
    fontWeight: 700, boxShadow: "0 4px 14px rgba(124,58,237,0.4)", transition: "transform 0.15s, box-shadow 0.15s",
  },
  deleteBtn: {
    background: "linear-gradient(90deg, #dc2626, #ef4444)", color: "#fff", border: "none",
    borderRadius: "8px", padding: "6px 16px", cursor: "pointer", fontSize: "0.8rem",
    fontWeight: 600, boxShadow: "0 2px 8px rgba(220,38,38,0.3)", transition: "transform 0.15s, opacity 0.15s",
  },
  eventCard: {
    background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)", border: "1.5px solid #e0f2fe",
    borderRadius: "14px", padding: "18px 20px", marginBottom: "14px",
    boxShadow: "0 2px 12px rgba(3,105,161,0.08)", transition: "transform 0.2s, box-shadow 0.2s",
  },
  eventTitle: { margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "#0c4a6e" },
  eventDesc: { margin: "0 0 14px", fontSize: "0.88rem", color: "#475569", lineHeight: 1.6 },
  emptyState: { textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: "0.9rem" },
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .event-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(3,105,161,0.14) !important; }
    .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124,58,237,0.55) !important; }
    .delete-btn:hover { opacity: 0.85; transform: scale(0.97); }
    .back-btn:hover { background: rgba(255,255,255,0.28) !important; border-color: rgba(255,255,255,0.7) !important; }
    .dash-input:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.18) !important; background: #fff !important; }
  `}</style>
);

function AdminProjects() {
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projStatus, setProjStatus] = useState("Ongoing");
  const [projects, setProjects] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects");
      setProjects(res.data);
    } catch { setProjects([]); }
  };

  useEffect(() => {
    if (token) fetchProjects();
    else navigate("/admin-login");
  }, [token]);

  const shareToWhatsApp = (projData) => {
    const message = 
      `⛪ *OUTREACH HOPE CHURCH*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛠 *NEW PROJECT UPDATE* 🛠\n\n` +
      `📌 *Project:* ${projData.title.toUpperCase()}\n` +
      `🚦 *Status:* ${projData.status}\n\n` +
      `📝 *Details:* \n${projData.description}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔗 *Learn how to support us:*\n` +
      `https://outreachhopechurch.org/projects\n\n` +
      `*#OHCProjects #KingdomBuilding #Sunshine*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const createProject = async () => {
    try {
      await axios.post("/projects", { title: projTitle, description: projDesc, status: projStatus }, { headers: { Authorization: token } });
      const newProj = { title: projTitle, description: projDesc, status: projStatus };
      setProjTitle(""); setProjDesc("");
      fetchProjects();

      // Automatically prompt to share on WhatsApp
      shareToWhatsApp(newProj);
    } catch (err) { alert("Error creating project"); }
  };

  const deleteProject = async (id) => {
    await axios.delete(`/projects/${id}`, { headers: { Authorization: token } });
    fetchProjects();
  };

  return (
    <div style={styles.page}>
      <GlobalStyle />
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <h2 style={styles.headerTitle}>🛠 Manage Projects</h2>
            <p style={styles.headerSubtitle}>Create & manage church projects</p>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate("/admin-dashboard")} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </header>

      <main style={styles.main}>
        {/* Create Project Form */}
        <div style={styles.glassCard}>
          <h3 style={styles.sectionHeading}>Post a New Project</h3>
          <div style={styles.formGrid}>
            <input className="dash-input" placeholder="Project Title" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} style={styles.input} />
            <select className="dash-input" value={projStatus} onChange={(e) => setProjStatus(e.target.value)} style={styles.input}>
              <option value="Ongoing">Ongoing</option>
              <option value="Upcoming">Upcoming</option>
            </select>
          </div>
          <textarea className="dash-input" placeholder="Project description…" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} style={styles.textarea} />
          <button className="primary-btn" onClick={createProject} style={{ ...styles.primaryBtn, marginTop: "14px" }}>
            🛠 Publish Project
          </button>
        </div>

        {/* Projects List */}
        <h3 style={styles.sectionHeading}>
          All Projects
          <span style={{ background: "linear-gradient(90deg,#7c3aed,#9333ea)", color: "#fff", borderRadius: "999px", padding: "2px 12px", fontSize: "0.75rem", fontWeight: 700 }}>
            {projects.length}
          </span>
        </h3>
        {projects.length === 0 ? (
          <div style={styles.emptyState}><p>No projects posted yet.</p></div>
        ) : (
          projects.map((proj) => (
            <div className="event-card" key={proj._id} style={styles.eventCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={styles.eventTitle}>{proj.title}</h4>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: "99px",
                  background: proj.status === "Ongoing" ? "#e0f2fe" : "#ede9fe",
                  color: proj.status === "Ongoing" ? "#0369a1" : "#7c3aed",
                  border: `1px solid ${proj.status === "Ongoing" ? "#bae6fd" : "#c4b5fd"}`,
                }}>
                  {proj.status}
                </span>
              </div>
              <p style={styles.eventDesc}>{proj.description}</p>
              <button className="delete-btn" onClick={() => deleteProject(proj._id)} style={styles.deleteBtn}>Delete</button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default AdminProjects;
