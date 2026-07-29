import { NavLink, useLocation } from "react-router-dom";
import { canAccessAdminSection, getAdminAuth } from "../adminAccess";

const destinations = [
  ["dashboard", "/admin-dashboard", "Overview"],
  ["reports", "/admin/reports", "Reports"],
  ["events", "/admin/events", "Events"],
  ["transactions", "/admin/transactions", "Finance"],
  ["members", "/admin/members", "Members"],
  ["prayerRequests", "/admin/prayer-requests", "Prayer"],
  ["baptism", "/admin/baptism", "Baptism"],
  ["sermons", "/admin/sermons", "Sermons"],
  ["gallery", "/admin/gallery", "Gallery"],
  ["ministers", "/admin/ministers", "Ministers"],
  ["projects", "/admin/projects", "Projects"],
];

export default function AdminPortalNav() {
  const location = useLocation();
  const auth = getAdminAuth();
  const available = destinations.filter(([section]) => canAccessAdminSection(section));

  return (
    <nav className="admin-portal-nav no-print" aria-label="Administration sections">
      <div className="admin-portal-brand">
        <img src="/logo.png" width="34" height="34" alt="" />
        <div><strong>OHC Admin</strong><span>{auth.roleLabel || "Administrator"}</span></div>
      </div>
      <div className="admin-portal-links">
        {available.map(([section, path, label]) => (
          <NavLink
            key={section}
            to={path}
            className={({ isActive }) => `admin-portal-link ${isActive || (section === "dashboard" && location.pathname === "/admin-dashboard") ? "active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
