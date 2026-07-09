import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  deleteRole,
  fetchRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
} from "../features/rbac/rbacSlice";
import Navbar from "../components/Navbar";

function RoleManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, permissions, rolePermissions, loading, error } = useSelector(
    (s: RootState) => s.rbac
  );

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRoleId !== null) {
      dispatch(fetchRolePermissions(selectedRoleId));
    }
  }, [selectedRoleId, dispatch]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    await dispatch(createRole({ name: newRoleName, description: newRoleDesc }));
    setNewRoleName("");
    setNewRoleDesc("");
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("Delete this role? This cannot be undone.")) return;
    await dispatch(deleteRole(id));
    if (selectedRoleId === id) setSelectedRoleId(null);
  };

  const togglePermission = async (permissionId: number, isAssigned: boolean) => {
    if (!selectedRoleId) return;
    if (isAssigned) {
      await dispatch(removePermissionFromRole({ roleId: selectedRoleId, permissionId }));
    } else {
      await dispatch(assignPermissionToRole({ roleId: selectedRoleId, permissionId }));
    }
    dispatch(fetchRolePermissions(selectedRoleId));
  };

  const selectedRolePermissionIds = new Set(
    (rolePermissions[selectedRoleId ?? -1] || []).map((p) => p.id)
  );

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="rbac-page">
          <h2>Role Management</h2>

          {loading && <p className="rbac-empty">Loading...</p>}
          {error && <p className="error">{error}</p>}

          {/* Create new role */}
          <div className="rbac-card">
            <h3>Create Role</h3>
            <div className="rbac-form-row">
              <input
                type="text"
                placeholder="Role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
              />
              <button className="rbac-btn-sm primary" onClick={handleCreateRole}>
                Create Role
              </button>
            </div>
          </div>

          <div className="rbac-columns">
            {/* Role list */}
            <div className="rbac-card">
              <h3>Roles</h3>
              {roles.length === 0 && !loading && (
                <p className="rbac-empty">No roles found.</p>
              )}
              <ul className="rbac-list">
                {roles.map((role) => (
                  <li
                    key={role.id}
                    className={`rbac-list-item ${
                      selectedRoleId === role.id ? "active" : ""
                    }`}
                  >
                    <div className="rbac-role-info">
                      <strong>{role.name}</strong>
                      <span className="rbac-subtext">
                        {role.description || "no description"}
                      </span>
                    </div>
                    <div className="rbac-actions">
                      <button
                        className="rbac-btn-sm primary"
                        onClick={() => setSelectedRoleId(role.id)}
                      >
                        Manage Permissions
                      </button>
                      <button
                        className="rbac-btn-sm danger"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Permission assignment for selected role */}
            {selectedRoleId !== null && (
              <div className="rbac-card">
                <h3>Permissions for {selectedRole?.name}</h3>
                {permissions.length === 0 && (
                  <p className="rbac-empty">No permissions defined yet.</p>
                )}
                <ul className="rbac-list">
                  {permissions.map((perm) => {
                    const isAssigned = selectedRolePermissionIds.has(perm.id);
                    return (
                      <li key={perm.id} className="rbac-list-item">
                        <label className="rbac-perm-label">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => togglePermission(perm.id, isAssigned)}
                          />
                          <span className="rbac-perm-text">
                            <strong>{perm.name}</strong>
                            <span className="rbac-subtext">
                              {perm.description || "no description"}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleManagement;