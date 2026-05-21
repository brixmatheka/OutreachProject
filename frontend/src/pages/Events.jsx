import { useEffect, useState } from "react";
import axios from "axios";
import CloseButton from "../components/CloseButton";

/* ─── Global styles ─────────────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }

    .events-page {
      animation: fadeIn 0.45s ease both;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .ev-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .ev-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 36px rgba(3,105,161,0.14) !important;
    }

    .proj-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .proj-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(3,105,161,0.13) !important;
      border-color: #7dd3fc !important;
    }

    .skeleton {
      background: linear-gradient(90deg, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%);
      background-size: 600px 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 8px;
    }
  `}</style>
);


/* ─── Skeleton card  */
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0f2fe",
      borderRadius: "14px",
      padding: "22px",
    }}>
      <div className="skeleton" style={{ height: "14px", width: "55%", marginBottom: "14px" }} />
      <div className="skeleton" style={{ height: "11px", width: "30%", marginBottom: "12px" }} />
      <div className="skeleton" style={{ height: "11px", width: "95%", marginBottom: "8px" }} />
      <div className="skeleton" style={{ height: "11px", width: "80%" }} />
    </div>
  );
}
/* ─── Section heading ──*/
function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <div style={{
          width: "4px",
          height: "24px",
          background: "#0ea5e9",
          borderRadius: "99px",
        }} />
        <h2 style={{
          margin: 0,
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "clamp(1.5rem, 3vw, 1.85rem)",
          fontWeight: 400,
          color: "#0c4a6e",
          letterSpacing: "-0.4px",
        }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{
          margin: "6px 0 0 16px",
          fontSize: "0.88rem",
          color: "#64748b",
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── Event card ────────────────────────────────────────────────── */
function EventCard({ event, userProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [attendeeData, setAttendeeData] = useState({
    name: "",
    idNumber: "",
    phone: "",
  });

  useEffect(() => {
    if (userProfile) {
      setAttendeeData({
        name: `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim(),
        idNumber: userProfile.idNo || "",
        phone: userProfile.phone || "",
      });
    } else {
      setAttendeeData({
        name: localStorage.getItem("memberName") ? `${localStorage.getItem("memberName")} ${localStorage.getItem("memberLastName") || ""}`.trim() : "",
        idNumber: localStorage.getItem("memberIdNo") || "",
        phone: localStorage.getItem("memberPhone") || "",
      });
    }
  }, [userProfile]);

  const rawDate = event.date ? new Date(event.date) : null;
  const formatted = rawDate && !isNaN(rawDate)
    ? rawDate.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })
    : event.date;
  const day = rawDate && !isNaN(rawDate) ? rawDate.getDate() : "—";
  const month = rawDate && !isNaN(rawDate)
    ? rawDate.toLocaleDateString("en-US", { month: "short" })
    : "";

  return (
    <div className="ev-card" style={{
      background: "#fff",
      border: "1px solid #bae6fd",
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(3,105,161,0.07)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Left-side coloured strip */}
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{
          width: "6px",
          background: "linear-gradient(180deg, #0369a1, #38bdf8)",
          flexShrink: 0,
        }} />

        <div style={{ padding: "20px 20px 22px", display: "flex", gap: "16px", flex: 1 }}>
          {/* Date block */}
          <div style={{
            minWidth: "52px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "2px",
          }}>
            <span style={{
              display: "block",
              fontSize: "1.75rem",
              fontFamily: "'DM Serif Display', serif",
              fontWeight: 400,
              color: "#0369a1",
              lineHeight: 1,
            }}>
              {day}
            </span>
            <span style={{
              display: "block",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: "#0ea5e9",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginTop: "3px",
            }}>
              {month}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", background: "#e0f2fe", flexShrink: 0, margin: "2px 0" }} />

          {/* Text */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: "0 0 8px",
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "1.05rem",
              fontWeight: 400,
              color: "#0c4a6e",
              lineHeight: 1.35,
            }}>
              {event.title}
            </h3>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}>
              <span style={{ fontSize: "0.75rem", color: "#0ea5e9", fontWeight: 600 }}>
                {formatted}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "#475569",
              lineHeight: 1.7,
            }}>
              {event.description}
            </p>

            {/* Attendance flow */}
            <div style={{ marginTop: "16px" }}>
              {!expanded ? (
                <button 
                  onClick={() => setExpanded(true)}
                  style={{
                    background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", 
                    padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", 
                    fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  I'm Interested
                </button>
              ) : !confirmed ? (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", animation: "fadeIn 0.3s" }}>
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600, display: "block", marginBottom: "10px" }}>Confirm Attendance</span>
                  <input type="text" placeholder="Full Name" value={attendeeData.name} onChange={e => setAttendeeData({...attendeeData, name: e.target.value})} style={{ width: "100%", marginBottom: "8px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }} />
                  <input type="text" placeholder="ID Number" value={attendeeData.idNumber} onChange={e => setAttendeeData({...attendeeData, idNumber: e.target.value})} style={{ width: "100%", marginBottom: "8px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }} />
                  <input type="tel" placeholder="Phone Number" value={attendeeData.phone} onChange={e => setAttendeeData({...attendeeData, phone: e.target.value})} style={{ width: "100%", marginBottom: "12px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }} />
                  
                  <button 
                    onClick={async () => {
                      if (!attendeeData.name || !attendeeData.idNumber || !attendeeData.phone) {
                        alert("Please fill in all details to confirm attendance.");
                        return;
                      }
                      if (userProfile && userProfile.idNo && attendeeData.idNumber !== userProfile.idNo) {
                        alert("Invalid ID number. Please enter the correct ID number associated with your profile.");
                        return;
                      }
                      try {
                        await axios.post(`http://localhost:5000/events/${event._id}/attend`, attendeeData);
                        setConfirmed(true);
                      } catch (err) {
                        alert(err.response?.data?.message || "Error confirming attendance");
                      }
                    }}
                    style={{
                      background: "linear-gradient(90deg, #0ea5e9, #0284c7)", color: "#fff", 
                      border: "none", padding: "8px 16px", borderRadius: "8px", 
                      fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                      width: "100%", transition: "transform 0.2s"
                    }}
                  >
                    Confirm My Attendance
                  </button>
                </div>
              ) : (
                <div style={{ 
                  background: "#f0fdf4", color: "#15803d", padding: "6px 12px", 
                  borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, 
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  animation: "fadeIn 0.3s", border: "1px solid #bbf7d0"
                }}>
                  ✅ See you there!
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Project card ──────────────────────────────────────────────── */
function ProjectCard({ project }) {
  const isOngoing = project.status === "Ongoing";

  return (
    <div className="proj-card" style={{
      background: "#fff",
      border: "1px solid #bae6fd",
      borderRadius: "14px",
      padding: "26px 24px",
      boxShadow: "0 2px 12px rgba(3,105,161,0.06)",
      position: "relative"
    }}>
      {/* Badge row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: "14px",
      }}>
        <span style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: isOngoing ? "#0369a1" : "#7c3aed",
          background: isOngoing ? "#e0f2fe" : "#ede9fe",
          border: `1px solid ${isOngoing ? "#bae6fd" : "#c4b5fd"}`,
          borderRadius: "999px",
          padding: "4px 12px",
        }}>
          {project.status}
        </span>
      </div>

      <h3 style={{
        margin: "0 0 10px",
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: "1.1rem",
        fontWeight: 400,
        color: "#0c4a6e",
        lineHeight: 1.3,
      }}>
        {project.title}
      </h3>
      <p style={{
        margin: "0 0 16px",
        fontSize: "0.875rem",
        color: "#475569",
        lineHeight: 1.7,
      }}>
        {project.description || project.desc}
      </p>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
function Events() {
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("memberToken");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/auth/me", {
        headers: { Authorization: token },
      });
      setUserProfile(res.data);
    } catch (err) {
      console.error("Error fetching user profile", err);
    }
  };

  const fetchData = async () => {
    try {
      const [evRes, projRes] = await Promise.all([
        axios.get("http://localhost:5000/events"),
        axios.get("http://localhost:5000/projects")
      ]);

      // Filter out past events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeEvents = evRes.data.filter(ev => {
        const evDate = new Date(ev.date);
        evDate.setHours(0, 0, 0, 0);
        return evDate >= today;
      });

      setEvents(activeEvents);
      setProjects(projRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  return (
    <>
      <GlobalStyle />
      <div
        className="events-page"
        style={{
          background: "linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 60%, #f0f9ff 100%)",
          minHeight: "100vh",
          padding: "40px 24px 80px",
          position: "relative",
        }}
      >
        <CloseButton />

        {/* ── Page header ── */}
        <div style={{
          maxWidth: "680px",
          margin: "0 auto 52px",
          textAlign: "center",
          paddingTop: "8px",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "#0369a1",
            marginBottom: "16px",
          }}>
            <div style={{
              width: "20px", height: "1px",
              background: "#0ea5e9",
            }} />
            Outreach Hope Church
            <div style={{
              width: "20px", height: "1px",
              background: "#0ea5e9",
            }} />
          </div>

          <h1 style={{
            margin: "0 0 14px",
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 400,
            color: "#0c4a6e",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
          }}>
            Events &amp; Projects
          </h1>

          <p style={{
            margin: "0 auto",
            maxWidth: "480px",
            color: "#64748b",
            fontSize: "0.95rem",
            lineHeight: 1.75,
            fontWeight: 400,
          }}>
            Stay connected with what's happening at OHC — from upcoming services
            to community outreach initiatives around Sunshine, Joska.
          </p>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>

          {/* Events section */}
          <SectionHeading
            title="Upcoming Events"
            subtitle={
              !loading
                ? events.length > 0
                  ? `${events.length} event${events.length > 1 ? "s" : ""} scheduled`
                  : "No events scheduled right now"
                : "Loading events…"
            }
          />

          {loading && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "18px",
              marginBottom: "60px",
            }}>
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          )}

          {!loading && events.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "48px 20px",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #bae6fd",
              marginBottom: "60px",
            }}>
              <div style={{
                width: "48px", height: "48px",
                background: "#e0f2fe",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <span style={{ fontSize: "1.2rem" }}>📅</span>
              </div>
              <p style={{
                color: "#64748b",
                fontSize: "0.92rem",
                margin: 0,
                lineHeight: 1.6,
              }}>
                No events posted yet.<br />
                <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Check back soon — we update this regularly.</span>
              </p>
            </div>
          )}

          {!loading && events.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginBottom: "64px",
            }}>
              {events.map((ev) => <EventCard key={ev._id} event={ev} userProfile={userProfile} />)}
            </div>
          )}

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "52px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "#bae6fd" }} />
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.5px",
              textTransform: "uppercase", color: "#94a3b8",
            }}>
              Sunshine, Joska
            </div>
            <div style={{ flex: 1, height: "1px", background: "#bae6fd" }} />
          </div>

          <SectionHeading
            title="Ongoing & Upcoming Projects"
            subtitle={`${projects.length} active initiatives in our community`}
          />

          {loading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}>
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : projects.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 20px",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #bae6fd",
            }}>
              <p style={{ color: "#64748b", margin: 0 }}>No active projects at the moment.</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}>
              {projects.map((proj) => (
                <ProjectCard
                  key={proj._id}
                  project={proj}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default Events;