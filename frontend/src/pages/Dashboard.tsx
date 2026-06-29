import { useEffect } from "react";
import api from "../api/axios";
import {useState} from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

type UserData = {
  email: string;
  password: string;
  role: string;
};

function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  
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
        <h2>Authentication System</h2>
  <span>{user?.email}</span>
</div>
      <div className="card">
        <h1>Dashboard</h1>
          <button onClick={() => navigate("/notifications")}>
  Notifications
</button>
        <div className="user-info">
          <h3>User Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <div>
            <h3>
  Welcome, {user?.role === "admin" ? "Administrator" : "User"}
</h3>
          {user?.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="admin-btn"> Go To Admin Panel </button>
)}
</div>
        </div>
        <button
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