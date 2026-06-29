import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

// Defines which nav links each role sees. Keeping this data-driven means
// adding a new role or link later is a one-line change, not a new component.
const NAV_LINKS = {
  admin: [
    { to: "/admin/dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
    { to: "/admin/flats", icon: "bi-building", label: "Flats" },
    { to: "/admin/residents", icon: "bi-people", label: "Residents" },
    { to: "/admin/visitors", icon: "bi-person-walking", label: "Visitors" },
    { to: "/admin/complaints", icon: "bi-exclamation-circle", label: "Complaints" },
    { to: "/admin/bills", icon: "bi-receipt", label: "Bills & Payments" },
    { to: "/admin/facilities", icon: "bi-building-gear", label: "Facilities" },
    { to: "/admin/bookings", icon: "bi-calendar-check", label: "Bookings" },
    { to: "/admin/notices", icon: "bi-megaphone", label: "Notice Board" },
    { to: "/admin/polls", icon: "bi-bar-chart-steps", label: "Polls" },
    { to: "/admin/reports", icon: "bi-file-earmark-bar-graph", label: "Reports" },
    { to: "/admin/settings", icon: "bi-gear", label: "Settings" },
  ],
  resident: [
    { to: "/resident/dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
    { to: "/resident/profile", icon: "bi-person-circle", label: "My Profile" },
    { to: "/resident/visitors", icon: "bi-person-walking", label: "Visitors" },
    { to: "/resident/complaints", icon: "bi-exclamation-circle", label: "Complaints" },
    { to: "/resident/bills", icon: "bi-receipt", label: "Bills & Payments" },
    { to: "/resident/bookings", icon: "bi-calendar-check", label: "Facility Booking" },
    { to: "/resident/notices", icon: "bi-megaphone", label: "Notice Board" },
    { to: "/resident/polls", icon: "bi-bar-chart-steps", label: "Polls" },
    { to: "/resident/settings", icon: "bi-gear", label: "Settings" },
  ],
  security: [
    { to: "/security/dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
    { to: "/security/visitors", icon: "bi-person-walking", label: "Visitor Entry" },
    { to: "/security/settings", icon: "bi-gear", label: "Settings" },
  ],
  maintenance: [
    { to: "/maintenance/dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
    { to: "/maintenance/complaints", icon: "bi-tools", label: "Assigned Complaints" },
    { to: "/maintenance/settings", icon: "bi-gear", label: "Settings" },
  ],
};

const Sidebar = ({ show, onLinkClick }) => {
  const { user } = useSelector((state) => state.auth);
  const links = NAV_LINKS[user?.role] || [];

  return (
    <aside className={`sidebar ${show ? "show" : ""}`}>
      <div className="sidebar-brand">
        <i className="bi bi-houses-fill"></i>
        <span>Smart Society</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <i className={`bi ${link.icon}`}></i>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        Logged in as <strong className="text-light">{user?.role}</strong>
      </div>
    </aside>
  );
};

export default Sidebar;
