import CloseButton from "../components/CloseButton"

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
    padding: "40px 30px",
    boxShadow: "0 10px 30px rgba(3, 105, 161, 0.05)",
    textAlign: "center",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  avatarContainer: {
    position: "relative",
    width: "160px",
    height: "160px",
    margin: "0 auto 28px",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "20px",
    objectFit: "cover",
    boxShadow: "0 8px 24px rgba(3, 105, 161, 0.15)",
    border: "4px solid #fff",
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
  },
  fellowshipDesc: {
    fontSize: "0.95rem",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  }
}

function Ministers() {
  return (
    <div style={styles.page}>
      <style>{`
        .minister-card:hover { transform: translateY(-8px); boxShadow: 0 20px 40px rgba(3, 105, 161, 0.1) !important; }
        .fellowship-card:hover { border-color: #0ea5e9 !important; transform: scale(1.02); }
      `}</style>
      <CloseButton />

      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.headerGroup}>
          <span style={styles.superTitle}>Faith & Leadership</span>
          <h1 style={styles.mainTitle}>Spiritual Guidance</h1>
        </div>

        {/* Ministers Section */}
        <div style={styles.sectionHeader}>
          <div style={styles.accentBar} />
          <h2 style={styles.sectionTitle}>Our Ministers</h2>
        </div>

        <div style={styles.grid}>
          {/* Minister 1 */}
          <div className="minister-card" style={styles.card}>
            <div style={styles.avatarContainer}>
              <img
                src=""
                alt="Rev. Clinton OKANGA"
                style={styles.avatar}
              />
            </div>
            <h3 style={styles.ministerName}>Rev. Clinton OKANGA</h3>
            <span style={styles.ministerRole}>Senior Pastor</span>
            <p style={styles.ministerBio}>
              Rev. Clinton leads Outreach Hope Church with a vision to raise disciples and impact the Sunshine community with hope.
            </p>
          </div>

          {/* Minister 2 */}
          <div className="minister-card" style={styles.card}>
            <div style={styles.avatarContainer}>
              <img
                src=""
                alt="Pastor DAVID NDUNGU"
                style={styles.avatar}
              />
            </div>
            <h3 style={styles.ministerName}>Pastor DAVID NDUNGU</h3>
            <span style={styles.ministerRole}>Associate Pastor</span>
            <p style={styles.ministerBio}>
              Pastor DAVID oversees discipleship and homecells, encouraging believers to grow in faith and service.
            </p>
          </div>

          {/* Minister 3 */}
          <div className="minister-card" style={styles.card}>
            <div style={styles.avatarContainer}>
              <img
                src=""
                alt="Pastor John Ndirangu"
                style={styles.avatar}
              />
            </div>
            <h3 style={styles.ministerName}>Pastor John Ndirangu</h3>
            <span style={styles.ministerRole}>Youth Pastor</span>
            <p style={styles.ministerBio}>
              Pastor John leads the youth fellowship, inspiring young people to live boldly for Christ and serve their community.
            </p>
          </div>
        </div>

        {/* Fellowships Section */}
        <div style={styles.sectionHeader}>
          <div style={styles.accentBar} />
          <h2 style={styles.sectionTitle}>Our Fellowships</h2>
        </div>

        <div style={{ ...styles.grid, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {/* Women Fellowship */}
          <div className="fellowship-card" style={styles.fellowshipCard}>
            <h3 style={styles.fellowshipTitle}>Women Fellowship</h3>
            <p style={styles.fellowshipDesc}>Empowering women through prayer, mentorship, and community service. A place to grow in faith and sisterhood.</p>
          </div>

          {/* Men Fellowship */}
          <div className="fellowship-card" style={styles.fellowshipCard}>
            <h3 style={styles.fellowshipTitle}>Men Fellowship</h3>
            <p style={styles.fellowshipDesc}>Building strong men of faith through Bible study, mentorship, and outreach. A brotherhood rooted in Christ.</p>
          </div>

          {/* Youth Fellowship */}
          <div className="fellowship-card" style={styles.fellowshipCard}>
            <h3 style={styles.fellowshipTitle}>Youth Fellowship</h3>
            <p style={styles.fellowshipDesc}>Inspiring the next generation through worship, Bible study, and fun activities. A vibrant community for young believers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ministers
