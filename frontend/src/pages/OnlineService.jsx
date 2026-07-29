import CloseButton from "../components/CloseButton";

function OnlineService() {
  const platforms = [
    {
      id: "zoom",
      name: "Zoom Fellowship",
      icon: "https://www.vectorlogo.zone/logos/zoomus/zoomus-icon.svg",
      detail: "Interactive Meeting",
      link: "https://zoom.us/j/3430062396",
      color: "#2D8CFF",
      desc: "Join our post-service virtual fellowship, live teaching, and interactive prayer."
    },
    {
      id: "facebook",
      name: "Facebook Live",
      icon: "https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg",
      detail: "Social Broadcast",
      link: "https://facebook.com/outreachhopechurch/live",
      color: "#1877F2",
      desc: "Connect, comment, and share the live stream with our Facebook community."
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#030712",
      backgroundImage: "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.05) 0%, transparent 40%)",
      padding: "50px 20px 80px 20px",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: "#f3f4f6",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Glow effects */}
      <div style={{ position: "absolute", top: "10%", left: "5%", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(14, 165, 233, 0.05), transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
      
      <div style={{ position: "absolute", top: "25px", right: "25px", zIndex: 10 }}>
        <CloseButton />
      </div>

      <div style={{ width: "100%", maxWidth: "1080px", zIndex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* Modern Header */}
        <header className="online-service-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(17, 24, 39, 0.45)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "16px 28px",
          borderRadius: "24px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>⛪</span>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#f8fafc" }}>Online Sanctuary</h1>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0, letterSpacing: "0.5px" }}>OUTREACH HOPE CHURCH SUNSHINE</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#ef4444",
              fontSize: "0.75rem",
              fontWeight: "800",
              padding: "6px 12px",
              borderRadius: "10px",
              textTransform: "uppercase"
            }}>
              <span style={{
                width: "6px",
                height: "6px",
                background: "#ef4444",
                borderRadius: "50%",
                boxShadow: "0 0 8px #ef4444",
                animation: "pulse 1.8s infinite"
              }} />
              Broadcasting Live
            </span>
          </div>
        </header>

        {/* 2-Column Screen & Direct Action Layout */}
        <div className="online-service-layout" style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1fr",
          gap: "24px",
          alignItems: "stretch"
        }}>
          
          {/* Main Embedded YouTube Video Player */}
          <div style={{
            background: "rgba(10, 15, 30, 0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "28px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.7)"
          }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
              <iframe
                title="Outreach Hope Church Live Stream"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0
                }}
                src="https://www.youtube.com/embed/live_stream?channel=UC_yourchannelid&autoplay=0&mute=0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{ fontSize: "1.25rem", margin: "0 0 4px 0", fontWeight: "800", color: "#f8fafc" }}>
                Sunday Worship &amp; Miracle Service
              </h2>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
                Streaming live from our sanctuary via OBS Studio directly to YouTube Live.
              </p>
            </div>
          </div>

          {/* Quick Join Side Console (1-Step Action Cards) */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            justifyContent: "space-between"
          }}>
            {platforms.map(p => (
              <a
                key={p.id}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  flexGrow: 1,
                  display: "flex"
                }}
              >
                <div style={{
                  background: "rgba(10, 15, 30, 0.7)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "24px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "100%",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = p.color;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 24px -10px ${p.color}40`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{
                      background: `${p.color}15`,
                      padding: "10px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <img src={p.icon} alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#f8fafc" }}>{p.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: p.color, fontWeight: "700" }}>{p.detail}</span>
                    </div>
                  </div>

                  <p style={{ margin: "12px 0 20px 0", fontSize: "0.82rem", color: "#9ca3af", lineHeight: "1.4" }}>
                    {p.desc}
                  </p>

                  <div style={{
                    background: p.color,
                    color: "#fff",
                    textAlign: "center",
                    padding: "10px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    transition: "opacity 0.2s"
                  }}>
                    Join Now ➔
                  </div>
                </div>
              </a>
            ))}
          </div>

        </div>

        {/* Weekly Schedule */}
        <div style={{
          background: "rgba(17, 24, 39, 0.45)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "24px",
          padding: "24px 30px"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#38bdf8", margin: "0 0 16px 0" }}>Weekly Schedule</h3>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: "700" }}>Sunday Morning</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "700" }}>10:00 AM — 12:30 PM</p>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.06)" }} />
            <div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: "700" }}>Wednesday Study</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "700" }}>6:30 PM — 8:00 PM</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          paddingTop: "20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
          opacity: 0.85
        }}>
          <p style={{ fontSize: "1rem", fontStyle: "italic", color: "#9ca3af", margin: "0 0 4px 0" }}>
            “For where two or three gather in my name, there am I with them.”
          </p>
          <span style={{ color: "#38bdf8", fontWeight: "800", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            — Matthew 18:20
          </span>
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default OnlineService;
