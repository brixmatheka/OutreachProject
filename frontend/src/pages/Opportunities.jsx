import CloseButton from "../components/CloseButton";

function Opportunities() {
  return (
    <div style={styles.page}>
      <CloseButton />
      <div style={styles.shell}>
        <header style={styles.hero}>
          <p style={styles.eyebrow}>Opportunities</p>
          <h1 style={styles.title}>Career, ministry, and community opportunity links</h1>
          <p style={styles.subtitle}>
            This dedicated page is where admins can place external links for available roles, internships, volunteer openings, and related announcements.
          </p>
        </header>

        <section style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>What members will find here</h2>
            <ul style={styles.list}>
              <li>Church and ministry role openings</li>
              <li>Volunteer and internship opportunities</li>
              <li>ADVERTISE HERE</li>
              <li>External links managed by the admin team</li>

            </ul>
          </article>

          <article style={{ ...styles.card, background: "linear-gradient(135deg, rgba(8, 47, 73, 0.98), rgba(15, 23, 42, 0.98))", border: "1px solid rgba(56, 189, 248, 0.35)" }}>
            <p style={styles.tag}>Next step</p>
            <h3 style={styles.cardTitle}>Admin can upload links here</h3>
            <p style={styles.text}>This page is separated from the careers ideas board so members can quickly find real opportunities without mixing them with idea-sharing content.</p>
          </article>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #082f49 0%, #0f172a 45%, #111827 100%)",
    color: "#eff6ff",
    padding: "24px 18px 80px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  shell: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    marginBottom: 28,
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "#7dd3fc",
    fontSize: "0.85rem",
    fontWeight: 700,
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    lineHeight: 1.1,
    margin: "8px auto 12px",
    maxWidth: 860,
    color: "#f8fbff",
  },
  subtitle: {
    color: "#bfdbfe",
    maxWidth: 780,
    margin: "0 auto",
    fontSize: "1.02rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  card: {
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 16px 36px rgba(8, 47, 73, 0.25)",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "1.15rem",
    color: "#e0f2fe",
  },
  tag: {
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    fontSize: "0.78rem",
    color: "#38bdf8",
    fontWeight: 700,
  },
  cardTitle: {
    fontSize: "1.25rem",
    color: "#fff",
    margin: "6px 0 8px",
  },
  text: {
    color: "#dbeafe",
    fontSize: "0.98rem",
    lineHeight: 1.6,
    margin: 0,
  },
  list: {
    margin: "10px 0 0 18px",
    color: "#dbeafe",
    lineHeight: 1.6,
  },
};

export default Opportunities;
