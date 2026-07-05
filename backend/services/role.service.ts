import * as roleRepo from "../repositories/role.repository";
import pool from "../config/db";

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listRoles() {
  return roleRepo.getAllRoles();
}

export async function getRole(id: number) {
  const role = await roleRepo.getRoleById(id);
  if (!role) throw new ServiceError("Role not found", 404);
  return role;
}

export async function createRole(name: string, description?: string) {
  const existing = await roleRepo.getRoleByName(name);
  if (existing) throw new ServiceError("Role with this name already exists", 409);
  return roleRepo.createRole(name, description);
}

export async function updateRole(id: number, name: string, description?: string) {
  const role = await roleRepo.getRoleById(id);
  if (!role) throw new ServiceError("Role not found", 404);

  const nameClash = await roleRepo.getRoleByName(name);
  if (nameClash && nameClash.id !== id) {
    throw new ServiceError("Another role already uses this name", 409);
  }

  return roleRepo.updateRole(id, name, description);
}

export async function deleteRole(id: number) {
  const role = await roleRepo.getRoleById(id);
  if (!role) throw new ServiceError("Role not found", 404);

  // Prevent deleting a role that's still assigned to users
  const inUse = await pool.query(
    "SELECT COUNT(*) FROM users WHERE role_id = $1",
    [id]
  );
  if (Number(inUse.rows[0].count) > 0) {
    throw new ServiceError(
      "Cannot delete a role that is still assigned to users. Reassign those users first.",
      409
    );
  }

  return roleRepo.deleteRole(id);
}

export async function assignRoleToUser(userId: number, roleId: number) {
  const role = await roleRepo.getRoleById(roleId);
  if (!role) throw new ServiceError("Role not found", 404);

  const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (userExists.rows.length === 0) throw new ServiceError("User not found", 404);

  await roleRepo.assignRoleToUser(userId, roleId);
  return { userId, roleId, roleName: role.name };
}

export async function getPermissionsForRole(roleId: number) {
  const role = await roleRepo.getRoleById(roleId);
  if (!role) throw new ServiceError("Role not found", 404);
  return roleRepo.getPermissionsForRole(roleId);
}