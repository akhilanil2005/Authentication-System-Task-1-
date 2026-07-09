import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
}
export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: string;
}

// ---- Thunks ----

export const fetchAllUsers = createAsyncThunk("rbac/fetchAllUsers", async () => {
  const res = await api.get("/users");
  return res.data as UserListItem[];
});

export const fetchRoles = createAsyncThunk("rbac/fetchRoles", async () => {
  const res = await api.get("/roles/list");
  return res.data;
});
export const fetchPermissions = createAsyncThunk("rbac/fetchPermissions", async () => {
  const res = await api.get("/permissions");
  return res.data as Permission[];
});

export const createRole = createAsyncThunk(
  "rbac/createRole",
  async ({ name, description }: { name: string; description?: string }) => {
    const res = await api.post("/roles", { name, description });
    return res.data as Role;
  }
);

export const deleteRole = createAsyncThunk("rbac/deleteRole", async (id: number) => {
  await api.delete(`/roles/${id}`);
  return id;
});
  export const deleteUser = createAsyncThunk("rbac/deleteUser", async (id: number) => {
  await api.delete(`/users/${id}`);
  return id;
});

export const assignRoleToUser = createAsyncThunk(
  "rbac/assignRoleToUser",
  async ({ userId, roleId }: { userId: number; roleId: number }) => {
    const res = await api.put(`/users/${userId}/role`, { roleId });
    return res.data;
  }
);

export const createPermission = createAsyncThunk(
  "rbac/createPermission",
  async ({ name, description }: { name: string; description?: string }) => {
    const res = await api.post("/permissions", { name, description });
    return res.data as Permission;
  }
);

export const deletePermission = createAsyncThunk(
  "rbac/deletePermission",
  async (id: number) => {
    await api.delete(`/permissions/${id}`);
    return id;
  }
);

export const fetchRolePermissions = createAsyncThunk(
  "rbac/fetchRolePermissions",
  async (roleId: number) => {
    const res = await api.get(`/roles/${roleId}/permissions`);
    return { roleId, permissions: res.data as Permission[] };
  }
);

export const assignPermissionToRole = createAsyncThunk(
  "rbac/assignPermissionToRole",
  async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
    await api.post(`/roles/${roleId}/permissions`, { permissionId });
    return { roleId, permissionId };
  }
);

export const removePermissionFromRole = createAsyncThunk(
  "rbac/removePermissionFromRole",
  async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
    await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
    return { roleId, permissionId };
  }
);

// ---- Slice ----

 export interface RbacState {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<number, Permission[]>; // roleId -> its permissions
  users: UserListItem[];
  loading: boolean;
  error: string | null;
}

const initialState: RbacState = {
  roles: [],
  permissions: [],
  rolePermissions: {},
  users: [],
  loading: false,
  error: null,
};

const rbacSlice = createSlice({
  name: "rbac",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch roles";
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        })     
        .addCase(createPermission.fulfilled, (state, action) => {
         state.permissions.push(action.payload);
        })
        .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter((p) => p.id !== action.payload);
        })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter((r) => r.id !== action.payload);
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.rolePermissions[action.payload.roleId] = action.payload.permissions;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
  state.users = state.users.filter((u) => u.id !== action.payload);
})     
  },
});

export default rbacSlice.reducer;