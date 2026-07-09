import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import type { RootState, AppDispatch } from "../app/store";
import axios from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, profileLoading } = useSelector(
    (s: RootState) => s.auth
  );
  const permissions = user?.permissions || [];
  const role = user?.role || "";

  const [stats, setStats] = useState({
    users: null as number | null,
    roles: null as number | null,
    permissions: null as number | null,
    files: null as number | null,
    activities: null as number | null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token]);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      setStatsLoading(true);

      const results = await Promise.allSettled([
        permissions.includes("users:view")
          ? axios.get("/users")
          : Promise.resolve(null),
        permissions.includes("roles:manage")
          ? axios.get("/roles/list")
          : Promise.resolve(null),
        permissions.includes("permissions:manage")
          ? axios.get("/permissions")
          : Promise.resolve(null),
        permissions.includes("files:view")
          ? axios.get("/files")
          : Promise.resolve(null),
        axios.get(`/activity-logs/${user.id}`),
      ]);

      const [usersRes, rolesRes, permsRes, filesRes, activitiesRes] = results;

      setStats({
        users:
          usersRes.status === "fulfilled" && usersRes.value
            ? usersRes.value.data.length
            : null,
        roles:
          rolesRes.status === "fulfilled" && rolesRes.value
            ? rolesRes.value.data.length
            : null,
        permissions:
          permsRes.status === "fulfilled" && permsRes.value
            ? permsRes.value.data.length
            : null,
        files:
          filesRes.status === "fulfilled" && filesRes.value
            ? filesRes.value.data.length
            : null,
        activities:
          activitiesRes.status === "fulfilled" && activitiesRes.value
            ? activitiesRes.value.data.length
            : null,
      });
      setStatsLoading(false);
    };

    loadStats();
  }, [user, dispatch]);

  if (profileLoading) return <div className="loading-screen">Loading...</div>;
  if (!user) return null;

  const statCards = [
    { label: "Total Users", value: stats.users, show: permissions.includes("users:view") },
    { label: "Roles", value: stats.roles, show: permissions.includes("roles:manage") },
    { label: "Permissions", value: stats.permissions, show: permissions.includes("permissions:manage") },
    { label: "Files", value: stats.files, show: permissions.includes("files:view") },
    { label: "Activities", value: stats.activities, show: true },
  ].filter((card) => card.show);

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div>
          <div className="dashboard-card">
            <h2 className="welcome-title">Welcome Back</h2>

            <h3>{user?.name || "User"}</h3>
            <p>User ID: {user?.id}</p>
            <p>Email: {user?.email}</p>
            <p>
              <strong>Role:</strong>
              <span className="role-badge">{user?.role?.toUpperCase()}</span>
            </p>

            {statCards.length > 0 && (
              <div className="stats-grid">
                {statCards.map((card) => (
                  <div key={card.label} className="stat-card">
                    <div className="stat-value">
                      {statsLoading || card.value === null ? "—" : card.value}
                    </div>
                    <div className="stat-label">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

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
