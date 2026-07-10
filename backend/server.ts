import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import pool from "./config/db";
import rateLimit from "express-rate-limit";
import express, { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, } from "./validation/authValidation";
import { logger } from "./middleware/logger";
import { createServer } from "http";
import { Server } from "socket.io";
import { sendNotificationEmail } from "./services/emailService";
import { getUserProfile, updateUserProfile, getUserById, updatePassword } from "./repositories/profile.repository";
import { updateProfileSchema, changePasswordSchema,} from "./validation/profileValidation";
import { getPermissionsForRole } from "./repositories/role.repository";
import { verifyToken } from "./middleware/verifyToken";
import {
  createActivity,
  getActivitiesByUser
} from "./repositories/activity.repository";
import {
  createNotification,
  getNotificationsByUser,
  getNotificationsByStatus,
  markAsRead,
  deleteNotification
} from "./repositories/notificationRepository";
import * as roleService from "./services/role.service";
import * as permissionService from "./services/permission.service";
import { ServiceError } from "./services/role.service";
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  assignRoleToUserSchema,
  assignPermissionToRoleSchema,
} from "./validation/rbacValidation";
import { requirePermission, requireRole } from "./middleware/requirePermission";
import filesRouter from "./routes/files";
import searchRoutes from "./routes/search";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many login attempts. Please try again later.",
});

const app = express();
app.locals.pool = pool;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  maxAge: 86400, // cache preflight for 24 hours
}));
app.use(express.json());
app.use(logger);
app.use("/files", filesRouter);
app.use("/api", searchRoutes);

app.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.send("Database connection failed");
    }
});

app.post( "/register", async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const { error } = registerSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
}
        const { name, email, password } = req.body;

        const existingUser = await pool.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);

if (existingUser.rows.length > 0) {
  return res.status(400).json({
    message: "Email already registered"
  });
}

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

const defaultRoleResult = await pool.query(
  "SELECT id FROM roles WHERE name = $1",
  ["user"]
);

if (defaultRoleResult.rows.length === 0) {
  return res.status(500).json({
    success: false,
    message: "Default role not configured",
  });
}

const defaultRoleId = defaultRoleResult.rows[0].id;

const result = await pool.query(
  "INSERT INTO users(name,email,password,role_id) VALUES($1,$2,$3,$4) RETURNING *",
  [name, email, hashedPassword, defaultRoleId]
);
        await createActivity(
  result.rows[0].id,
  "REGISTER",
  req.ip || "unknown"
);

        res.json(result.rows[0]);

    } catch (err) {
        next(err);
}
});
app.post("/login", authLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
        success: false,
        message: error.details[0].message,
  });
} 
        const { email, password } = req.body;
        const dbName = await pool.query("SELECT current_database()");
//console.log("Database:", dbName.rows[0]);

        const result = await pool.query(
  `SELECT u.*, r.name AS role_name
   FROM users u
   LEFT JOIN roles r ON u.role_id = r.id
   WHERE u.email = $1`,
  [email.trim()]
);
       
//console.log("Rows count:", result.rows.length);
//console.log("Rows:", result.rows);

        if (result.rows.length === 0) {
            return res.status(400).send("User not found");
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );
        if (!validPassword) {
  return res.status(401).json({ message: "Invalid Password" });
}       
        const permissions = user.role_id
        ? await getPermissionsForRole(user.role_id): [];

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role_name, roleId: user.role_id, permissions },
             process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
        {
        id: user.id,
        email: user.email,
        role: user.role_name,
        roleId: user.role_id,
        permissions,
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" }
    );
    await pool.query(
  "UPDATE users SET refresh_token = $1 WHERE id = $2",
  [refreshToken, user.id]
);
  await createActivity(
  user.id,
  "LOGIN",
  req.ip || "unknown"
);
sendNotificationEmail(
  user.email,
  "Login Alert",
  `Your account was logged in successfully on ${new Date().toLocaleString()}`
);
        res.json({
            message: "Login Successful",
            token,
            refreshToken,
            role: user.role_name,
            userId: user.id,
        });

    } catch (err) {
        next(err);
    }
});

app.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json("Refresh token required");
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as any;

    const result = await pool.query(`
      SELECT u.refresh_token, u.email, u.role_id, r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [decoded.id]);

    if (result.rows[0].refresh_token !== refreshToken) {
      return res.status(403).json({
        message: "Invalid refresh token",
      });
    }

    const dbUser = result.rows[0];

    const permissions = dbUser.role_id
      ? await getPermissionsForRole(dbUser.role_id)
      : [];

    const newToken = jwt.sign(
      {
        id: decoded.id,
        email: dbUser.email,
        role: dbUser.role_name,
        roleId: dbUser.role_id,
        permissions,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        email: dbUser.email,
        role: dbUser.role_name,
        roleId: dbUser.role_id,
        permissions,
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    await pool.query(
      "UPDATE users SET refresh_token = $1 WHERE id = $2",
      [newRefreshToken, decoded.id]
    );

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  }
  catch (err) {
    return res.status(403).json("Invalid refresh token");
  }
});

// ---------- ROLES ----------

app.get("/roles", verifyToken, requirePermission("roles:manage"), async (req, res, next) => {
  try {
    const roles = await roleService.listRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
});
app.get("/roles/list", verifyToken, requirePermission("users:view"), async (req, res, next) => {
  try {
    const roles = await roleService.listRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
});

app.post("/roles", verifyToken, requirePermission("roles:manage"), async (req, res, next) => {
  try {
    const { error } = createRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { name, description } = req.body;
    const role = await roleService.createRole(name, description);
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
});

app.put("/roles/:id", verifyToken, requirePermission("roles:manage"), async (req, res, next) => {
  try {
    const { error } = updateRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const id = Number(req.params.id);
    const { name, description } = req.body;
    const role = await roleService.updateRole(id, name, description);
    res.json(role);
  } catch (err) {
    next(err);
  }
});

app.delete("/roles/:id", verifyToken, requirePermission("roles:manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await roleService.deleteRole(id);
    res.json({ message: "Role deleted" });
  } catch (err) {
    next(err);
  }
});

app.put("/users/:id/role", verifyToken, requirePermission("roles:manage"), async (req, res, next) => {
  try {
    const { error } = assignRoleToUserSchema.validate({
      userId: Number(req.params.id),
      roleId: req.body.roleId,
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const userId = Number(req.params.id);
    const { roleId } = req.body;
    const result = await roleService.assignRoleToUser(userId, roleId);

    await createActivity(
      (req as any).user.id,
      "ROLE_CHANGE",
      `Changed role for user ${userId} to role ID ${roleId}`
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------- PERMISSIONS ----------

app.get("/permissions", verifyToken, requirePermission("permissions:manage"), async (req, res, next) => {
  try {
    const permissions = await permissionService.listPermissions();
    res.json(permissions);
  } catch (err) {
    next(err);
  }
});

app.post("/permissions", verifyToken, requirePermission("permissions:manage"), async (req, res, next) => {
  try {
    const { error } = createPermissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { name, description } = req.body;
    const permission = await permissionService.createPermission(name, description);
    res.status(201).json(permission);
  } catch (err) {
    next(err);
  }
});

app.delete("/permissions/:id", verifyToken, requirePermission("permissions:manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await permissionService.deletePermission(id);
    res.json({ message: "Permission deleted" });
  } catch (err) {
    next(err);
  }
});

app.get("/roles/:id/permissions", verifyToken, requirePermission("permissions:manage"), async (req, res, next) => {
  try {
    const roleId = Number(req.params.id);
    const permissions = await permissionService.getPermissionsForRole(roleId);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
});

app.post("/roles/:id/permissions", verifyToken, requirePermission("permissions:manage"), async (req, res, next) => {
  try {
    const roleId = Number(req.params.id);
    const { error } = assignPermissionToRoleSchema.validate({
      roleId,
      permissionId: req.body.permissionId,
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const result = await permissionService.assignPermissionToRole(roleId, req.body.permissionId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

app.delete("/roles/:id/permissions/:permissionId", verifyToken, requirePermission("permissions:manage"), async (req, res, next) => {
  try {
    const roleId = Number(req.params.id);
    const permissionId = Number(req.params.permissionId);
    const result = await permissionService.removePermissionFromRole(roleId, permissionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get("/dashboard", verifyToken, (req: Request, res: Response) => {
    res.json({
        message: "Welcome to Dashboard",
        user: (req as any).user
    });
});

app.get("/profile", verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result.rows[0];

    const permissions = user.role_id
      ? await getPermissionsForRole(user.role_id)
      : [];

    res.json({ user: { ...user, permissions } });
  } 
  catch (err) {
    next(err);
  }
});
app.get("/users", verifyToken, requirePermission("users:view"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, r.name AS role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
app.delete("/users/:id", verifyToken, requirePermission("users:delete"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const userResult = await pool.query("SELECT name FROM users WHERE id = $1", [id]);
    const deletedUserName = userResult.rows[0]?.name || `User #${id}`;

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    await createActivity(
      (req as any).user.id,
      "USER_DELETE",
      `Deleted user: ${deletedUserName}`
    );

    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
});
app.get("/profile/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await getUserProfile(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

app.put("/profile/:id", async (req, res) => {
    try {
  const { error } = updateProfileSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  const id = Number(req.params.id);

    const { name, email } = req.body;

    const updatedUser = await updateUserProfile(
      id,
      name,
      email
    );
  sendNotificationEmail(
  updatedUser.email,
  "Profile Updated",
  `Your profile information was updated successfully on ${new Date().toLocaleString()}`
);
    await createActivity(
  id,
  "PROFILE_UPDATE",
  "Profile updated"
);

    res.json(updatedUser);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
app.put("/change-password/:id", async (req, res) => {
  try {
    const { error } = changePasswordSchema.validate(req.body);

if (error) {
  return res.status(400).json({
    message: error.details[0].message,
  });
}
    const id = Number(req.params.id);
    const { currentPassword, newPassword } = req.body;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await updatePassword(
      id,
      hashedPassword
    );
  sendNotificationEmail(
  user.email,
  "Password Changed",
  `Your password was changed successfully on ${new Date().toLocaleString()}`
);
    await createActivity(
  id,
  "PASSWORD_CHANGE",
  "Password changed"
);

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

app.post("/notifications", verifyToken, requirePermission("notifications:create"), async (req, res) => {
  try {
    const { userId, title, message } = req.body;
if (userId === "all") {
  const result = await pool.query(`
  SELECT u.id FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE r.name != 'admin'
`);

  for (const user of result.rows) {
    const notification = await createNotification(
      user.id,
      title,
      message
    );

    io.emit("newNotification", notification);
  }

  return res.status(201).json({
    message: "Notification sent to all users",
  });
}
    const notification = await createNotification(
      userId,
      title,
      message
    );
  sendNotificationEmail(
  process.env.EMAIL_USER!,
  "New Notification Created",
  `Notification: ${title}\n${message}`
);
    await createActivity(
  userId,
  "CREATE_NOTIFICATION",
  `Created notification: ${title}`
);
    io.emit("newNotification", notification);

    res.status(201).json(notification);
  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: "Failed to create notification"
  });
}
});

app.get("/notifications/:userId", verifyToken, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const search = (req.query.search as string) || "";
    const { isRead } = req.query;

    let notifications, totalCount;

    if (isRead !== undefined) {
      notifications = await getNotificationsByStatus(userId, isRead === "true");
      totalCount = notifications.length;
    } else {
      const result = await getNotificationsByUser(userId, page, limit, search);
      notifications = result.notifications;
      totalCount = result.totalCount;
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    res.json({
      page,
      limit,
      totalCount,
      totalPages,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

app.put("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    await markAsRead(notificationId);
    await createActivity(
  (req as any).user.id,
  "READ_NOTIFICATION",
  `Notification ${notificationId} marked as read`
);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
});

app.delete("/notifications/:id", verifyToken, async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    await deleteNotification(notificationId);
    await createActivity(
  (req as any).user.id,
  "DELETE_NOTIFICATION",
  `Notification ${notificationId} deleted`
);

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete notification",
    });
  }
});
app.get("/activity-logs/:userId", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    const activities = await getActivitiesByUser(userId);

    res.json(activities);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch activity logs",
    });
  }
});

app.use((
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

app.post("/logout", verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    await createActivity(
      userId,
      "LOGOUT",
      req.ip || "unknown"
    );

    await pool.query(
      "UPDATE users SET refresh_token = NULL WHERE id = $1",
      [userId]
    );

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Logout failed",
    });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});