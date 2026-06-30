import { useEffect } from "react";
import api from "../api/axios";
import {useState} from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
console.log("Role:", role);
  
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, []);
  useEffect(() => {
  const getProfile = async () => {
    try {
      const res = await api.get("/profile");
console.log(res.data);
setUser(res.data.user);
    } catch (err) {
      console.error("Profile fetch failed");
    }
  };

  getProfile();
}, []);

  return (
    <div className="container">
      <div className="navbar">
  <div className="logo">
    Authentication System
  </div>

  <div className="nav-links">
    <button className="active" onClick={() => navigate("/dashboard")}>
      Dashboard
    </button>

    <button onClick={() => navigate("/notifications")}>
      Notifications
    </button>

    <button onClick={() => navigate("/activity-history")}>
      Activity
    </button>

    <button onClick={() => navigate("/profile")}>
      Profile
    </button>
    {user?.role === "admin" && (
  <button onClick={() => navigate("/admin")}>
    Admin
  </button>
)}
  </div>

  <div className="user-email">
    {user?.email}
  </div>
</div>
      <div className="card">
  <h1>Welcome Back</h1>

  <div className="profile-box">
    <h3>{user?.name || "User"}</h3>

    <p>
      <strong>Email:</strong> {user?.email}
    </p>

    <p>
  <strong>Role:</strong>
  <span className="role-badge">
    {user?.role}
  </span>
</p>
  </div>

  <button
    className="logout-btn"
    onClick={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }}
  >
    Logout
  </button>
</div>
    </div>
  );
}

export default Dashboard;