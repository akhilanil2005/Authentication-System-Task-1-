import * as permRepo from "../repositories/permission.repository";
import * as roleRepo from "../repositories/role.repository";
import { ServiceError } from "./role.service";

export async function listPermissions() {
  return permRepo.getAllPermissions();
}

export async function createPermission(name: string, description?: string) {
  // simple check: reuse getAllPermissions since there's no getByName yet
  const all = await permRepo.getAllPermissions();
  if (all.some((p) => p.name === name)) {
    throw new ServiceError("Permission with this name already exists", 409);
  }
  return permRepo.createPermission(name, description);
}

export async function deletePermission(id: number) {
  const perm = await permRepo.getPermissionById(id);
  if (!perm) throw new ServiceError("Permission not found", 404);
  return permRepo.deletePermission(id);
}

export async function assignPermissionToRole(roleId: number, permissionId: number) {
  const role = await roleRepo.getRoleById(roleId);
  if (!role) throw new ServiceError("Role not found", 404);

  const perm = await permRepo.getPermissionById(permissionId);
  if (!perm) throw new ServiceError("Permission not found", 404);

  await permRepo.addPermissionToRole(roleId, permissionId);
  return { roleId, permissionId, roleName: role.name, permissionName: perm.name };
}

export async function removePermissionFromRole(roleId: number, permissionId: number) {
  const role = await roleRepo.getRoleById(roleId);
  if (!role) throw new ServiceError("Role not found", 404);

  await permRepo.removePermissionFromRole(roleId, permissionId);
  return { roleId, permissionId };
}

export async function getPermissionsForRole(roleId: number) {
  const role = await roleRepo.getRoleById(roleId);
  if (!role) throw new ServiceError("Role not found", 404);
  return permRepo.getPermissionsByRoleId(roleId);
}