import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import {
  fetchPermissions,
  createPermission,
  deletePermission,
} from "../features/rbac/rbacSlice";
import Navbar from "../components/Navbar";

function PermissionManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { permissions, loading, error } = useSelector((s: RootState) => s.rbac);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  const handleCreate = async () => {
    setFormError("");
    if (!/^[a-z]+:[a-z]+$/.test(name.trim())) {
      setFormError("Permission name must follow 'resource:action' format, e.g. 'reports:export'");
      return;
    }
    const result = await dispatch(createPermission({ name: name.trim(), description }));
    if (createPermission.rejected.match(result)) {
      setFormError("Failed to create permission — it may already exist.");
      return;
    }
    setName("");
    setDescription("");
  };

  const handleDelete = async (id: number, permName: string) => {
    if (!confirm(`Delete permission "${permName}"? This removes it from all roles.`)) return;
    await dispatch(deletePermission(id));
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="rbac-page">
          <h2>Permission Management</h2>

          {loading && <p className="rbac-empty">Loading...</p>}
          {error && <p className="error">{error}</p>}

          <div className="rbac-card">
            <h3>Create Permission</h3>
            <div className="rbac-form-row">
              <input
                type="text"
                placeholder="e.g. reports:export"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button className="auth-btn" onClick={handleCreate}>
                Create Permission
              </button>
            </div>
            {formError && <p className="error">{formError}</p>}
          </div>

          <div className="rbac-card">
            <h3>Existing Permissions</h3>
            {!loading && permissions.length === 0 && (
              <p className="rbac-empty">No permissions defined yet.</p>
            )}
            <ul className="rbac-list">
              {permissions.map((perm) => (
                <li key={perm.id} className="rbac-list-item">
                  <div className="rbac-role-info">
                    <strong>{perm.name}</strong>
                    <span className="rbac-subtext">
                      {perm.description || "no description"}
                    </span>
                  </div>
                  <div className="rbac-actions">
                    <button
                      className="rbac-btn-sm danger"
                      onClick={() => handleDelete(perm.id, perm.name)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PermissionManagement;