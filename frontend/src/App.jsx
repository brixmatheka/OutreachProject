import { useState, useEffect } from 'react'
import "./apiConfig" // Ensure axios is configured with auth interceptor
import axios from "axios"
import './App.css'
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom"
import AdminLogin from "./pages/AdminLogin"
import AdminDashboard from "./pages/AdminDashboard"
import AdminEvents from "./pages/AdminEvents"
import AdminProjects from "./pages/AdminProjects"
import AdminPrayerRequests from "./pages/AdminPrayerRequests"
import AdminTransactions from "./pages/AdminTransactions"
import AdminMembers from "./pages/AdminMembers"
import About from "./pages/About"
import Give from "./pages/Give"
import Services from "./pages/Services"
import Events from "./pages/Events"
import Chatbox from "./pages/Chatbox"
import Ministers from "./pages/Ministers"
import PrayerRequests from "./pages/PrayerRequests"
import OnlineService from "./pages/OnlineService"
import MemberLogin from "./pages/MemberLogin"
import MemberSignup from "./pages/MemberSignup"
import BaptismRequest from "./pages/BaptismRequest"
import AdminBaptism from "./pages/AdminBaptism"
import Bible from "./pages/Bible"
import Gallery from "./pages/Gallery"
import Careers from "./pages/Careers"
import Opportunities from "./pages/Opportunities"
import AdminGallery from "./pages/AdminGallery"
import AdminMinisters from "./pages/AdminMinisters"
import { canAccessAdminSection, clearAdminAuth, getAdminAuth } from "./adminAccess"

// Protected Route for Members
const MemberProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("memberToken");
  const location = useLocation();

  if (!token) {
    localStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminProtectedRoute = ({ section, children }) => {
  const { token, role } = getAdminAuth();
  const location = useLocation();

  if (!token || !role) {
    clearAdminAuth();
    return <Navigate to="/admin-login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessAdminSection(section)) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
};

function App() {
  const [serverMessage, setServerMessage] = useState("")
  const [memberName, setMemberName] = useState(localStorage.getItem("memberName"))
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    axios.get("/")
      .then((res) => {
        setServerMessage(res.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("memberToken");
    if (token) {
      axios.get("/auth/me", {
        headers: { Authorization: token }
      })
        .then((res) => {
          localStorage.setItem("memberName", res.data.firstName);
          setMemberName(res.data.firstName);
        })
        .catch((err) => {
          if (err.response?.status === 401 || err.response?.status === 404) {
            localStorage.removeItem("memberToken");
            localStorage.removeItem("memberName");
            localStorage.removeItem("memberLastName");
            localStorage.removeItem("memberId");
            setMemberName(null);
          }
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberLastName");
    localStorage.removeItem("memberId");
    setMemberName(null);
    window.location.href = "/";
  };

  const renderHeader = () => (
    <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-top">
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="OHC Logo" className="brand-logo-img" />
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
              </div>
              <button onClick={handleLogout} className="logout-link">Logout</button>
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
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className={`nav-container ${isMobileMenuOpen ? 'open' : ''}`}>
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
          <Link to="/gallery" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
          <Link to="/careers" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Careers</Link>
          <Link to="/give" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Give</Link>
          <Link to="/bible" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Bible</Link>
          <Link to="/prayerRequests" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Prayer Requests</Link>
          <Link to="/baptism" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Baptism</Link>
          <Link to="/chatbot" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Chatbot</Link>
          <Link to="/online-service" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Online Service</Link>
        </div>

        {/* Mobile Logout (bottom of menu) */}
        {memberName && (
          <div className="mobile-logout-wrapper">
            <button onClick={handleLogout} className="mobile-logout-btn">Log Out</button>
          </div>
        )}
      </div>
    </header>
  );

  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={
        <div className="app-root">
          {renderHeader()}

          <main className="app-main">
            <section className="hero">
              <div className="hero-content">
                <h1>OUTREACH HOPE CONNECT</h1>
                <p className="hero-subtitle">"Where the Word is Preached and Love is Experienced"</p>
                <div className="hero-cta">
                  <Link to="/about" className="hero-btn-primary">WHO ARE WE</Link>
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
                    <span className="feature-pill">Outreach focused</span>
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
                    <li>Submit prayer requests directly from the church portal.</li>
                    <li>Stay connected to life-changing teaching and worship.</li>
                  </ul>
                  <div className="feature-footer">
                    <Link to="/bible" className="feature-pill" style={{ textDecoration: 'none' }}>Open Bible</Link>
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
      <Route path="/login" element={<MemberLogin />} />
      <Route path="/signup" element={<MemberSignup />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected Member Pages */}
      <Route path="/services" element={<MemberProtectedRoute><Services /></MemberProtectedRoute>} />
      <Route path="/events" element={<MemberProtectedRoute><Events /></MemberProtectedRoute>} />
      <Route path="/give" element={<MemberProtectedRoute><Give /></MemberProtectedRoute>} />
      <Route path="/ministers" element={<MemberProtectedRoute><Ministers /></MemberProtectedRoute>} />
      <Route path="/prayerRequests" element={<MemberProtectedRoute><PrayerRequests /></MemberProtectedRoute>} />
      <Route path="/baptism" element={<MemberProtectedRoute><BaptismRequest /></MemberProtectedRoute>} />
      <Route path="/chatbot" element={<MemberProtectedRoute><Chatbox /></MemberProtectedRoute>} />
      <Route path="/online-service" element={<MemberProtectedRoute><OnlineService /></MemberProtectedRoute>} />

      {/* Admin Pages */}
      <Route path="/admin-dashboard" element={<AdminProtectedRoute section="dashboard"><AdminDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/events" element={<AdminProtectedRoute section="events"><AdminEvents /></AdminProtectedRoute>} />
      <Route path="/admin/projects" element={<AdminProtectedRoute section="projects"><AdminProjects /></AdminProtectedRoute>} />
      <Route path="/admin/prayer-requests" element={<AdminProtectedRoute section="prayerRequests"><AdminPrayerRequests /></AdminProtectedRoute>} />
      <Route path="/admin/transactions" element={<AdminProtectedRoute section="transactions"><AdminTransactions /></AdminProtectedRoute>} />
      <Route path="/admin/members" element={<AdminProtectedRoute section="members"><AdminMembers /></AdminProtectedRoute>} />
      <Route path="/admin/baptism" element={<AdminProtectedRoute section="baptism"><AdminBaptism /></AdminProtectedRoute>} />
      <Route path="/admin/gallery" element={<AdminProtectedRoute section="gallery"><AdminGallery /></AdminProtectedRoute>} />
      <Route path="/admin/ministers" element={<AdminProtectedRoute section="ministers"><AdminMinisters /></AdminProtectedRoute>} />
    </Routes>
  )
}

export default App
