import CloseButton from "../components/CloseButton";

/* ── Inline global styles (modern design system) ── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;600;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-12px); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes slideRight {
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .modern-about { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    
    .stagger-1 { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.1s; }
    .stagger-2 { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.2s; }
    .stagger-3 { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.3s; }

    .glass-card {
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    .glass-card:hover {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.9) !important;
      box-shadow: 0 20px 40px rgba(3, 105, 161, 0.15) !important;
    }

    .impact-pill {
      transition: all 0.3s ease;
    }
    .impact-pill:hover {
      transform: scale(1.05);
      background: #0ea5e9 !important;
      color: #fff !important;
    }

    .mesh-bg {
      background-color: #eff6ff;
      background-image:
        radial-gradient(at 0% 0%, hsla(199, 96%, 88%, 1) 0, transparent 42%),
        radial-gradient(at 100% 0%, hsla(186, 95%, 86%, 1) 0, transparent 40%),
        radial-gradient(at 50% 100%, hsla(212, 96%, 90%, 1) 0, transparent 40%),
        radial-gradient(at 0% 100%, hsla(225, 100%, 93%, 1) 0, transparent 35%);
    }

    .glass-card {
      background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(240,249,255,0.98));
      box-shadow: 0 18px 40px rgba(56, 189, 248, 0.12);
    }

    @media (max-width: 980px) {
      .mobile-grid { grid-template-columns: 1fr !important; }
      .mobile-stack { grid-template-columns: 1fr !important; }
      .mobile-padding { padding: 40px 24px !important; }
      .mobile-hero { padding: 60px 24px 48px !important; }
    }

    @media (max-width: 640px) {
      .about-page { padding: 0 0 40px !important; align-items: flex-start; }
      .about-shell { border-radius: 0 0 26px 26px !important; box-shadow: none !important; }
      .mobile-padding { padding: 34px 18px 24px !important; }
      .mobile-hero { padding: 68px 20px 40px !important; min-height: 310px; display: flex; flex-direction: column; justify-content: center; }
      .mobile-hero h1 { font-size: clamp(2.15rem, 11vw, 2.75rem) !important; line-height: 1.04 !important; letter-spacing: -0.5px !important; }
      .hero-kicker { padding: 7px 16px !important; }
      .hero-kicker p { font-size: 0.78rem !important; letter-spacing: 1.1px !important; }
      .hero-tagline { font-size: 0.96rem !important; line-height: 1.55 !important; margin: 18px auto 0 !important; max-width: 290px; }
      .intro-section { margin-bottom: 36px !important; }
      .intro-section h2 { font-size: 1.7rem !important; gap: 10px !important; }
      .intro-section p { font-size: 1rem !important; line-height: 1.7 !important; }
      .mobile-stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8px !important; margin-bottom: 48px !important; }
      .impact-pill { padding: 18px 6px !important; border-radius: 18px !important; }
      .impact-pill > div:first-child { font-size: 1.55rem !important; }
      .impact-pill > div:last-child { font-size: 0.62rem !important; letter-spacing: 0.35px !important; line-height: 1.35; }
      .mission-grid { gap: 16px !important; margin-bottom: 52px !important; }
      .mission-grid .glass-card { padding: 26px 22px !important; border-radius: 22px !important; }
      .values-section { margin-bottom: 46px !important; }
      .values-section > h2 { font-size: 1.85rem !important; margin-bottom: 24px !important; }
      .core-values-grid { gap: 12px !important; }
      .core-values-grid .glass-card { padding: 24px 18px !important; border-radius: 20px !important; }
      .goal-card { padding: 38px 20px !important; border-radius: 24px !important; margin-bottom: 48px !important; }
      .goal-card h2 { font-size: 2rem !important; }
      .goal-card p { font-size: 1rem !important; }
      .goal-card div:last-child { font-size: 0.95rem !important; letter-spacing: 1px !important; }
      .contact-section { margin-top: 20px !important; gap: 34px !important; padding-top: 0 !important; }
      .contact-section iframe { height: 230px !important; border-radius: 20px !important; }
      .contact-row { align-items: flex-start !important; gap: 12px !important; }
      .contact-row > div:last-child { min-width: 0; }
      .contact-row a { overflow-wrap: anywhere; font-size: 0.93rem; }
      .about-footer { margin-top: 44px !important; padding: 24px 18px !important; border-radius: 20px !important; }
      .glass-card:hover, .impact-pill:hover { transform: none; }
    }

    @media (max-width: 360px) {
      .mobile-stat-grid { grid-template-columns: 1fr !important; }
      .impact-pill { padding: 16px !important; }
    }
  `}</style>
);

const values = [
  { emoji: "📖", label: "Supremacy of Scripture", verse: "2 Tim 3:16", desc: "All Scripture is God-breathed..." },
  { emoji: "🙏", label: "Dependence on God Through Prayer", verse: "John 15:5", desc: "Apart from me you can do nothing." },
  { emoji: "🌱", label: "Discipleship & Spiritual Maturity", verse: "Matt 28:19-20", desc: "Go and make disciples of all nations..." },
  { emoji: "🤝", label: "Authentic Fellowship & Relationship", verse: "Acts 2:42", desc: "They devoted themselves to the apostles' teaching and fellowship..." },
  { emoji: "📢", label: "Gospel Proclamation in Word & Deed", verse: "Rom 10:15", desc: "How beautiful are the feet of those who preach good news!" },
  { emoji: "❤️", label: "Sacrificial Service & Compassion", verse: "James 1:27", desc: "Pure religion is to visit orphans and widows..." },
  { emoji: "👨‍👩‍👧‍👦", label: "Marriage, Family & Generational Investment", verse: "Prov 22:6", desc: "Train up a child in the way he should go..." },
  { emoji: "🌍", label: "Kingdom Networking & Collaboration", verse: "1 Cor 12:12", desc: "The body is one and has many members..." },
];

function About() {
  return (
    <>
      <GlobalStyle />

      {/* ── Page wrapper ── */}
      <div
        className="modern-about mesh-bg about-page"
        style={{
          fontFamily: "'Inter', sans-serif",
          minHeight: "100vh",
          padding: "40px 15px 80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          className="about-shell"
          style={{
            maxWidth: "1000px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(25px) saturate(180%)",
            borderRadius: "32px",
            boxShadow: "0 30px 80px rgba(14, 116, 144, 0.1)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <CloseButton />

          {/* ── Immersive Hero ── */}
          <div
            className="mobile-hero"
            style={{
              background: "linear-gradient(135deg, #0b5cff 0%, #0ea5e9 45%, #22d3ee 100%)",
              padding: "80px 40px 70px",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Animated background elements */}
            <div className="hero-kicker" style={{
              position: "absolute", top: "10%", left: "5%", width: "120px", height: "120px",
              background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
              animation: "float 6s infinite ease-in-out",
            }} />
            <div style={{
              position: "absolute", bottom: "10%", right: "5%", width: "150px", height: "150px",
              background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
              animation: "float 8s infinite ease-in-out reverse",
            }} />

            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
              color: "#fff",
              margin: "0 0 15px",
              lineHeight: 1,
              letterSpacing: "-1px",
              animation: "scaleIn 1s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}>
              Outreach Hope <br /> Church Sunshine
            </h1>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "8px 24px",
              borderRadius: "100px",
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 30px rgba(3, 105, 161, 0.16)",
              animation: "fadeUp 1s ease both 0.2s",
            }}>
              <span style={{ color: "#7dd3fc", fontWeight: 800, fontSize: "1.1rem" }}>✦</span>
              <p style={{
                margin: 0,
                fontSize: "1rem",
                color: "#fff",
                fontWeight: 500,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}>
                The House of Bread
              </p>
            </div>

            <p className="hero-tagline" style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "1.1rem",
              marginTop: "20px",
              fontStyle: "italic",
              fontWeight: 300,
            }}>
              "Where the Word is Preached and Love is Experienced"
            </p>
          </div>

          {/* ── Main Content Area ── */}
          <div className="mobile-padding" style={{ padding: "60px 80px" }}>

            {/* Intro with modern emphasis */}
            <div className="stagger-1 intro-section" style={{ marginBottom: "60px" }}>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "2rem",
                color: "#0c4a6e",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "15px"
              }}>
                <div style={{ width: "40px", height: "3px", background: "#0ea5e9", borderRadius: "10px" }} />
                Who We Are
              </h2>
              <p style={{
                fontSize: "1.15rem",
                color: "#334155",
                lineHeight: 1.8,
                maxWidth: "800px",
                fontWeight: 300,
              }}>
                At Outreach Hope Church Sunshine, we are more than just a congregation; we are a
                <strong style={{ color: "#0ea5e9", fontWeight: 600 }}> Christ-centered community</strong>.
                We exist to proclaim the Gospel in word and deed, nurturing believers toward maturity and transforming our communities through the power of God.
              </p>
            </div>

            {/* ── Impact Section ── */}
            <div
              className="stagger-2 mobile-stat-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "80px",
              }}
            >
              {[
                { val: "500+", label: "Families Served" },
                { val: "15+", label: "Years of Ministry" },
                { val: "50+", label: "Community Projects" },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="impact-pill"
                  style={{
                    background: "linear-gradient(145deg, rgba(14, 165, 233, 0.14), rgba(125, 211, 252, 0.12))",
                    padding: "30px",
                    borderRadius: "24px",
                    textAlign: "center",
                    boxShadow: "0 12px 30px rgba(14, 165, 233, 0.1)",
                    cursor: "default"
                  }}
                >
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0369a1", marginBottom: "5px" }}>{stat.val}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* ── Mission & Vision ── */}
            <div
              className="mobile-grid mobile-stack stagger-3 mission-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
                marginBottom: "80px",
              }}
            >
              {[
                {
                  title: "Our Vision",
                  text: "To be a Christ-centered community that raises mature disciples, plants thriving churches, and transforms communities through the power of the Gospel — until every person we reach is presented complete in Christ.",
                  verse: '"Him we proclaim, warning everyone and teaching everyone with all wisdom, that we may present everyone mature in Christ." — Colossians 1:28',
                  bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  icon: "📜"
                },
                {
                  title: "Our Mission",
                  text: "We exist to proclaim the Gospel of Jesus Christ in word and deed, nurturing believers toward maturity through biblical teaching, authentic fellowship, sacrificial service, and intentional community engagement.",
                  bg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                  icon: "🎯"
                }
              ].map(item => (
                <div
                  key={item.title}
                  className="glass-card"
                  style={{
                    background: item.bg,
                    padding: "40px",
                    borderRadius: "28px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>{item.icon}</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#0c4a6e", marginBottom: "15px" }}>{item.title}</h3>
                  <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "1.05rem", marginBottom: item.verse ? "20px" : 0 }}>{item.text}</p>
                  {item.verse && (
                    <p style={{ color: "#0ea5e9", fontSize: "0.9rem", fontStyle: "italic", paddingTop: "18px", marginTop: "auto" }}>
                      {item.verse}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* ── Modern Values Section ── */}
            <div className="values-section" style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.2rem", color: "#0c4a6e", marginBottom: "40px" }}>Core Values</h2>
              <div
                className="mobile-grid core-values-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "20px"
                }}
              >
                {values.map(v => (
                  <div
                    key={v.label}
                    className="glass-card"
                    style={{
                      background: "rgba(255,255,255,0.6)",
                      padding: "30px 20px",
                      borderRadius: "24px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ fontSize: "2.5rem", marginBottom: "15px" }}>{v.emoji}</div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px", lineHeight: 1.3 }}>{v.label}</h4>
                    <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5, marginBottom: "15px", fontStyle: "italic" }}>"{v.desc}"</p>
                    <div style={{ marginTop: "auto", fontSize: "0.75rem", fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "1px" }}>
                      — {v.verse}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Our Goal Section ── */}
            <div 
              className="glass-card stagger-3 goal-card"
              style={{ 
                background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)", 
                padding: "60px 40px", 
                borderRadius: "32px", 
                color: "#fff", 
                textAlign: "center", 
                marginBottom: "80px",
                boxShadow: "0 25px 50px rgba(3,105,161,0.3)"
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🔥</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.5rem", marginBottom: "20px" }}>Our 5-Year Goal</h2>
              <p style={{ fontSize: "1.2rem", lineHeight: 1.7, maxWidth: "700px", margin: "0 auto", opacity: 0.9, fontWeight: 300 }}>
                To grow from 150 to 500 members and plant 10 churches in 5 years across Machakos and other parts of the world — all for the glory of God!
              </p>
              <div style={{ 
                marginTop: "30px", 
                fontSize: "1.3rem", 
                fontWeight: 700, 
                color: "#7dd3fc",
                letterSpacing: "2px",
                textTransform: "uppercase"
              }}>
                ✝️ To God be the glory!
              </div>
            </div>

            {/*Enhanced Location & Contact  */}
            <div
              className="mobile-grid mobile-stack contact-section"
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "40px",
                marginTop: "100px",
                paddingTop: "20px"
              }}
            >
              <div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.8rem", color: "#0c4a6e", marginBottom: "20px" }}>Visit Us</h3>
                <iframe
                  title="Church Location Map"
                  src="https://www.google.com/maps?q=-1.3218056,37.1065556&z=16&output=embed"
                  width="100%"
                  height="300"
                  style={{
                    border: 0,
                    borderRadius: "28px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
                  }}
                  allowFullScreen
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.8rem", color: "#0c4a6e", marginBottom: "25px" }}>Get in Touch</h3>
                <div style={{ gap: "25px", display: "flex", flexDirection: "column" }}>
                  {[
                    { icon: "📞", label: "Call Us", val: "+254 722539649", link: "tel:+254722539649" },
                    { icon: "✉️", label: "Email", val: "info@outreachhopechurch.org", link: "mailto:info@outreachhopechurch.org" },
                    { icon: "🌐", label: "Web", val: "outreachhopechurch.org", link: "https://outreachhopechurch.org" }
                  ].map(c => (
                    <div key={c.label} className="contact-row" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={{
                        width: "50px", height: "50px", background: "#f0f9ff",
                        borderRadius: "15px", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "1.3rem"
                      }}>{c.icon}</div>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{c.label}</div>
                        <a
                          href={c.link}
                          target={c.label === "Web" ? "_blank" : undefined}
                          rel={c.label === "Web" ? "noopener noreferrer" : undefined}
                          style={{
                            fontWeight: 600,
                            color: "#0c4a6e",
                            textDecoration: "none",
                            transition: "color 0.2s ease"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = "#0ea5e9"}
                          onMouseOut={(e) => e.currentTarget.style.color = "#0c4a6e"}
                        >
                          {c.val}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Mini Footer (Inside Card) ── */}
            <footer className="about-footer" style={{
              background: "rgba(241, 245, 249, 0.5)",
              padding: "30px 40px",
              textAlign: "center",
              borderRadius: "24px",
              marginTop: "60px"
            }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: "0.9rem",
                color: "#64748b",
                fontWeight: 500
              }}>
                &copy; {new Date().getFullYear()} Outreach Hope Church Sunshine. All rights reserved.
              </p>
              <p style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "#0ea5e9",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: 800
              }}>
                The House of Bread
              </p>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}

export default About;
