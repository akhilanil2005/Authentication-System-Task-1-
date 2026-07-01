import { useNavigate,useLocation } from "react-router-dom";

type Props = {
  email: string;
  role: string;
};

function Navbar({ email, role }: Props) {
  const navigate = useNavigate();
    const location = useLocation();
  return (
    <div className="navbar">
      <div className="logo">
        Authentication System
      </div>

      <div className="nav-links">
        <button
  className={location.pathname === "/dashboard" ? "active" : ""}
  onClick={() => navigate("/dashboard")}
>
  Dashboard
</button>

        <button
  className={location.pathname === "/notifications" ? "active" : ""}
  onClick={() => navigate("/notifications")}
>
  Notifications
</button>
        <button
  className={location.pathname === "/activity-history" ? "active" : ""}
  onClick={() => navigate("/activity-history")}
>
  Activity
</button>

        <button
  className={location.pathname === "/profile" ? "active" : ""}
  onClick={() => navigate("/profile")}
>
  Profile
</button>

        {role === "admin" && (
          <button
  className={location.pathname === "/admin" ? "active" : ""}
  onClick={() => navigate("/admin")}
>
  Admin
</button>
        )}
      </div>

      <div className="user-email">
        {email || ""}
      </div>
    </div>
  );
}

export default Navbar;