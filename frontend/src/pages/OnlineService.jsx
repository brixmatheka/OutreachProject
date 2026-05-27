import CloseButton from "../components/CloseButton"

function OnlineService() {
  const platforms = [
    {
      name: "Zoom Meeting",
      icon: "https://www.vectorlogo.zone/logos/zoomus/zoomus-icon.svg",
      detail: "ID: 123 456 7890",
      link: "https://zoom.us/j/343 006 2396",
      color: "#2D8CFF",
      desc: "Join our interactive fellowship and live teaching session."
    },
    {
      name: "Facebook Live",
      icon: "https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg",
      detail: "@outreachhopechurch",
      link: "https://facebook.com/outreachhopechurch/live",
      color: "#1877F2",
      desc: "Watch the stream and connect with our community on Facebook."
    },
    {
      name: "YouTube Stream",
      icon: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
      detail: "OHC Sunshine TV",
      link: "https://youtube.com/c/yourchannel/live",
      color: "#FF0000",
      desc: "High-quality 4K broadcast available on all smart devices."
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#020617",
      backgroundImage: "radial-gradient(circle at top right, rgba(14, 165, 233, 0.15) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.1) 0%, transparent 40%)",
      padding: "80px 20px",
      fontFamily: "'Inter', sans-serif",
      color: "#f1f5f9",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative Glows */}
      <div style={{ position: "absolute", top: "15%", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(14, 165, 233, 0.05), transparent 70%)", zIndex: 0 }} />

      <div style={{ position: "absolute", top: "30px", right: "30px", zIndex: 10 }}>
        <CloseButton />
      </div>

      {/* Header Section */}
      <div style={{ textAlign: "center", maxWidth: "800px", marginBottom: "60px", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(14, 165, 233, 0.1)",
          padding: "8px 16px",
          borderRadius: "999px",
          border: "1px solid rgba(14, 165, 233, 0.3)",
          color: "#0ea5e9",
          fontSize: "0.85rem",
          fontWeight: "700",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "24px"
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            background: "#0ea5e9",
            borderRadius: "50%",
            boxShadow: "0 0 10px #0ea5e9",
            animation: "pulse 2s infinite"
          }} />
          Live Now
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "3.5rem",
          background: "linear-gradient(to right, #f8fafc, #bae6fd)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 20px 0",
          lineHeight: "1.1"
        }}>
          Online Sanctuary
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#94a3b8", lineHeight: "1.6", margin: "0 auto", maxWidth: "600px" }}>
          Experience the Presence of God from anywhere. Join Outreach Hope Church virtually for worship, teaching, and global fellowship.
        </p>
      </div>

      {/* Platform Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        width: "100%",
        maxWidth: "1100px",
        zIndex: 1
      }}>
        {platforms.map((p, idx) => (
          <a
            key={idx}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                backgroundColor: "rgba(2, 6, 23, 0.6)",
                backdropFilter: "blur(16px)",
                padding: "32px",
                borderRadius: "24px",
                border: "1px solid rgba(14, 165, 233, 0.15)",
                height: "100%",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(14, 165, 233, 0.4)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
                e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(14, 165, 233, 0.15)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "rgba(2, 6, 23, 0.6)";
              }}
            >
              <div style={{
                width: "56px",
                height: "56px",
                background: `${p.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "16px",
                padding: "10px"
              }}>
                <img src={p.icon} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", margin: "0 0 4px 0", color: "#f8fafc" }}>{p.name}</h3>
                <p style={{ fontSize: "0.9rem", color: "#0ea5e9", fontWeight: "600", margin: 0 }}>{p.detail}</p>
              </div>
              <p style={{ fontSize: "0.95rem", color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
                {p.desc}
              </p>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc", fontWeight: "600", fontSize: "0.9rem" }}>
                Connect Now <span>→</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Schedule Section */}
      <div style={{
        marginTop: "80px",
        width: "100%",
        maxWidth: "600px",
        textAlign: "center",
        backgroundColor: "rgba(14, 165, 233, 0.05)",
        padding: "40px",
        borderRadius: "32px",
        border: "1px dashed rgba(14, 165, 233, 0.3)",
        zIndex: 1
      }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.8rem", marginBottom: "20px" }}>Service Schedule</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#0ea5e9", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Sunday Worship</div>
            <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>10:00 AM — 12:30 PM</div>
          </div>
          <div>
            <div style={{ color: "#0ea5e9", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Wednesday Bible Study</div>
            <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>6:30 PM — 8:00 PM</div>
          </div>
        </div>
      </div>

      {/* Scripture Footer */}
      <footer style={{ marginTop: "80px", textAlign: "center", maxWidth: "600px", opacity: 0.8, zIndex: 1 }}>
        <p style={{ fontSize: "1.1rem", fontStyle: "italic", color: "#94a3b8", lineHeight: "1.6" }}>
          “For where two or three gather in my name, there am I with them.”
        </p>
        <span style={{ color: "#0ea5e9", fontWeight: "700", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
          — Matthew 18:20
        </span>
      </footer>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default OnlineService;
