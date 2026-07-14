import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { RootState, AppDispatch } from "../app/store";
import { fetchAllUsers, fetchRoles, assignRoleToUser, deleteUser } from "../features/rbac/rbacSlice";
import Navbar from "../components/Navbar";

function UserManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, roles, loading, error } = useSelector((s: RootState) => s.rbac);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const [pendingChanges, setPendingChanges] = useState<Record<number, number>>({});
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  const isAdmin = currentUser?.role === "admin";
  const assignableRoles = isAdmin ? roles : roles.filter((r) => r.name !== "admin");
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleRoleSelect = (userId: number, roleId: number) => {
    setPendingChanges((prev) => ({ ...prev, [userId]: roleId }));
  };

  const handleSave = async (userId: number, userName: string) => {
    const roleId = pendingChanges[userId];
    if (!roleId) return;

    const result = await dispatch(assignRoleToUser({ userId, roleId }));

    if (assignRoleToUser.rejected.match(result)) {
      toast.error(`Failed to update role for ${userName}.`);
      return;
    }

    await dispatch(fetchAllUsers());
    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    toast.success(`Role updated for ${userName}.`);
  };

  const requestDelete = (id: number, name: string) => {
    setConfirmTarget({ id, name });
  };

  const cancelDelete = () => {
    setConfirmTarget(null);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const { id, name } = confirmTarget;
    setConfirmTarget(null);

    const result = await dispatch(deleteUser(id));

    if (deleteUser.rejected.match(result)) {
      toast.error(`Failed to delete ${name}.`);
      return;
    }

    toast.success(`${name} was deleted.`);
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="rbac-page">
        <h2>User Management</h2>

        {loading && <p className="rbac-empty">Loading...</p>}
        {error && <p className="error">{error}</p>}

        <div className="rbac-table-card">
          <div className="rbac-table-header">
            <h3>All Users</h3>
          </div>
          <div className="rbac-search-bar">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rbac-search-input"
            />
          </div>

          {!loading && filteredUsers.length === 0 ? (
            <p className="rbac-empty">No users match your search.</p>
          ) : (
            <>
              <table className="rbac-table-v2">
                <thead>
                  <tr>
                    <th className="rbac-row-num">#</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Change Role</th>
                    <th>Save</th>
                    <th>Delete User</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
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
                          onClick={() => handleSave(u.id, u.name)}
                          title="Save role change"
                        >
                          ✓
                        </button>
                      </td>
                      <td>
                        <button
                          className="rbac-icon-btn delete"
                          onClick={() => requestDelete(u.id, u.name)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? "You cannot delete your own account" : "Delete user"}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="rbac-table-footer">
                <span>Showing {filteredUsers.length} of {users.length} users</span>
              </div>
            </>
          )}
        </div>
      </div>

      {confirmTarget && (
        <div className="confirm-modal-overlay" onClick={cancelDelete}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Delete user</h4>
            <p className="confirm-modal-message">
              Are you sure you want to delete <strong>{confirmTarget.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;