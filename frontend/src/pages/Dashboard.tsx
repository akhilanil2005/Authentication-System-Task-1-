import { useEffect } from "react";
import api from "../api/axios";
import {useState} from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";

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
    <div className="dashboard-container">
      <Navbar
  email={user?.email || ""}
  role={user?.role || ""}
/>
      <div className="dashboard-content">
  <div>
  <div className="dashboard-card">

  <h2 className="welcome-title">
    Welcome Back
  </h2>
    
    <h3>{user?.name || "User"}</h3>
<p>User ID: {user?.id}</p>
<p>Email: {user?.email}</p>
<p>
  <strong>Role:</strong>
  <span className="role-badge">
    {user?.role?.toUpperCase()}
  </span>
</p>
<button
    className="danger-btn"
    onClick={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }}
  >
    Logout
  </button>
  </div>
  </div>
</div>
    </div>
  );
}

export default Dashboard;