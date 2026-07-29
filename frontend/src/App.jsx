import { lazy, Suspense, useState, useEffect } from 'react'
import axios, { API_URL } from "./apiConfig" // Ensure axios is configured with auth interceptor
import './App.css'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { canAccessAdminSection, clearAdminAuth, getAdminAuth, storeAdminAuth } from "./adminAccess"
import AdminPortalNav from "./components/AdminPortalNav"

const About = lazy(() => import("./pages/About"));
const AdminBaptism = lazy(() => import("./pages/AdminBaptism"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AdminGallery = lazy(() => import("./pages/AdminGallery"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminMembers = lazy(() => import("./pages/AdminMembers"));
const AdminMinisters = lazy(() => import("./pages/AdminMinisters"));
const AdminPrayerRequests = lazy(() => import("./pages/AdminPrayerRequests"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminProjects = lazy(() => import("./pages/AdminProjects"));
const AdminSermons = lazy(() => import("./pages/AdminSermons"));
const AdminTransactions = lazy(() => import("./pages/AdminTransactions"));
const BaptismRequest = lazy(() => import("./pages/BaptismRequest"));
const Bible = lazy(() => import("./pages/Bible"));
const Careers = lazy(() => import("./pages/Careers"));
const Chatbox = lazy(() => import("./pages/Chatbox"));
const Events = lazy(() => import("./pages/Events"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Give = lazy(() => import("./pages/Give"));
const MemberLogin = lazy(() => import("./pages/MemberLogin"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const MemberSignup = lazy(() => import("./pages/MemberSignup"));
const Ministers = lazy(() => import("./pages/Ministers"));
const OnlineService = lazy(() => import("./pages/OnlineService"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const PrayerRequests = lazy(() => import("./pages/PrayerRequests"));
const Sermons = lazy(() => import("./pages/Sermons"));
const Services = lazy(() => import("./pages/Services"));

const PageLoader = () => (
  <div className="route-loader" role="status" aria-live="polite">
    <span className="route-loader-spinner" aria-hidden="true" />
    <span>Loading page…</span>
  </div>
);

// Protected Route for Members
const MemberProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;
    axios.get("/auth/me")
      .then((res) => {
        if (!active) return;
        localStorage.setItem("memberSession", "true");
        localStorage.setItem("memberName", res.data.firstName);
        localStorage.setItem("memberLastName", res.data.lastName || "");
        localStorage.setItem("memberId", res.data.memberId || "");
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("memberSession");
        localStorage.removeItem("memberToken");
        localStorage.setItem("redirectAfterLogin", location.pathname);
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (status === "checking") return null;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return children;
};

const AdminProtectedRoute = ({ section, children }) => {
  const location = useLocation();
  const initialAuth = getAdminAuth();
  const initiallyAllowed = Boolean(
    initialAuth.token &&
    initialAuth.role &&
    canAccessAdminSection(section)
  );
  const [status, setStatus] = useState(() => {
    if (!initialAuth.token || !initialAuth.role) return "unauthenticated";
    return initiallyAllowed ? "authenticated" : "checking";
  });
  const [allowed, setAllowed] = useState(initiallyAllowed);

  useEffect(() => {
    let active = true;
    const auth = getAdminAuth();
    const hasStoredAccess = Boolean(auth.token && auth.role && canAccessAdminSection(section));
    const hasRealToken = auth.token && auth.token !== "cookie-session";

    if (!auth.token || !auth.role) {
      clearAdminAuth();
      return () => {
        active = false;
      };
    }

    axios.get("/admin/me", hasRealToken ? { headers: { Authorization: `Bearer ${auth.token}` } } : undefined)
      .then((res) => {
        if (!active) return;
        storeAdminAuth(res.data);
        setAllowed(canAccessAdminSection(section));
        setStatus("authenticated");
      })
      .catch((err) => {
        if (!active) return;
        const statusCode = err.response?.status;
        if (hasStoredAccess && ![401, 403].includes(statusCode)) {
          return;
        }
        clearAdminAuth();
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, [section]);

  if (status === "checking") return null;
  if (status === "unauthenticated") return <Navigate to="/admin-login" replace state={{ from: location.pathname }} />;
  if (!allowed) return <Navigate to="/admin-dashboard" replace />;
  return (
    <div className="admin-portal-frame">
      <AdminPortalNav />
      <div className="admin-portal-content">{children}</div>
    </div>
  );
};

function App() {
  const [memberName, setMemberName] = useState(localStorage.getItem("memberName"))
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [showEventAnnouncement, setShowEventAnnouncement] = useState(false);
  const [eventAnnouncementClosing, setEventAnnouncementClosing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const applyPreferences = (event) => {
      let preferences = event?.detail;
      if (!preferences) {
        try {
          preferences = JSON.parse(localStorage.getItem("memberPreferences") || "{}");
        } catch {
          preferences = {};
        }
      }
      const root = document.documentElement;
      root.dataset.memberTheme = preferences.theme || "dark";
      root.dataset.memberTextSize = preferences.textSize || "comfortable";
      root.dataset.reduceMotion = preferences.reducedMotion ? "true" : "false";
    };
    applyPreferences();
    window.addEventListener("member-preferences-changed", applyPreferences);
    return () => window.removeEventListener("member-preferences-changed", applyPreferences);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.body.classList.toggle("mobile-menu-open", isMobileMenuOpen);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    axios.get("/auth/me")
      .then((res) => {
        localStorage.setItem("memberSession", "true");
        localStorage.setItem("memberName", res.data.firstName);
        localStorage.setItem("memberLastName", res.data.lastName || "");
        localStorage.setItem("memberId", res.data.memberId || "");
        setMemberName(res.data.firstName);
      })
      .catch(() => {
        localStorage.removeItem("memberSession");
        localStorage.removeItem("memberToken");
        localStorage.removeItem("memberName");
        localStorage.removeItem("memberLastName");
        localStorage.removeItem("memberId");
        setMemberName(null);
      });
  }, []);

  const fileUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const homeBackgroundVars = {
    "--home-hero-image": `url("${fileUrl("/uploads/1780993875082-672921.JPG")}")`,
    "--home-card-image-1": `url("${fileUrl("/uploads/1780993874724-250065.JPG")}")`,
    "--home-card-image-2": `url("${fileUrl("/uploads/1780993874956-76107.JPG")}")`,
    "--home-card-image-3": `url("${fileUrl("/uploads/1780993874806-394884.JPG")}")`,
    "--home-card-image-4": `url("${fileUrl("/uploads/1780993874755-44006.JPG")}")`,
    "--home-card-image-5": `url("${fileUrl("/uploads/1780993875049-294274.JPG")}")`
  };

  const formatEventDate = (value) => {
    if (!value) return "Date coming soon";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date coming soon";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const closeEventAnnouncement = () => {
    setEventAnnouncementClosing(true);
    window.setTimeout(() => {
      setShowEventAnnouncement(false);
      setEventAnnouncementClosing(false);
    }, 420);
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      return undefined;
    }

    let active = true;
    axios.get("/events")
      .then((res) => {
        if (!active) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextEvent = (res.data || [])
          .filter((event) => {
            const eventDate = new Date(event.date);
            if (Number.isNaN(eventDate.getTime())) return false;
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        setUpcomingEvent(nextEvent || null);
        setShowEventAnnouncement(Boolean(nextEvent));
        setEventAnnouncementClosing(false);
      })
      .catch(() => {
        if (!active) return;
        setUpcomingEvent(null);
        setShowEventAnnouncement(false);
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!showEventAnnouncement) return undefined;
    const timer = window.setTimeout(closeEventAnnouncement, 5000);
    return () => window.clearTimeout(timer);
  }, [showEventAnnouncement]);

  const openEventAnnouncement = () => {
    closeEventAnnouncement();
    navigate("/events");
  };

  const renderEventAnnouncement = () => {
    if (location.pathname !== "/") return null;
    if (!upcomingEvent || !showEventAnnouncement) return null;
    const banner = fileUrl(upcomingEvent.banner);

    return (
      <aside
        className={`home-event-banner ${banner ? "has-image" : "no-image"} ${eventAnnouncementClosing ? "closing" : ""}`}
        role="button"
        tabIndex={0}
        onClick={openEventAnnouncement}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openEventAnnouncement();
          }
        }}
        aria-label={`Open upcoming event ${upcomingEvent.title}`}
      >
        <span className="home-event-banner-shine" aria-hidden="true" />
        <span className="home-event-banner-stripe" aria-hidden="true" />
        {banner && (
          <span className="home-event-banner-media" aria-hidden="true">
            <img src={banner} alt="" className="home-event-banner-img" />
          </span>
        )}
        <div className="home-event-banner-body">
          <span className="home-event-banner-kicker">
            <span className="home-event-banner-dot" aria-hidden="true" />
            Upcoming Event
          </span>
          <strong className="home-event-banner-title">{upcomingEvent.title}</strong>
          <div className="home-event-banner-meta">
            <span>{formatEventDate(upcomingEvent.date)}</span>
            {upcomingEvent.time && <span>{upcomingEvent.time}</span>}
          </div>
          {upcomingEvent.location && <span className="home-event-banner-location">{upcomingEvent.location}</span>}
          <span className="home-event-banner-action" aria-hidden="true">View details</span>
        </div>
        <button
          type="button"
          className="home-event-banner-close"
          aria-label="Close event announcement"
          onClick={(event) => {
            event.stopPropagation();
            closeEventAnnouncement();
          }}
        >
          ×
        </button>
      </aside>
    );
  };

  const renderHeader = () => (
    <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-top">
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="" width="45" height="45" decoding="async" className="brand-logo-img" />
            <div className="brand-text">
              <span className="brand-name">OUTREACH HOPE CHURCH SUNSHINE</span>
              <span className="brand-tagline">HOUSE OF BREAD</span>
            </div>
          </Link>
        </div>

        {/* Desktop Auth */}
        <div className="desktop-auth">
          {memberName ? (
            <div className="user-profile">
              <div className="user-info">
                <span className="welcome-text">Hey <strong>{memberName}</strong></span>
                <Link to="/profile" className="profile-link">Profile &amp; Settings</Link>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/signup" className="signup-btn">Sign Up</Link>
            </div>
          )}
        </div>

        <button
          className="mobile-toggle"
          type="button"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      <nav id="primary-navigation" className={`nav-container ${isMobileMenuOpen ? 'open' : ''}`} aria-label="Primary navigation">
        {/* Mobile Auth */}
        <div className="mobile-auth">
          {memberName ? (
            <div className="user-profile mobile-profile">
              <div className="user-info">
                <span className="welcome-text">Hey <strong>{memberName}</strong></span>
              </div>
            </div>
          ) : (
            <div className="auth-buttons mobile-auth-buttons">
              <Link to="/login" className="login-btn" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="signup-btn" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="feature-nav">
          <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <Link to="/services" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
          <Link to="/ministers" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Ministers</Link>
          <Link to="/events" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
          <Link to="/sermons" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Sermons</Link>
          <Link to="/gallery" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
          <Link to="/careers" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Careers</Link>
          <Link to="/give" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Give</Link>
          <Link to="/bible" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Bible</Link>
          <Link to="/prayerRequests" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Prayer Requests</Link>
          <Link to="/baptism" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Baptism</Link>
          <Link to="/chatbot" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Chatbot</Link>
          <Link to="/online-service" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Online Service</Link>
          {memberName && <Link to="/profile" className="nav-link mobile-profile-link" onClick={() => setIsMobileMenuOpen(false)}>Profile &amp; Settings</Link>}
        </div>

      </nav>
    </header>
  );

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Home route */}
      <Route path="/" element={
        <div className="app-root" style={homeBackgroundVars}>
          {renderHeader()}
          {renderEventAnnouncement()}

          <main className="app-main">
            <section className="hero">
              <div className="hero-content">
                <h1>OUTREACH HOPE CHURCH SUNSHINE</h1>
                <p className="hero-subtitle">"Where the Word is Preached and Love is Experienced"</p>
                <div className="hero-cta">
                  <Link to="/events" className="hero-btn-primary">Events</Link>
                  <Link to="/bible" className="hero-btn-secondary">Bible</Link>
                  <Link to="/give" className="hero-btn-secondary">Give Online</Link>
                </div>
              </div>

              <div className="feature-content">
                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon">ℹ</div>
                    <div>
                      <div className="feature-title">About OHC</div>
                      <div className="feature-description">
                        Welcome to OUTREACH HOPE CHURCH SUNSHINE (OHC) — THE HOUSE OF BREAD
                      </div>
                    </div>
                  </div>
                  <ul className="feature-list">
                    <li>Our mission: Proclaim the Gospel and nurture believers toward maturity.</li>
                    <li>Our vision: A Christ-centered community raising mature disciples.</li>
                    <li>Goal: To plant 10 churches and grow to 500 members in 5 years.</li>
                  </ul>
                  <div className="feature-footer">
                    <span className="feature-pill">Family church</span>
                    <span className="feature-pill">House of Bread</span>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon">🙏</div>
                    <div>
                      <div className="feature-title">Join a Service</div>
                      <div className="feature-description">Experience the presence of God with us</div>
                    </div>
                  </div>
                  <ul className="feature-list">
                    <li>Sunday Worship: Experience powerful word and vibrant worship.</li>
                    <li>Mid-Week Services: Deep dive into scripture and prayer.</li>
                    <li>Online Service: Join from anywhere in the world.</li>
                  </ul>
                  <div className="feature-footer">
                    <span className="feature-pill">In-Person</span>
                    <Link to="/online-service" className="feature-pill" style={{ textDecoration: 'none' }}>Live Stream</Link>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon">📖</div>
                    <div>
                      <div className="feature-title">Bible & Prayer</div>
                      <div className="feature-description">Read scripture and send prayer requests with one click.</div>
                    </div>
                  </div>
                  <ul className="feature-list">
                    <li>Daily scripture reflections for encouragement and growth.</li>
                    <li>Read and download sermon notes for personal study.</li>
                    <li>Submit prayer requests directly from the church portal.</li>
                  </ul>
                  <div className="feature-footer">
                    <Link to="/bible" className="feature-pill" style={{ textDecoration: 'none' }}>Open Bible</Link>
                    <Link to="/sermons" className="feature-pill" style={{ textDecoration: 'none' }}>Sermons</Link>
                    <Link to="/prayerRequests" className="feature-pill" style={{ textDecoration: 'none' }}>Prayer Requests</Link>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon">🎥</div>
                    <div>
                      <div className="feature-title">Gallery & Media</div>
                      <div className="feature-description">Enjoy moments from church life, events, and ministry.</div>
                    </div>
                  </div>
                  <ul className="feature-list">
                    <li>Explore inspiring images from services and outreach.</li>
                    <li>Browse recent events and church highlights.</li>
                    <li>Share the story of what God is doing in our community.</li>
                  </ul>
                  <div className="feature-footer">
                    <Link to="/gallery" className="feature-pill" style={{ textDecoration: 'none' }}>View Gallery</Link>
                    <Link to="/events" className="feature-pill" style={{ textDecoration: 'none' }}>Upcoming Events</Link>
                  </div>
                </div>

                <div className="feature-card" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,47,73,0.95))", borderColor: "rgba(56,189,248,0.35)" }}>
                  <div className="feature-header">
                    <div className="feature-icon">💼</div>
                    <div>
                      <div className="feature-title">Careers & Ideas Hub</div>
                      <div className="feature-description">Discover opportunities, share bold ideas, and grow with a vision-driven church community.</div>
                    </div>
                  </div>
                  <ul className="feature-list">
                    <li>See ministry and community roles that match your calling.</li>
                    <li>Advertise your ideas, projects, and creative solutions.</li>
                    <li>Be part of a vibrant space where vision meets action.</li>
                  </ul>
                  <div className="feature-footer">
                    <Link to="/careers" className="feature-pill" style={{ textDecoration: 'none', background: "rgba(56,189,248,0.18)", color: "#e0f2fe" }}>Explore Careers</Link>
                    <Link to="/careers" className="feature-pill" style={{ textDecoration: 'none', background: "rgba(34,197,94,0.16)", color: "#dcfce7" }}>Share an Idea</Link>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <Link to="/chatbot" className="chatbot-fab" aria-label="Open chatbot">
            <span className="chatbot-fab-icon">🤖</span>
            Chatbot
          </Link>

          <footer className="app-footer">
            <p>© {new Date().getFullYear()} Outreach Hope Church Sunshine | House of Bread</p>
          </footer>
        </div>
      } />

      {/* Public Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/bible" element={<Bible />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/opportunities" element={<Opportunities />} />
      <Route path="/events" element={<Events />} />
      <Route path="/login" element={<MemberLogin />} />
      <Route path="/signup" element={<MemberSignup />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected Member Pages */}
      <Route path="/services" element={<MemberProtectedRoute><Services /></MemberProtectedRoute>} />
      <Route path="/sermons" element={<MemberProtectedRoute><Sermons /></MemberProtectedRoute>} />
      <Route path="/sermons/:id" element={<MemberProtectedRoute><Sermons /></MemberProtectedRoute>} />
      <Route path="/give" element={<MemberProtectedRoute><Give /></MemberProtectedRoute>} />
      <Route path="/ministers" element={<MemberProtectedRoute><Ministers /></MemberProtectedRoute>} />
      <Route path="/prayerRequests" element={<MemberProtectedRoute><PrayerRequests /></MemberProtectedRoute>} />
      <Route path="/baptism" element={<MemberProtectedRoute><BaptismRequest /></MemberProtectedRoute>} />
      <Route path="/chatbot" element={<MemberProtectedRoute><Chatbox /></MemberProtectedRoute>} />
      <Route path="/online-service" element={<MemberProtectedRoute><OnlineService /></MemberProtectedRoute>} />
      <Route path="/profile" element={<MemberProtectedRoute><MemberProfile /></MemberProtectedRoute>} />

      {/* Admin Pages */}
      <Route path="/admin-dashboard" element={<AdminProtectedRoute section="dashboard"><AdminDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/reports" element={<AdminProtectedRoute section="reports"><AdminReports /></AdminProtectedRoute>} />
      <Route path="/admin/events" element={<AdminProtectedRoute section="events"><AdminEvents /></AdminProtectedRoute>} />
      <Route path="/admin/projects" element={<AdminProtectedRoute section="projects"><AdminProjects /></AdminProtectedRoute>} />
      <Route path="/admin/prayer-requests" element={<AdminProtectedRoute section="prayerRequests"><AdminPrayerRequests /></AdminProtectedRoute>} />
      <Route path="/admin/transactions" element={<AdminProtectedRoute section="transactions"><AdminTransactions /></AdminProtectedRoute>} />
      <Route path="/admin/members" element={<AdminProtectedRoute section="members"><AdminMembers /></AdminProtectedRoute>} />
      <Route path="/admin/baptism" element={<AdminProtectedRoute section="baptism"><AdminBaptism /></AdminProtectedRoute>} />
      <Route path="/admin/sermons" element={<AdminProtectedRoute section="sermons"><AdminSermons /></AdminProtectedRoute>} />
      <Route path="/admin/gallery" element={<AdminProtectedRoute section="gallery"><AdminGallery /></AdminProtectedRoute>} />
      <Route path="/admin/ministers" element={<AdminProtectedRoute section="ministers"><AdminMinisters /></AdminProtectedRoute>} />
    </Routes>
    </Suspense>
  )
}

export default App
