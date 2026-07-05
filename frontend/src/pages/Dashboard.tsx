import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import { fetchProfile } from "../features/auth/authSlice";
import type { RootState, AppDispatch } from "../app/store";
import axios from "../api/axios";

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
console.log("Role:", role);
// Dashboard.tsx
const dispatch = useDispatch<AppDispatch>();
const { user, token, profileLoading } = useSelector((s: RootState) => s.auth);

useEffect(() => {
  if (!token) {
    navigate("/login");
    return;
  }
}, [token]);
if (profileLoading) return <div className="loading-screen">Loading...</div>;
  if (!user) return null;
  

  return (
    <div className="dashboard-container">
      <Navbar/>
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
    onClick={async () => {
  try {
    await axios.post("/logout");

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    window.location.href = "/login";
  } catch (error) {
    console.error(error);
  }
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