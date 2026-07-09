import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import {
  LayoutDashboard,
  Bell,
  ClipboardList,
  User,
  Megaphone,
  Lock,
  Users,
  Settings,
  Folder,
  Search,
  Menu,
  X,
} from "lucide-react";

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="sidebar-topbar">
        <div className="logo">Authentication System</div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-logo desktop-only">Authentication System</div>

        <nav className="sidebar-links">
          <button
            className={isActive("/dashboard") ? "active" : ""}
            onClick={() => go("/dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button
            className={isActive("/notifications") ? "active" : ""}
            onClick={() => go("/notifications")}
          >
            <Bell size={18} /> Notifications
          </button>

          <button
            className={isActive("/activity-history") ? "active" : ""}
            onClick={() => go("/activity-history")}
          >
            <ClipboardList size={18} /> Activity History
          </button>

          <button
            className={isActive("/profile") ? "active" : ""}
            onClick={() => go("/profile")}
          >
            <User size={18} /> Profile
          </button>

          {role === "admin" && (
            <button
              className={isActive("/admin") ? "active" : ""}
              onClick={() => go("/admin")}
            >
              <Megaphone size={18} /> Admin Announcement
            </button>
          )}

          {permissions.includes("roles:manage") && (
            <button
              className={isActive("/roles") ? "active" : ""}
              onClick={() => go("/roles")}
            >
              <Lock size={18} /> Roles
            </button>
          )}

          {permissions.includes("users:view") && (
            <button
              className={isActive("/users") ? "active" : ""}
              onClick={() => go("/users")}
            >
              <Users size={18} /> Users
            </button>
          )}

          {permissions.includes("permissions:manage") && (
            <button
              className={isActive("/permissions") ? "active" : ""}
              onClick={() => go("/permissions")}
            >
              <Settings size={18} /> Permissions
            </button>
          )}

          {permissions.includes("files:view") && (
            <button
              className={isActive("/files") ? "active" : ""}
              onClick={() => go("/files")}
            >
              <Folder size={18} /> Files
            </button>
          )}

          {permissions.includes("search:read") && (
            <button
              className={isActive("/search") ? "active" : ""}
              onClick={() => go("/search")}
            >
              <Search size={18} /> Search
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <span className="user-email">{email || ""}</span>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
