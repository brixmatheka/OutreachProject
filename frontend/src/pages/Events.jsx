import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CloseButton from "../components/CloseButton";
import { API_URL } from "../apiConfig";

const fileUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatEventDate = (value, options) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", options);
};

const getDaysUntil = (value) => {
  const eventDate = value ? new Date(value) : null;
  if (!eventDate || Number.isNaN(eventDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.max(Math.ceil((eventDate - today) / 86400000), 0);
};

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
    @keyframes eventBannerDrift {
      0% {
        transform: translate3d(-22%, 0, 0) scale(1.08);
      }
      100% {
        transform: translate3d(0, 0, 0) scale(1.08);
      }
    }
    @keyframes eventBannerLight {
      0% {
        transform: translateX(-130%) skewX(-18deg);
        opacity: 0;
      }
      18% {
        opacity: 0.42;
      }
      52% {
        opacity: 0.18;
      }
      100% {
        transform: translateX(150%) skewX(-18deg);
        opacity: 0;
      }
    }

    .events-page {
      animation: fadeIn 0.45s ease both;
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(180deg, #f8fbff 0%, #eef6fb 52%, #f8fafc 100%) !important;
    }
    .events-page-shell {
      max-width: 1120px;
      margin: 0 auto;
    }
    .event-hero-showcase {
      display: grid;
      grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
      gap: 22px;
      align-items: stretch;
      margin: 0 auto 54px;
    }
    .event-hero-media {
      position: relative;
      min-height: 470px;
      border-radius: 28px;
      overflow: hidden;
      isolation: isolate;
      box-shadow: 0 34px 90px rgba(8, 47, 73, 0.26);
      background: linear-gradient(135deg, #082f49, #075985 58%, #0ea5e9);
    }
    .event-hero-media::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      background:
        linear-gradient(90deg, rgba(8, 47, 73, 0.9), rgba(8, 47, 73, 0.5) 48%, rgba(8, 47, 73, 0.12)),
        radial-gradient(circle at 12% 18%, rgba(255,255,255,0.24), transparent 28%);
      pointer-events: none;
    }
    .event-hero-media::after {
      content: "";
      position: absolute;
      inset: -30% auto -30% -10%;
      width: 42%;
      z-index: 2;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent);
      animation: eventBannerLight 11s ease-in-out infinite;
      pointer-events: none;
    }
    .event-hero-img {
      position: absolute;
      inset: 0 auto 0 0;
      width: 146%;
      height: 100%;
      max-width: none;
      object-fit: cover;
      animation: eventBannerDrift 24s ease-in-out infinite alternate;
      will-change: transform;
    }
    .event-hero-content {
      position: relative;
      z-index: 3;
      min-height: 470px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: clamp(26px, 5vw, 54px);
      color: #fff;
    }
    .event-kicker {
      width: fit-content;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(224, 242, 254, 0.15);
      color: #bae6fd;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .event-hero-title {
      margin: 14px 0 12px;
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: clamp(2.7rem, 6vw, 5.6rem);
      font-weight: 400;
      line-height: 0.95;
      letter-spacing: 0;
      text-shadow: 0 24px 50px rgba(0,0,0,0.34);
    }
    .event-hero-copy {
      max-width: 650px;
      margin: 0;
      color: rgba(255,255,255,0.86);
      font-size: 0.98rem;
      line-height: 1.75;
    }
    .event-hero-panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 470px;
      padding: 26px;
      border-radius: 28px;
      background:
        linear-gradient(145deg, rgba(255,255,255,0.92), rgba(240,249,255,0.78)),
        radial-gradient(circle at top right, rgba(14,165,233,0.22), transparent 36%);
      box-shadow: 0 26px 70px rgba(8, 47, 73, 0.13);
      backdrop-filter: blur(14px);
    }
    .event-date-lockup {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      align-items: center;
    }
    .event-date-badge {
      width: 76px;
      height: 76px;
      display: grid;
      place-items: center;
      border-radius: 22px;
      background: linear-gradient(135deg, #0369a1, #0ea5e9);
      color: #fff;
      box-shadow: 0 18px 40px rgba(3, 105, 161, 0.26);
    }
    .event-countdown-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin: 22px 0;
    }
    .event-countdown-chip {
      padding: 14px 10px;
      border-radius: 18px;
      background: rgba(255,255,255,0.82);
      box-shadow: 0 14px 30px rgba(8, 47, 73, 0.08);
      text-align: center;
    }
    .event-countdown-chip strong {
      display: block;
      color: #0c4a6e;
      font-size: 1.35rem;
      line-height: 1;
    }
    .event-countdown-chip span {
      display: block;
      margin-top: 5px;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .event-visit-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .event-primary-action,
    .event-secondary-action {
      min-height: 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 14px;
      padding: 12px 14px;
      font: inherit;
      font-size: 0.86rem;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
    }
    .event-primary-action {
      background: linear-gradient(135deg, #0369a1, #0ea5e9);
      color: #fff;
      box-shadow: 0 16px 34px rgba(3, 105, 161, 0.24);
    }
    .event-secondary-action {
      background: rgba(255,255,255,0.82);
      color: #0c4a6e;
      box-shadow: 0 14px 30px rgba(8, 47, 73, 0.08);
    }
    .event-idea-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 42px;
    }
    .event-idea-card {
      min-height: 126px;
      padding: 20px;
      border-radius: 22px;
      background: rgba(255,255,255,0.78);
      box-shadow: 0 18px 46px rgba(8, 47, 73, 0.09);
      backdrop-filter: blur(12px);
    }
    .event-idea-card strong {
      display: block;
      color: #0c4a6e;
      margin-bottom: 6px;
      font-size: 1rem;
    }
    .event-idea-card span {
      color: #64748b;
      font-size: 0.86rem;
      line-height: 1.6;
    }

    .ev-card {
      border: none !important;
      border-radius: 24px !important;
      background: rgba(255,255,255,.94) !important;
      box-shadow: 0 18px 48px rgba(15, 49, 77, 0.12) !important;
      transition: transform 0.28s ease, box-shadow 0.28s ease;
    }
    .ev-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 36px rgba(3,105,161,0.14) !important;
    }
    .event-banner-shell {
      position: relative;
      width: 100%;
      height: 220px;
      overflow: hidden;
      isolation: isolate;
      background: linear-gradient(135deg, #082f49, #0369a1 58%, #38bdf8);
    }
    .event-banner-shell::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      background:
        linear-gradient(90deg, rgba(8,47,73,0.32), transparent 42%, rgba(8,47,73,0.16)),
        radial-gradient(circle at 18% 18%, rgba(255,255,255,0.22), transparent 24%);
      pointer-events: none;
    }
    .event-banner-shell::after {
      content: "";
      position: absolute;
      inset: -20% auto -20% 0;
      z-index: 2;
      width: 42%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.36), transparent);
      animation: eventBannerLight 9s ease-in-out infinite;
      pointer-events: none;
    }
    .event-banner-img {
      position: absolute;
      inset: 0 auto 0 0;
      width: 138%;
      height: 100%;
      object-fit: cover;
      display: block;
      max-width: none;
      animation: eventBannerDrift 22s ease-in-out infinite alternate;
      will-change: transform;
    }
    .ev-card:hover .event-banner-img {
      animation-duration: 8s;
    }

    .proj-card {
      border: none !important;
      border-radius: 24px !important;
      background: rgba(255,255,255,.94) !important;
      box-shadow: 0 18px 48px rgba(15, 49, 77, 0.11) !important;
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

    .content-carousel {
      display: flex !important;
      grid-template-columns: none !important;
      gap: 20px !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 8px 4px 26px;
      margin-inline: -4px;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      overscroll-behavior-inline: contain;
      scrollbar-width: thin;
      scrollbar-color: #7dd3fc rgba(186,230,253,.28);
    }
    .content-carousel::-webkit-scrollbar { height: 7px; }
    .content-carousel::-webkit-scrollbar-track { background: rgba(186,230,253,.3); border-radius: 999px; }
    .content-carousel::-webkit-scrollbar-thumb { background: linear-gradient(90deg,#0369a1,#38bdf8); border-radius: 999px; }
    .content-carousel > * {
      flex: 0 0 clamp(290px, 42vw, 410px);
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
    .announcement-carousel > * { flex-basis: clamp(280px, 48vw, 470px); }
    .announcement-card {
      position: relative;
      min-height: 210px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: 22px !important;
      background: linear-gradient(145deg, rgba(255,255,255,.13), rgba(125,211,252,.07)) !important;
      box-shadow: 0 18px 42px rgba(2,6,23,.2);
      transition: transform .25s ease, border-color .25s ease;
    }
    .announcement-card:hover { transform: translateY(-4px); border-color: rgba(125,211,252,.48) !important; }
    #announcements h2 { color: #f8fafc !important; }
    #announcements > div:first-child p { color: #bae6fd !important; }
    .announcement-card button {
      min-height: 38px;
      padding: 8px 12px;
      border: 1px solid rgba(125,211,252,.28);
      border-radius: 10px;
      background: rgba(14,165,233,.13);
      color: #e0f2fe;
      font: inherit;
      font-size: .76rem;
      font-weight: 800;
      cursor: pointer;
    }
    .announcement-card button:hover { background: rgba(14,165,233,.28); }
    .section-carousel-hint {
      display: block;
      margin: -20px 0 18px;
      color: #64748b;
      font-size: .76rem;
      font-weight: 700;
    }

    @media (max-width: 640px) {
      .event-hero-showcase,
      .event-idea-strip {
        grid-template-columns: 1fr;
      }
      .event-hero-media,
      .event-hero-content,
      .event-hero-panel {
        min-height: 380px;
      }
      .event-hero-title {
        font-size: 2.7rem;
      }
      .event-visit-actions,
      .event-countdown-grid {
        grid-template-columns: 1fr;
      }
      .event-banner-shell {
        height: 178px;
      }
      .event-banner-img {
        width: 150%;
        animation-duration: 24s;
      }
      .content-carousel {
        gap: 14px !important;
        margin-right: -24px;
        padding-right: 24px;
      }
      .content-carousel > *,
      .announcement-carousel > * {
        flex-basis: min(84vw, 340px);
      }
      #announcements > div:nth-of-type(2) {
        grid-template-columns: 1fr !important;
      }
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
          letterSpacing: 0,
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
function FeaturedEventHero({ event }) {
  if (!event) {
    return (
      <section className="event-hero-showcase">
        <div className="event-hero-media">
          <div className="event-hero-content">
            <span className="event-kicker">Gather With Us</span>
            <h1 className="event-hero-title">A church family with room for you</h1>
            <p className="event-hero-copy">
              Check back for worship nights, services, outreach moments, and community gatherings from Outreach Hope Church Sunshine.
            </p>
          </div>
        </div>
        <div className="event-hero-panel">
          <div>
            <span className="event-kicker" style={{ color: "#0369a1", background: "#e0f2fe" }}>This Week</span>
            <h2 style={{ margin: "14px 0 8px", color: "#0c4a6e", fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "2rem", fontWeight: 400 }}>
              Stay connected
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.7, margin: 0 }}>
              Events will appear here as soon as they are scheduled by the church team.
            </p>
          </div>
          <div className="event-visit-actions">
            <a className="event-primary-action" href="#events-list">View Events</a>
            <a className="event-secondary-action" href="#projects-list">Projects</a>
          </div>
        </div>
      </section>
    );
  }

  const daysUntil = getDaysUntil(event.date);
  const banner = fileUrl(event.banner);
  const dateLabel = formatEventDate(event.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const day = formatEventDate(event.date, { day: "numeric" });
  const month = formatEventDate(event.date, { month: "short" });

  return (
    <section className="event-hero-showcase">
      <div className="event-hero-media">
        {banner && <img className="event-hero-img" src={banner} alt="" />}
        <div className="event-hero-content">
          <span className="event-kicker">Next Gathering</span>
          <h1 className="event-hero-title">{event.title}</h1>
          <p className="event-hero-copy">
            {event.description || "Come worship, connect, and grow with the Outreach Hope Church Sunshine family."}
          </p>
        </div>
      </div>

      <aside className="event-hero-panel">
        <div>
          <div className="event-date-lockup">
            <div className="event-date-badge">
              <div style={{ textAlign: "center" }}>
                <strong style={{ display: "block", fontSize: "1.9rem", lineHeight: 1 }}>{day || "--"}</strong>
                <span style={{ display: "block", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{month || "Soon"}</span>
              </div>
            </div>
            <div>
              <span style={{ color: "#0ea5e9", fontSize: "0.74rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>Plan Your Visit</span>
              <h2 style={{ margin: "5px 0 0", color: "#0c4a6e", fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.8rem", fontWeight: 400 }}>
                {dateLabel || "Coming soon"}
              </h2>
            </div>
          </div>

          <div className="event-countdown-grid">
            <div className="event-countdown-chip">
              <strong>{daysUntil ?? "--"}</strong>
              <span>{daysUntil === 1 ? "Day" : "Days"}</span>
            </div>
            <div className="event-countdown-chip">
              <strong>{event.time || "--"}</strong>
              <span>Time</span>
            </div>
            <div className="event-countdown-chip">
              <strong>{event.attendeesCount || 0}</strong>
              <span>Going</span>
            </div>
          </div>

          <p style={{ margin: 0, color: "#475569", lineHeight: 1.72, fontSize: "0.92rem" }}>
            {event.location ? `Location: ${event.location}` : "Location details will be shared by the church team."}
          </p>
        </div>

        <div className="event-visit-actions">
          <a className="event-primary-action" href="#events-list">Reserve Interest</a>
          <a className="event-secondary-action" href="#projects-list">Serve With Us</a>
        </div>
      </aside>
    </section>
  );
}

function EventIdeaStrip() {
  return (
    <section className="event-idea-strip" aria-label="Church event highlights">
      <div className="event-idea-card">
        <strong>Worship Together</strong>
        <span>Services and gatherings shaped for prayer, worship, and the Word.</span>
      </div>
      <div className="event-idea-card">
        <strong>Bring Someone</strong>
        <span>Invite family, neighbors, and friends into a warm church community.</span>
      </div>
      <div className="event-idea-card">
        <strong>Serve Sunshine</strong>
        <span>Join outreach and project moments that bless the local community.</span>
      </div>
    </section>
  );
}

function EventCard({ event, userProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [attendeeDraft, setAttendeeDraft] = useState({});

  const defaultAttendeeData = useMemo(() => {
    if (userProfile) {
      const name = `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim();
      return { name, phone: userProfile.phone || "" };
    }

    const storedName = localStorage.getItem("memberName");
    const name = storedName ? `${storedName} ${localStorage.getItem("memberLastName") || ""}`.trim() : "";
    return { name, phone: localStorage.getItem("memberPhone") || "" };
  }, [userProfile]);

  const attendeeData = useMemo(() => ({
    name: attendeeDraft.name ?? defaultAttendeeData.name,
    phone: attendeeDraft.phone ?? defaultAttendeeData.phone,
  }), [attendeeDraft.name, attendeeDraft.phone, defaultAttendeeData.name, defaultAttendeeData.phone]);

  const alreadyConfirmed = Boolean(attendeeData.phone && event.attendees?.some((attendee) => attendee.phone === attendeeData.phone));
  const showExpanded = expanded || confirmed || alreadyConfirmed;
  const showConfirmed = confirmed || alreadyConfirmed;

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
      {/* Banner image at top */}
      {event.banner && (
        <div className="event-banner-shell">
          <img
            className="event-banner-img"
            src={fileUrl(event.banner)}
            alt={`${event.title} banner`}
          />
        </div>
      )}

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
              {!showExpanded ? (
                <button
                  onClick={() => setExpanded(true)}
                  style={{
                    background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1",
                    padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  I Will Attend
                </button>
              ) : !showConfirmed ? (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", animation: "fadeIn 0.3s" }}>
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600, display: "block", marginBottom: "10px" }}>Confirm Attendance</span>
                  <input type="text" placeholder="Full Name" value={attendeeData.name} onChange={e => setAttendeeDraft((prev) => ({ ...prev, name: e.target.value }))} style={{ width: "100%", marginBottom: "8px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }} />

                  <input type="tel" placeholder="Phone Number" value={attendeeData.phone} onChange={e => setAttendeeDraft((prev) => ({ ...prev, phone: e.target.value }))} style={{ width: "100%", marginBottom: "12px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }} />

                  <button
                    onClick={async () => {
                      if (!attendeeData.name || !attendeeData.phone) {
                        alert("Please fill in your name and phone number to confirm attendance.");
                        return;
                      }
                      try {
                        await axios.post(`/events/${event._id}/attend`, attendeeData);
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
                  <span aria-label="Attendance confirmed" title="Attendance confirmed" style={{ fontSize: "1.05rem", fontWeight: 900 }}>✓</span>
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
function AnnouncementBoard({ announcements }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const categories = ["All", ...new Set(announcements.map((item) => item.category || "General"))];
  const visible = announcements
    .filter((item) => category === "All" || (item.category || "General") === category)
    .filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || new Date(b.date) - new Date(a.date));
  const share = async (item) => {
    const data = { title: item.title, text: item.description, url: `${window.location.origin}/events#announcements` };
    if (navigator.share) return navigator.share(data).catch(() => {});
    await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url}`);
    alert("Announcement copied to clipboard.");
  };
  if (!announcements.length) return (
    <section id="announcements" style={{ margin: "0 0 48px", padding: "clamp(18px,4vw,32px)", borderRadius: "24px", background: "linear-gradient(145deg,#082f49,#0c4a6e)", color: "white", boxShadow: "0 24px 55px rgba(3,105,161,.2)" }}>
      <SectionHeading title="1. Church Announcements" subtitle="Important updates and ministry notices appear here first." />
      <p style={{ margin: 0, padding: "18px", borderRadius: "14px", background: "rgba(255,255,255,.08)", color: "#bae6fd" }}>
        There are no active announcements right now.
      </p>
    </section>
  );
  return (
    <section id="announcements" style={{ margin: "0 0 48px", padding: "clamp(18px,4vw,32px)", borderRadius: "24px", background: "linear-gradient(145deg,#082f49,#0c4a6e)", color: "white", boxShadow: "0 24px 55px rgba(3,105,161,.2)" }}>
      <SectionHeading title="1. Church Announcements" subtitle="Important updates, ministry notices, and opportunities for our church family." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) minmax(150px,220px)", gap: "10px", marginBottom: "18px" }}>
        <input aria-label="Search announcements" placeholder="Search announcements..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #7dd3fc", fontSize: "16px" }} />
        <select aria-label="Filter announcement category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "12px", borderRadius: "10px", fontSize: "16px" }}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <span className="section-carousel-hint" style={{ color: "#bae6fd" }}>Swipe or scroll to explore announcements →</span>
      <div className="content-carousel announcement-carousel">
        {visible.map((item) => <article className="announcement-card" key={item._id} style={{ padding: "18px", border: `1px solid ${item.isPinned ? "rgba(251,191,36,.55)" : "rgba(255,255,255,.14)"}` }}>
          <div><div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: ".7rem", color: "#bae6fd" }}>{item.isPinned && <b style={{ color: "#fde68a" }}>PINNED</b>}<span>{item.category || "General"}</span><span>{item.targetAudience || "Everyone"}</span></div><h3 style={{ margin: "7px 0", color: "white" }}>{item.title}</h3><p style={{ margin: "0 0 10px", color: "#cbd5e1", lineHeight: 1.55 }}>{item.description?.slice(0, 180)}{item.description?.length > 180 ? "..." : ""}</p><div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}><button onClick={() => setSelected(item)}>View details</button><button onClick={() => share(item)}>Share</button>{item.pdfUrl && <a href={fileUrl(item.pdfUrl)} target="_blank" rel="noreferrer" style={{ color: "#fde68a" }}>Open PDF</a>}</div></div>
        </article>)}
      </div>
      {selected && <div role="dialog" aria-modal="true" onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,6,23,.82)", display: "grid", placeItems: "center", padding: "18px" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "min(620px,100%)", maxHeight: "85vh", overflow: "auto", background: "#fff", color: "#0f172a", borderRadius: "20px", padding: "24px" }}><button onClick={() => setSelected(null)} style={{ float: "right" }}>Close</button><h2>{selected.title}</h2><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{selected.description}</p><p><b>Audience:</b> {selected.targetAudience}</p>{selected.pdfUrl && <a href={fileUrl(selected.pdfUrl)} target="_blank" rel="noreferrer">View attached PDF</a>}</div></div>}
    </section>
  );
}

function Events() {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/me");
      setUserProfile(res.data);
    } catch {
      setUserProfile(null);
    }
  };

  const fetchData = async () => {
    try {
      const [evRes, projRes] = await Promise.all([
        axios.get("/events"),
        axios.get("/projects")
      ]);

      // Filter out past events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeEvents = evRes.data.filter(ev => ev.contentType !== "announcement" && (() => {
        const evDate = new Date(ev.date);
        evDate.setHours(0, 0, 0, 0);
        return evDate >= today;
      })());

      setEvents(activeEvents);
      setAnnouncements(evRes.data.filter((item) => item.contentType === "announcement"));
      setProjects(projRes.data);
    } catch {
      setEvents([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  const featuredEvent = events[0] || null;

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

        <div className="events-page-shell">
          <AnnouncementBoard announcements={announcements} />
          <FeaturedEventHero event={featuredEvent} />
          <EventIdeaStrip />

        {/* ── Page header ── */}
        <div style={{
          maxWidth: "680px",
          margin: "0 auto 42px",
          textAlign: "center",
          paddingTop: "8px",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: 0,
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
            letterSpacing: 0,
          }}>
            Church Calendar
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
        <div id="events-list" style={{ maxWidth: "1060px", margin: "0 auto" }}>

          {/* Events section */}
          <SectionHeading
            title="2. Upcoming Events"
            subtitle={
              !loading
                ? events.length > 0
                  ? `${events.length} event${events.length > 1 ? "s" : ""} scheduled`
                  : "No events scheduled right now"
                : "Loading events…"
            }
          />
          {!loading && events.length > 1 && <span className="section-carousel-hint">Swipe or scroll through upcoming events →</span>}

          {loading && (
            <div className="content-carousel" style={{
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
            <div className="content-carousel" style={{
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
              fontSize: "0.75rem", fontWeight: 600, letterSpacing: 0,
              textTransform: "uppercase", color: "#94a3b8",
            }}>
              Sunshine, Joska
            </div>
            <div style={{ flex: 1, height: "1px", background: "#bae6fd" }} />
          </div>

          <div id="projects-list">
            <SectionHeading
              title="3. Ongoing & Upcoming Projects"
              subtitle={`${projects.length} active initiatives in our community`}
            />
            {!loading && projects.length > 1 && <span className="section-carousel-hint">Swipe or scroll through church projects →</span>}

            {loading ? (
              <div className="content-carousel" style={{
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
              <div className="content-carousel" style={{
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
        </div>
      </div>
    </>
  );
}

export default Events;
