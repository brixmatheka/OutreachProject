import { useEffect, useMemo, useState } from "react";
import CloseButton from "../components/CloseButton";

const STORAGE_KEY = "churchCareerIdeas";

const opportunityCards = [
  {
    title: "Youth Innovation Desk",
    tag: "Open Idea Hub",
    description: "A space for members to pitch creative ministry projects, outreach ideas, and community solutions.",
  },
  {
    title: "Community Skills Board",
    tag: "Volunteer Match",
    description: "Showcase professional skills, mentorship, and service ideas that can support the church and its mission.",
  },
  {
    title: "Church Growth Lab",
    tag: "Next Step",
    description: "Members can propose fresh programs, training sessions, and partnerships to strengthen our ministry.",
  },
];

function Careers() {
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState({ title: "", category: "Ministry Idea", description: "", name: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setIdeas(parsed);
      }
    } catch (error) {
      console.error("Failed to load career ideas:", error);
    }
  }, []);

  const ideaCount = useMemo(() => ideas.length, [ideas]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = {
      id: Date.now(),
      title: form.title.trim(),
      category: form.category.trim() || "Ministry Idea",
      description: form.description.trim(),
      name: form.name.trim() || "Anonymous Member",
      createdAt: new Date().toLocaleString(),
    };

    if (!trimmed.title || !trimmed.description) return;

    const nextIdeas = [trimmed, ...ideas].slice(0, 12);
    setIdeas(nextIdeas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIdeas));
    setForm({ title: "", category: "Ministry Idea", description: "", name: "" });
  };

  return (
    <div style={styles.page}>
      <CloseButton />
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>🌐 Kingdom Partnerships</span>
            <span style={styles.badge}>✨ Vision + Innovation</span>
            <span style={styles.badge}>🤝 Community Impact</span>
          </div>
          <p style={styles.eyebrow}>Career & Idea Module</p>
          <h1 style={styles.title}>A place for members to grow ideas, skills, and ministry opportunities</h1>
          <p style={styles.subtitle}>Members can explore available opportunities and advertise their ideas for church projects, outreach, and partnerships.</p>
          <div style={styles.buttonRow}>
            <button style={styles.button} type="button" onClick={() => window.open("/opportunities", "_blank", "noopener,noreferrer")}>Open opportunities page</button>
          </div>
          <div style={styles.visualBand}>
            <span style={styles.visualPill}>Connect</span>
            <span style={styles.visualPill}>Collaborate</span>
            <span style={styles.visualPill}>Multiply</span>
          </div>
        </header>

        <section style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>What this module offers</h2>
            <p style={styles.text}>This page helps the church community share practical ideas, ministry innovations, and career-focused opportunities in one visible hub.</p>
            <ul style={styles.list}>
              <li>See potential ministry and community opportunities</li>
              <li>Advertise your project, business, or service idea</li>
              <li>Encourage members to collaborate and grow</li>
            </ul>
          </article>

          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Idea board status</h2>
            <div style={styles.metricBox}>Total ideas shared: <strong>{ideaCount}</strong></div>
            <p style={styles.text}>Share your next step, a ministry concept, or a service idea that could bless the church and community.</p>
          </article>

          <article style={{ ...styles.card, background: "linear-gradient(135deg, rgba(8, 47, 73, 0.98), rgba(15, 23, 42, 0.98))", border: "1px solid rgba(56, 189, 248, 0.35)" }}>
            <p style={styles.tag}>Opportunities</p>
            <h2 style={styles.sectionTitle}>Find job and ministry opportunities</h2>
            <p style={styles.text}>Use the dedicated page below to browse external links for church roles, internships, volunteer openings, and career updates.</p>
            <button style={styles.button} type="button" onClick={() => window.open("/opportunities", "_blank", "noopener,noreferrer")}>Open opportunities page</button>
          </article>
        </section>

        <section style={styles.grid}>
          <article style={{ ...styles.card, background: "linear-gradient(135deg, rgba(8, 47, 73, 0.98), rgba(15, 23, 42, 0.98))", border: "1px solid rgba(56, 189, 248, 0.35)" }}>
            <p style={styles.tag}>Core Value</p>
            <h2 style={{ ...styles.sectionTitle, color: "#e0f2fe", fontSize: "1.25rem" }}>Kingdom Networking & Collaboration</h2>
            <p style={styles.text}>A unique bridge for ministries, leaders, and communities to connect, build, and multiply impact through shared vision and purposeful partnerships.</p>
            <ul style={styles.list}>
              <li><strong>Inter-Church Partnerships</strong> — joining hands across congregations to strengthen fellowship and extend reach.</li>
              <li><strong>Conference Planning</strong> — supporting Easter, Women, and Word Explosion gatherings with coordinated excellence.</li>
              <li><strong>Missions Partnerships</strong> — linking teams and resources for outreach, discipleship, and global mission.</li>
              <li><strong>Community & Government Relations</strong> — building trusted relationships that bless both the church and the wider society.</li>
              <li><strong>Ecumenical Engagement</strong> — fostering respectful collaboration for kingdom impact across communities.</li>
            </ul>
          </article>

          <article style={{ ...styles.card, background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96))", border: "1px solid rgba(125, 211, 252, 0.18)" }}>
            <p style={styles.tag}>Theme Focus</p>
            <h3 style={styles.cardTitle}>A Kingdom Bridge of Purpose</h3>
            <p style={styles.text}>This section is designed to make partnerships feel visionary, collaborative, and community-centered — not just informational.</p>
            <div style={styles.highlightBox}>Connect • Collaborate • Multiply</div>
            <p style={styles.text}>It turns your networking value into a living invitation for leaders, volunteers, and partners to join the mission.</p>
          </article>
        </section>

        <section id="opportunities-section" style={{ ...styles.grid, marginTop: 6 }}>
          <article style={{ ...styles.card, background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
            <p style={styles.tag}>Admin-managed links</p>
            <h2 style={styles.sectionTitle}>Job and ministry opportunity links</h2>
            <p style={styles.text}>Use this separate area for externally uploaded links to vacancies, ministry openings, internships, and community opportunities.</p>
            <ul style={styles.list}>
              <li>Admin can upload and update opportunity links</li>
              <li>Members can click and view the external posting</li>
              <li>Separated from the idea board for clarity</li>
            </ul>
            <div style={styles.highlightBox}>Coming soon: admin-uploaded opportunity links</div>
          </article>

          <article style={styles.card}>
            <p style={styles.tag}>How it works</p>
            <h3 style={styles.cardTitle}>A separate opportunity hub</h3>
            <p style={styles.text}>This keeps career ideas and real opportunity postings in different spaces, so members can discover both inspiration and practical openings.</p>
          </article>
        </section>

        <section style={styles.grid}>
          {opportunityCards.map((item) => (
            <article key={item.title} style={styles.card}>
              <p style={styles.tag}>{item.tag}</p>
              <h3 style={styles.cardTitle}>{item.title}</h3>
              <p style={styles.text}>{item.description}</p>
            </article>
          ))}
        </section>

        <section style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Advertise your idea</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Idea title" required />
              <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name (optional)" />
              <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Ministry Idea</option>
                <option>Community Project</option>
                <option>Career / Skills</option>
                <option>Partnership</option>
              </select>
              <textarea style={{ ...styles.input, minHeight: 110, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your idea or opportunity" required />
              <button style={styles.button} type="submit">Post idea</button>
            </form>
          </article>

          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Recent member ideas</h2>
            {ideas.length === 0 ? (
              <p style={styles.text}>No ideas posted yet. Be the first to share one.</p>
            ) : (
              <div style={styles.ideasList}>
                {ideas.map((idea) => (
                  <article key={idea.id} style={styles.ideaItem}>
                    <p style={styles.ideaTag}>{idea.category}</p>
                    <h3 style={styles.ideaTitle}>{idea.title}</h3>
                    <p style={styles.text}>{idea.description}</p>
                    <small style={styles.meta}>Posted by {idea.name} · {idea.createdAt}</small>
                  </article>
                ))}
              </div>
            )}
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
    position: "relative",
    overflow: "hidden",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 10,
  },
  badge: {
    borderRadius: 999,
    padding: "8px 10px",
    background: "rgba(125, 211, 252, 0.12)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    color: "#e0f2fe",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  buttonRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: 12,
  },
  visualBand: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  visualPill: {
    borderRadius: 999,
    padding: "8px 12px",
    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(37, 99, 235, 0.18))",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    color: "#f8fbff",
    fontSize: "0.88rem",
    fontWeight: 700,
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
    marginBottom: 18,
  },
  card: {
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 16px 36px rgba(8, 47, 73, 0.25)",
    position: "relative",
    overflow: "hidden",
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
  metricBox: {
    display: "inline-block",
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    borderRadius: 14,
    padding: "10px 12px",
    marginBottom: 10,
    color: "#e0f2fe",
  },
  highlightBox: {
    marginTop: 10,
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    color: "#e0f2fe",
    fontWeight: 700,
    letterSpacing: "0.8px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    borderRadius: 14,
    color: "#eff6ff",
    padding: "10px 12px",
    fontSize: "0.95rem",
  },
  button: {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #38bdf8, #2563eb)",
    color: "#082f49",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(56, 189, 248, 0.22)",
  },
  ideasList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  ideaItem: {
    border: "1px solid rgba(125, 211, 252, 0.16)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(8, 47, 73, 0.45)",
  },
  ideaTag: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "1.4px",
    color: "#7dd3fc",
    marginBottom: 4,
  },
  ideaTitle: {
    color: "#fff",
    fontSize: "1rem",
    margin: "0 0 6px",
  },
  meta: {
    color: "#bfdbfe",
  },
};

export default Careers;
