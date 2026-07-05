import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role || "";
  const email = user?.email || "";
  const permissions = user?.permissions || [];
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="navbar">
      <div className="navbar-top">
        <div className="logo">Authentication System</div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <button
          className={location.pathname === "/dashboard" ? "active" : ""}
          onClick={() => go("/dashboard")}
        >
          Dashboard
        </button>

        <button
          className={location.pathname === "/notifications" ? "active" : ""}
          onClick={() => go("/notifications")}
        >
          Notifications
        </button>

        <button
          className={location.pathname === "/activity-history" ? "active" : ""}
          onClick={() => go("/activity-history")}
        >
          Activity
        </button>

        <button
          className={location.pathname === "/profile" ? "active" : ""}
          onClick={() => go("/profile")}
        >
          Profile
        </button>

        {role === "admin" && (
          <button
            className={location.pathname === "/admin" ? "active" : ""}
            onClick={() => go("/admin")}
          >
            Admin
          </button>
        )}

        {permissions.includes("roles:manage") && (
          <button
            className={location.pathname === "/roles" ? "active" : ""}
            onClick={() => go("/roles")}
          >
            Roles
          </button>
        )}

        {permissions.includes("users:view") && (
          <button
            className={location.pathname === "/users" ? "active" : ""}
            onClick={() => go("/users")}
          >
            Users
          </button>
        )}

        {permissions.includes("permissions:manage") && (
          <button
            className={location.pathname === "/permissions" ? "active" : ""}
            onClick={() => go("/permissions")}
          >
            Permissions
          </button>
        )}

        <div className="user-email mobile-only">{email || ""}</div>
      </div>

      <div className="user-email desktop-only">{email || ""}</div>
    </div>
  );
}

export default Navbar;