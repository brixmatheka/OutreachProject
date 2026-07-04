import { useEffect, useState } from "react";
import CloseButton from "../components/CloseButton";
import axios from "axios";
import { API_URL as API } from "../apiConfig";

/* ─── Modern Styles ────────────────────────────────────────────── */
const styles = {
  page: {
    background: "linear-gradient(165deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)",
    minHeight: "100vh",
    padding: "60px 24px 100px",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  headerGroup: {
    textAlign: "center",
    marginBottom: "64px",
  },
  superTitle: {
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "#0ea5e9",
    marginBottom: "12px",
    display: "block",
  },
  mainTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
    color: "#0c4a6e",
    margin: 0,
    lineHeight: 1.1,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "40px",
    marginTop: "80px",
  },
  accentBar: {
    width: "4px",
    height: "32px",
    background: "#0369a1",
    borderRadius: "99px",
  },
  sectionTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: "2rem",
    color: "#0c4a6e",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(186, 230, 253, 0.6)",
    borderRadius: "24px",
    padding: 0,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(3, 105, 161, 0.05)",
    textAlign: "center",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },
  avatarContainer: {
    position: "relative",
    width: "100%",
    height: "280px",
    margin: 0,
    overflow: "hidden",
    background: "linear-gradient(135deg, #e0f2fe, #f8fafc)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    objectFit: "cover",
    objectPosition: "center center",
    boxShadow: "none",
    border: "none",
    display: "block",
  },
  cardBody: {
    padding: "24px 24px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  ministerName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: "1.4rem",
    color: "#0369a1",
    margin: "0 0 4px",
  },
  ministerRole: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0ea5e9",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "16px",
    display: "block",
  },
  ministerBio: {
    fontSize: "0.95rem",
    color: "#475569",
    lineHeight: 1.7,
    margin: 0,
  },
  fellowshipCard: {
    background: "#fff",
    border: "1px solid #e0f2fe",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 4px 15px rgba(3, 105, 161, 0.03)",
    transition: "all 0.3s ease",
  },
  fellowshipTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: "1.5rem",
    color: "#0369a1",
    marginBottom: "12px",
  }
};

function Ministers() {
  const [ministers, setMinisters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/ministers`)
      .then(res => setMinisters(res.data))
      .catch(err => console.error("Failed to load ministers:", err))
      .finally(() => setLoading(false));
  }, []);

  const mediaUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const initialsFor = (name = "") =>
    name
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .join("")
      .slice(0, 3)
      .toUpperCase() || "OHC";

  const placeholder = (initials) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%230ea5e9'/><stop offset='1' stop-color='%2306517a'/></linearGradient></defs><rect width='240' height='240' rx='32' fill='url(%23g)'/><circle cx='120' cy='86' r='42' fill='rgba(255,255,255,0.18)'/><rect x='56' y='140' width='128' height='38' rx='19' fill='rgba(255,255,255,0.18)'/><text x='50%' y='210' text-anchor='middle' font-family='Arial, sans-serif' font-size='20' fill='white'>${initials}</text></svg>`)}`;

  return (
    <div style={styles.page}>
      <style>{`
        .minister-card:hover { transform: translateY(-8px); boxShadow: 0 20px 40px rgba(3, 105, 161, 0.1) !important; }
        .minister-card { min-height: 470px; }
        .ministry-card:hover { transform: translateY(-6px); boxShadow: 0 18px 36px rgba(15, 23, 42, 0.14) !important; border-color: rgba(14, 165, 233, 0.45) !important; }
        .fellowship-card:hover { border-color: #0ea5e9 !important; transform: scale(1.02); }
      `}</style>
      <CloseButton />

      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.headerGroup}>
          <span style={styles.superTitle}>Faith &amp; Leadership</span>
          <h1 style={styles.mainTitle}>Spiritual Guidance</h1>
        </div>

        {/* Ministers Section */}
        <div style={styles.sectionHeader}>
          <div style={styles.accentBar} />
          <h2 style={styles.sectionTitle}>Our Ministers</h2>
        </div>

        {loading ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>Loading ministers…</p>
        ) : ministers.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>No ministers found.</p>
        ) : (
          <div style={styles.grid}>
            {ministers.map(minister => (
              <div key={minister._id} className="minister-card" style={styles.card}>
                <div style={styles.avatarContainer}>
                  <img
                    src={mediaUrl(minister.photoUrl) || placeholder(initialsFor(minister.name))}
                    alt={minister.name}
                    style={styles.avatar}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = placeholder(initialsFor(minister.name));
                    }}
                  />
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.ministerName}>{minister.name}</h3>
                  <span style={styles.ministerRole}>{minister.role}</span>
                  {minister.bio && <p style={styles.ministerBio}>{minister.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ministries Section Header */}
        <div style={styles.sectionHeader}>
          <div style={styles.accentBar} />
          <h2 style={styles.sectionTitle}>Ministries &amp; Leadership</h2>
        </div>

        {/* Ministries Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          {[
            {
              title: "Children's Ministry",
              core: "Marriage, Family & Generational Investment",
              bullets: [
                "🌿 Mizizi — Ages 0-6 years",
                "🧱 Msingi — Ages 7-12 years",
                "🦋 Kipepeo — Ages 13-19 years",
                "Children Workers Training (Target: 50 in 5 years)",
                "Children's Conference (August)",
                "Transition Graduation Ceremonies",
                "Children's Minister Coordinator",
              ],
              lead: "Elder Anisia Wawira",
              support: "Deacon Peter Njore",
              accent: "#f472b6",
            },
            {
              title: "Youth Ministry",
              core: "Discipleship & Spiritual Maturity",
              bullets: [
                "🐘 Elephant Group — After high school, before college",
                "🐆 Cheetah Group — In college, before marriage",
                "Youth Conference (April)",
                "Youth Leadership Development",
                "Campus Ministry & University Outreach",
              ],
              lead: "Elder Erastus Singi",
              support: "James Mwangi",
              accent: "#38bdf8",
            },
            {
              title: "Women's Ministry",
              core: "Authentic Fellowship & Relationship",
              bullets: [
                "Single Mothers",
                "Married (Below 40 years)",
                "Married (Above 40 years)",
                "Widows Ministry",
                "Women's Conference (Annual)",
                "Women Empowerment & Skills Training",
              ],
              lead: "Deaconess Margaret Kinyua",
              support: "Deaconess Virginia Kibuchi | Elizabeth Simiyu",
              accent: "#f59e0b",
            },
            {
              title: "Men's Ministry",
              core: "Discipleship & Spiritual Maturity",
              bullets: [
                "Young Adult Men",
                "Senior Adult Men",
                "Men's Fellowship & Accountability Groups",
                "Men's Conference (Annual)",
                "Fatherhood Initiative",
              ],
              lead: "Lead: Pastor in charge",
              support: "Team leaders & elders",
              accent: "#22c55e",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="ministry-card"
              style={{
                background: "rgba(255,255,255,0.82)",
                border: `1px solid ${item.accent}33`,
                borderRadius: "24px",
                padding: "22px",
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.10)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: item.accent, boxShadow: `0 0 0 6px ${item.accent}18` }} />
                <h3 style={{ margin: 0, fontSize: "1.12rem", color: "#0c4a6e", fontFamily: "'DM Serif Display', Georgia, serif" }}>{item.title}</h3>
              </div>
              <p style={{ margin: "4px 0 10px", color: item.accent, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 700 }}>{item.core}</p>
              <ul style={{ margin: "0 0 12px 18px", padding: 0, color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>
                {item.bullets.map((bullet) => <li key={bullet} style={{ marginBottom: "6px" }}>{bullet}</li>)}
              </ul>
              <div style={{ borderTop: "1px solid rgba(148, 163, 184, 0.18)", paddingTop: "10px", display: "grid", gap: "4px" }}>
                <span style={{ color: "#0369a1", fontSize: "0.88rem", fontWeight: 700 }}>Lead: {item.lead}</span>
                <span style={{ color: "#475569", fontSize: "0.88rem" }}>Support: {item.support}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Ministers;
