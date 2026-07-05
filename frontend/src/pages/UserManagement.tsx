import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { fetchAllUsers, fetchRoles, assignRoleToUser } from "../features/rbac/rbacSlice";
import Navbar from "../components/Navbar";

function UserManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, roles, loading, error } = useSelector((s: RootState) => s.rbac);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const [pendingChanges, setPendingChanges] = useState<Record<number, number>>({});

  const isAdmin = currentUser?.role === "admin";
  const assignableRoles = isAdmin ? roles : roles.filter((r) => r.name !== "admin");

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleRoleSelect = (userId: number, roleId: number) => {
    setPendingChanges((prev) => ({ ...prev, [userId]: roleId }));
  };

  const handleSave = async (userId: number) => {
    const roleId = pendingChanges[userId];
    if (!roleId) return;
    await dispatch(assignRoleToUser({ userId, roleId }));
    await dispatch(fetchAllUsers());
    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="rbac-page">
        <h2>User Management</h2>

        {loading && <p className="rbac-empty">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && users.length === 0 && <p className="rbac-empty">No users found.</p>}

        {users.length > 0 && (
          <div className="rbac-table-card">
            <div className="rbac-table-header">
              <h3>All Users</h3>
            </div>

            <table className="rbac-table-v2">
              <thead>
                <tr>
                  <th className="rbac-row-num">#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Change Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="rbac-row-num">{i + 1}</td>
                    <td>
                      <div className="rbac-user-cell">
                        <div className="rbac-avatar">{u.name?.[0]?.toUpperCase() || "?"}</div>
                        <div>
                          <div className="rbac-user-name">{u.name}</div>
                          <span className="rbac-user-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`rbac-badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className="rbac-status-dot">Active</span>
                    </td>
                    <td>
                      <select
                        value={pendingChanges[u.id] || ""}
                        onChange={(e) => handleRoleSelect(u.id, Number(e.target.value))}
                      >
                        <option value="" disabled>Select role</option>
                        {assignableRoles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="rbac-icon-btn save"
                        disabled={!pendingChanges[u.id]}
                        onClick={() => handleSave(u.id)}
                        title="Save role change"
                      >
                        ✓
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="rbac-table-footer">
              <span>Showing {users.length} users</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;