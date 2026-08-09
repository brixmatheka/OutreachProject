import CloseButton from "../components/CloseButton"

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

    .modern-services { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    
    .stagger-1 { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.1s; }
    .stagger-2 { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.2s; }
    .stagger-3 { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: 0.3s; }

    .glass-card {
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 0 16px 38px rgba(14, 116, 144, 0.09);
    }
    .glass-card:hover {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.9) !important;
      box-shadow: 0 20px 40px rgba(3, 105, 161, 0.15) !important;
    }

    .mesh-bg {
      background-color: #e0f7ff;
      background-image: 
        radial-gradient(at 0% 0%, hsla(197, 92%, 92%, 1) 0, transparent 50%), 
        radial-gradient(at 50% 0%, hsla(199, 95%, 88%, 1) 0, transparent 50%), 
        radial-gradient(at 100% 0%, hsla(191, 91%, 90%, 1) 0, transparent 50%), 
        radial-gradient(at 0% 100%, hsla(202, 90%, 93%, 1) 0, transparent 50%), 
        radial-gradient(at 50% 100%, hsla(196, 94%, 91%, 1) 0, transparent 50%), 
        radial-gradient(at 100% 100%, hsla(200, 96%, 89%, 1) 0, transparent 50%);
    }

    .service-icon {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2);
    }

    .service-card { position: relative; overflow: hidden; }
    .service-card::after {
      content: "";
      position: absolute;
      width: 110px;
      height: 110px;
      right: -45px;
      bottom: -50px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.08);
    }
    .service-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .service-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 13px 20px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.88rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .service-action:hover { transform: translateY(-2px); }
    .service-action.primary { color: #fff; background: linear-gradient(135deg, #0369a1, #0ea5e9); box-shadow: 0 10px 24px rgba(3,105,161,.22); }
    .service-action.secondary { color: #0369a1; background: #e0f2fe; }

    @media (max-width: 640px) {
      .services-page { padding: 0 0 40px !important; align-items: flex-start !important; }
      .mobile-padding { padding: 62px 18px 34px !important; border-radius: 0 0 28px 28px !important; box-shadow: none !important; }
      .mobile-grid { grid-template-columns: 1fr !important; }
      .services-header { margin-bottom: 34px !important; }
      .services-header h1 { font-size: 2.45rem !important; }
      .services-header p { font-size: 1rem !important; }
      .services-grid { gap: 15px !important; }
      .service-card { padding: 26px 22px !important; border-radius: 22px !important; }
      .service-icon { width: 52px; height: 52px; margin-bottom: 16px; }
      .services-footer { margin-top: 44px !important; padding: 28px 18px !important; }
      .service-action { width: 100%; }
      .glass-card:hover { transform: none; }
    }
  `}</style>
);

const serviceList = [
  {
    title: "Morning Glory",
    time: "7:00 AM – 8:00 AM",
    desc: "Start your day with powerful prayer and worship, seeking God’s presence before all else.",
    icon: "☀️",
    delay: "stagger-1"
  },
  {
    title: "Bible Study",
    time: "8:00 AM – 10:00 AM",
    desc: "Dive deep into God’s Word with guided teaching, group discussions, and practical lessons for daily living.",
    icon: "📖",
    delay: "stagger-2"
  },
  {
    title: "Main Service",
    time: "10:00 AM – 12:30 PM",
    desc: "Seeking God’s presence together in worship and teaching. A celebration of faith for the whole family.",
    icon: "🕊️",
    delay: "stagger-3"
  }
];

function Services() {
  const openDirections = () => {
    const latitude = -1.3218056
    const longitude = 37.1065556
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isAppleMobile) {
      window.location.href = `maps://?daddr=${latitude},${longitude}&dirflg=d`
      return
    }

    if (isMobile) {
      window.location.href = `geo:0,0?q=${latitude},${longitude}(Outreach Hope Church Sunshine)`
      return
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <>
      <GlobalStyle />
      <div className="modern-services mesh-bg services-page" style={{
        minHeight: "100vh",
        padding: "60px 20px",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{
          maxWidth: "1100px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(30px) saturate(180%)",
          borderRadius: "40px",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.1)",
          padding: "60px 40px",
          position: "relative",
          overflow: "hidden"
        }} className="mobile-padding">
          
          <CloseButton />

          <header className="services-header" style={{ textAlign: "center", marginBottom: "60px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,.7)", color: "#0369a1",
              padding: "8px 15px", borderRadius: "999px", marginBottom: "18px",
              fontSize: ".76rem", fontWeight: 800, letterSpacing: ".8px", textTransform: "uppercase"
            }}>
              <span aria-hidden="true">●</span> Every Sunday · Everyone Welcome
            </div>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              color: "#0c4a6e",
              marginBottom: "20px",
              lineHeight: 1.1
            }}>
              Weekly Services
            </h1>
            <p style={{
              fontSize: "1.2rem",
              color: "#334155",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
              fontWeight: 400
            }}>
              Join us for uplifting worship, prayer, and study sessions designed to strengthen your faith and community bond.
            </p>
          </header>

          <div className="mobile-grid services-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px"
          }}>
            {serviceList.map((service, index) => (
              <article key={index} className={`glass-card service-card ${service.delay}`} style={{
                borderRadius: "32px",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}>
                <div className="service-icon">{service.icon}</div>
                <h2 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "1.8rem",
                  color: "#0c4a6e",
                  marginBottom: "8px"
                }}>
                  {service.title}
                </h2>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#0ea5e9",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "15px",
                  background: "rgba(14, 165, 233, 0.1)",
                  padding: "4px 12px",
                  borderRadius: "100px"
                }}>
                  {service.time}
                </div>
                <p style={{
                  fontSize: "1rem",
                  color: "#475569",
                  lineHeight: 1.7,
                  margin: 0
                }}>
                  {service.desc}
                </p>
              </article>
            ))}
          </div>

          <footer className="services-footer" style={{
            marginTop: "80px",
            textAlign: "center",
            padding: "38px 24px",
            borderRadius: "28px",
            background: "linear-gradient(135deg, rgba(255,255,255,.72), rgba(224,242,254,.82))"
          }}>
            <p style={{
              fontStyle: "italic",
              fontSize: "1.1rem",
              color: "#64748b",
              maxWidth: "500px",
              margin: "0 auto"
            }}>
              “Your word is a lamp to my feet and a light to my path.” 
              <br />
              <span style={{ fontWeight: 700, color: "#0ea5e9", fontStyle: "normal", fontSize: "0.9rem", marginTop: "10px", display: "block" }}>
                — PSALM 119:105
              </span>
            </p>
            <p style={{ color: "#475569", fontSize: ".9rem", margin: "22px auto 18px", lineHeight: 1.6 }}>
              Planning your first visit? We’d love to welcome you and help you feel at home.
            </p>
            <div className="service-actions">
              <button
                type="button"
                className="service-action primary"
                onClick={openDirections}
                style={{ border: 0, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                Get Directions ↗
              </button>
              <a className="service-action secondary" href="tel:+254722539649">
                Call the Church
              </a>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

export default Services
