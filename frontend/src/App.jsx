import { useState, useEffect } from 'react'
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

function App() {
  const [serverMessage, setServerMessage] = useState("")
  const [memberName, setMemberName] = useState(localStorage.getItem("memberName"))

  useEffect(() => {
    axios.get("http://localhost:5000/")
      .then((res) => {
        setServerMessage(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberLastName");
    localStorage.removeItem("memberId");
    setMemberName(null);
    window.location.href = "/";
  };

  const renderHeader = () => (
    <header className="app-header">
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

        <div className="auth-nav">
          {memberName ? (
            <div className="user-profile">
              <span className="welcome-text">
                Welcome, <strong>{memberName}</strong>
                <span style={{
                  marginLeft: '8px',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>
                  {localStorage.getItem("memberId")}
                </span>
              </span>
              <button onClick={handleLogout} className="logout-link">Logout</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/signup" className="signup-btn">Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="feature-nav">
        <Link to="/about"><button>About</button></Link>
        <Link to="/services"><button>Services</button></Link>
        <Link to="/events"><button>Events</button></Link>
        <Link to="/give"><button>Give</button></Link>
        <Link to="/ministers"><button>Ministers</button></Link>
        <Link to="/prayerRequests"><button>PrayerRequests</button></Link>
        <Link to="/baptism"><button>Baptism</button></Link>
        <Link to="/chatbot"><button>Chatbot</button></Link>
        <Link to="/online-service"><button>Online Service</button></Link>
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
                    <span className="feature-pill feature-pill-soft">Outreach focused</span>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <footer className="app-footer">
            <p>© {new Date().getFullYear()} Outreach Hope Church Sunshine</p>
          </footer>
        </div>
      } />

      {/* Public Pages */}
      <Route path="/about" element={<About />} />
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
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/projects" element={<AdminProjects />} />
      <Route path="/admin/prayer-requests" element={<AdminPrayerRequests />} />
      <Route path="/admin/transactions" element={<AdminTransactions />} />
      <Route path="/admin/members" element={<AdminMembers />} />
      <Route path="/admin/baptism" element={<AdminBaptism />} />
    </Routes>
  )
}

export default App
