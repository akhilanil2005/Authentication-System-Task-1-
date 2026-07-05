import pool from "../config/db";

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

export async function getAllPermissions(): Promise<Permission[]> {
  const result = await pool.query("SELECT * FROM permissions ORDER BY id");
  return result.rows;
}

export async function getPermissionById(id: number): Promise<Permission | null> {
  const result = await pool.query("SELECT * FROM permissions WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function createPermission(
  name: string,
  description?: string
): Promise<Permission> {
  const result = await pool.query(
    "INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING *",
    [name, description || null]
  );
  return result.rows[0];
}

export async function deletePermission(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM permissions WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// Assign a permission to a role
export async function addPermissionToRole(
  roleId: number,
  permissionId: number
): Promise<void> {
  await pool.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [roleId, permissionId]
  );
}

// Remove a permission from a role
export async function removePermissionFromRole(
  roleId: number,
  permissionId: number
): Promise<void> {
  await pool.query(
    "DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2",
    [roleId, permissionId]
  );
}

// Get all permissions for a specific role, with id + name (for the admin UI)
export async function getPermissionsByRoleId(roleId: number): Promise<Permission[]> {
  const result = await pool.query(
    `SELECT p.* FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.id`,
    [roleId]
  );
  return result.rows;
}