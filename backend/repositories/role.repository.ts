import pool from "../config/db";

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

export async function getAllRoles(): Promise<Role[]> {
  const result = await pool.query("SELECT * FROM roles ORDER BY id");
  return result.rows;
}

export async function getRoleById(id: number): Promise<Role | null> {
  const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function getRoleByName(name: string): Promise<Role | null> {
  const result = await pool.query("SELECT * FROM roles WHERE name = $1", [name]);
  return result.rows[0] || null;
}

export async function createRole(name: string, description?: string): Promise<Role> {
  const result = await pool.query(
    "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *",
    [name, description || null]
  );
  return result.rows[0];
}

export async function updateRole(
  id: number,
  name: string,
  description?: string
): Promise<Role | null> {
  const result = await pool.query(
    "UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *",
    [name, description || null, id]
  );
  return result.rows[0] || null;
}

export async function deleteRole(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM roles WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

// Assign a role to a user
export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
  await pool.query("UPDATE users SET role_id = $1 WHERE id = $2", [roleId, userId]);
}

// Get permissions attached to a role (used for JWT embedding at login)
export async function getPermissionsForRole(roleId: number): Promise<string[]> {
  const result = await pool.query(
    `SELECT p.name FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1`,
    [roleId]
  );
  return result.rows.map((r: {name: string}) => r.name);
}