import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
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

// Permissions that, if removed from every role, would lock everyone out
// of the RBAC screens themselves.
const CRITICAL_PERMISSIONS = ["permissions:manage", "roles:manage"];

function RoleManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, permissions, rolePermissions, loading, error } = useSelector(
    (s: RootState) => s.rbac
  );

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  // Staged (unsaved) permission state for the selected role.
  // null = no pending edits yet (mirrors server state).
  const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<number> | null>(null);
  const [saving, setSaving] = useState(false);

  // Guard modal for critical-permission lockout confirmation.
  const [lockoutWarning, setLockoutWarning] = useState<{
    permName: string;
    onConfirm: () => void;
  } | null>(null);

  // Diff-preview modal shown before any save actually commits.
  const [saveConfirmation, setSaveConfirmation] = useState<{
    added: string[];
    removed: string[];
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  // Load permissions for every role so we can detect "last holder" lockouts,
  // plus the selected role's permissions for editing.
  useEffect(() => {
    roles.forEach((role) => {
      if (!rolePermissions[role.id]) {
        dispatch(fetchRolePermissions(role.id));
      }
    });
  }, [roles, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedRoleId !== null) {
      dispatch(fetchRolePermissions(selectedRoleId));
    }
    // Reset staged edits whenever the selected role changes.
    setPendingPermissionIds(null);
  }, [selectedRoleId, dispatch]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required.");
      return;
    }

    const result = await dispatch(createRole({ name: newRoleName, description: newRoleDesc }));

    if (createRole.rejected.match(result)) {
      toast.error("Failed to create role.");
      return;
    }

    toast.success(`Role "${newRoleName}" created.`);
    setNewRoleName("");
    setNewRoleDesc("");
  };

  const requestDeleteRole = (id: number, name: string) => {
    setConfirmTarget({ id, name });
  };

  const cancelDeleteRole = () => {
    setConfirmTarget(null);
  };

  const confirmDeleteRole = async () => {
    if (!confirmTarget) return;
    const { id, name } = confirmTarget;
    setConfirmTarget(null);

    const result = await dispatch(deleteRole(id));

    if (deleteRole.rejected.match(result)) {
      toast.error(`Failed to delete role "${name}".`);
      return;
    }

    if (selectedRoleId === id) setSelectedRoleId(null);
    toast.success(`Role "${name}" deleted.`);
  };

  const savedRolePermissionIds = useMemo(
    () => new Set((rolePermissions[selectedRoleId ?? -1] || []).map((p) => p.id)),
    [rolePermissions, selectedRoleId]
  );

  // What's currently shown in the checkboxes: staged edits if present,
  // otherwise the saved server state.
  const displayedPermissionIds = pendingPermissionIds ?? savedRolePermissionIds;

  const hasUnsavedChanges =
    pendingPermissionIds !== null &&
    (pendingPermissionIds.size !== savedRolePermissionIds.size ||
      [...pendingPermissionIds].some((id) => !savedRolePermissionIds.has(id)));

  // Stage a checkbox toggle locally — no API call yet.
  const stagePermissionToggle = (permissionId: number) => {
    const base = pendingPermissionIds ?? new Set(savedRolePermissionIds);
    const next = new Set(base);
    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }
    setPendingPermissionIds(next);
  };

  // Would saving these changes remove a critical permission from every role?
  const wouldCauseLockout = (permName: string): boolean => {
    const permId = permissions.find((p) => p.name === permName)?.id;
    if (permId === undefined || selectedRoleId === null) return false;

    // If this role isn't losing the permission, no risk from this role's edit.
    const isBeingRemoved =
      savedRolePermissionIds.has(permId) && !displayedPermissionIds.has(permId);
    if (!isBeingRemoved) return false;

    // Check every other role for this permission.
    const otherRoleHasIt = roles
      .filter((r) => r.id !== selectedRoleId)
      .some((r) => (rolePermissions[r.id] || []).some((p) => p.id === permId));

    return !otherRoleHasIt;
  };

  const doSave = async () => {
    if (!selectedRoleId || pendingPermissionIds === null) return;
    setSaving(true);

    const toAdd = [...pendingPermissionIds].filter((id) => !savedRolePermissionIds.has(id));
    const toRemove = [...savedRolePermissionIds].filter((id) => !pendingPermissionIds.has(id));

    try {
      for (const id of toAdd) {
        const r = await dispatch(assignPermissionToRole({ roleId: selectedRoleId, permissionId: id }));
        if (assignPermissionToRole.rejected.match(r)) throw new Error();
      }
      for (const id of toRemove) {
        const r = await dispatch(removePermissionFromRole({ roleId: selectedRoleId, permissionId: id }));
        if (removePermissionFromRole.rejected.match(r)) throw new Error();
      }

      await dispatch(fetchRolePermissions(selectedRoleId));
      setPendingPermissionIds(null);
      toast.success("Permissions updated.");
    } catch {
      toast.error("Failed to save some permission changes.");
      await dispatch(fetchRolePermissions(selectedRoleId));
    } finally {
      setSaving(false);
    }
  };

  // Build a human-readable diff between saved and staged permission sets.
  const getPermissionDiff = () => {
    if (pendingPermissionIds === null) return { added: [], removed: [] };

    const added = [...pendingPermissionIds]
      .filter((id) => !savedRolePermissionIds.has(id))
      .map((id) => permissions.find((p) => p.id === id)?.name)
      .filter((name): name is string => !!name);

    const removed = [...savedRolePermissionIds]
      .filter((id) => !pendingPermissionIds.has(id))
      .map((id) => permissions.find((p) => p.id === id)?.name)
      .filter((name): name is string => !!name);

    return { added, removed };
  };

  const handleSaveClick = () => {
    // Lockout check takes priority — if it fires, that modal replaces the
    // normal confirmation (its own "Save anyway" still goes through doSave).
    for (const critical of CRITICAL_PERMISSIONS) {
      if (wouldCauseLockout(critical)) {
        setLockoutWarning({
          permName: critical,
          onConfirm: () => {
            setLockoutWarning(null);
            doSave();
          },
        });
        return;
      }
    }

    // Normal case: show the diff and ask for confirmation.
    const { added, removed } = getPermissionDiff();
    setSaveConfirmation({
      added,
      removed,
      onConfirm: () => {
        setSaveConfirmation(null);
        doSave();
      },
    });
  };

  const handleDiscardClick = () => {
    setPendingPermissionIds(null);
  };

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
              {roles.length === 0 && !loading && <p className="rbac-empty">No roles found.</p>}
              <ul className="rbac-list">
                {roles.map((role) => (
                  <li
                    key={role.id}
                    className={`rbac-list-item ${selectedRoleId === role.id ? "active" : ""}`}
                  >
                    <div className="rbac-role-info">
                      <strong>{role.name}</strong>
                      <span className="rbac-subtext">{role.description || "no description"}</span>
                    </div>
                    <div className="rbac-actions">
                      <button
                        className="rbac-btn-sm primary"
                        onClick={() => {
                          if (hasUnsavedChanges && selectedRoleId !== role.id) {
                            if (!confirm("You have unsaved permission changes. Discard them?")) {
                              return;
                            }
                          }
                          setSelectedRoleId(role.id);
                        }}
                      >
                        Manage Permissions
                      </button>
                      <button
                        className="rbac-btn-sm danger"
                        onClick={() => requestDeleteRole(role.id, role.name)}
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
                <div className="rbac-panel-header">
                  <h3>Permissions for {selectedRole?.name}</h3>
                  {hasUnsavedChanges && <span className="rbac-unsaved-badge">Unsaved changes</span>}
                </div>

                {permissions.length === 0 && <p className="rbac-empty">No permissions defined yet.</p>}

                <ul className="rbac-list">
                  {permissions.map((perm) => {
                    const isAssigned = displayedPermissionIds.has(perm.id);
                    return (
                      <li key={perm.id} className="rbac-list-item">
                        <label className="rbac-perm-label">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => stagePermissionToggle(perm.id)}
                          />
                          <span className="rbac-perm-text">
                            <strong>{perm.name}</strong>
                            <span className="rbac-subtext">{perm.description || "no description"}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <div className="rbac-panel-actions">
                  <button
                    className="rbac-btn-sm"
                    onClick={handleDiscardClick}
                    disabled={!hasUnsavedChanges || saving}
                  >
                    Discard
                  </button>
                  <button
                    className="rbac-btn-sm primary"
                    onClick={handleSaveClick}
                    disabled={!hasUnsavedChanges || saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmTarget && (
        <div className="confirm-modal-overlay" onClick={cancelDeleteRole}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Delete role</h4>
            <p className="confirm-modal-message">
              Are you sure you want to delete <strong>{confirmTarget.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={cancelDeleteRole}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={confirmDeleteRole}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {lockoutWarning && (
        <div className="confirm-modal-overlay" onClick={() => setLockoutWarning(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">⚠ This will lock out permission management</h4>
            <p className="confirm-modal-message">
              No other role currently has <strong>{lockoutWarning.permName}</strong>. Saving these
              changes means <strong>no role</strong> will be able to manage permissions afterward.
              Are you sure you want to continue?
            </p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={() => setLockoutWarning(null)}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={lockoutWarning.onConfirm}>
                Save anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {saveConfirmation && (
        <div className="confirm-modal-overlay" onClick={() => setSaveConfirmation(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-modal-title">Confirm permission changes</h4>
            <p className="confirm-modal-message">
              You're about to update permissions for <strong>{selectedRole?.name}</strong>:
            </p>

            {saveConfirmation.added.length > 0 && (
              <div className="diff-section">
                <p className="diff-label diff-added-label">+ Adding</p>
                <ul className="diff-list">
                  {saveConfirmation.added.map((name) => (
                    <li key={name} className="diff-added">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {saveConfirmation.removed.length > 0 && (
              <div className="diff-section">
                <p className="diff-label diff-removed-label">− Removing</p>
                <ul className="diff-list">
                  {saveConfirmation.removed.map((name) => (
                    <li key={name} className="diff-removed">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={() => setSaveConfirmation(null)}>
                Cancel
              </button>
              <button className="confirm-modal-delete" onClick={saveConfirmation.onConfirm}>
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;
