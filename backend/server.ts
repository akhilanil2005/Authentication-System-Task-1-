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
import { getProfile } from "./services/user.service";
import { getUserProfile, updateUserProfile, getUserById, updatePassword } from "./repositories/profile.repository";
import { updateProfileSchema, changePasswordSchema,} from "./validation/profileValidation";
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many login attempts. Please try again later.",
});

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());
app.use(logger);

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

        const result = await pool.query(
            "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
            [name, email, hashedPassword]
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
//console.log("BODY:", req.body);
        const { email, password } = req.body;
        const dbName = await pool.query("SELECT current_database()");
//console.log("Database:", dbName.rows[0]);

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
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
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, },
             process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
        {
        id: user.id,
        email: user.email,
        role: user.role,
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

        res.json({
            message: "Login Successful",
            token,
            refreshToken,
            role: user.role,
            userId: user.id,
        });

    } catch (err) {
        next(err);
    }
});

app.post("/refresh", async (req: Request, res: Response,next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json("Refresh token required");
  }

  try {
    const user = jwt.verify(
  refreshToken,
  process.env.JWT_REFRESH_SECRET!
) as any;
    const result = await pool.query(
  "SELECT refresh_token FROM users WHERE id = $1",
  [user.id]
);

if (result.rows[0].refresh_token !== refreshToken) {
  return res.status(403).json({
    message: "Invalid refresh token",
  });
}

    const newToken = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET!,
  { expiresIn: "1h" }
);

    const newRefreshToken = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_REFRESH_SECRET!,
  { expiresIn: "7d" }
);

await pool.query(
  "UPDATE users SET refresh_token = $1 WHERE id = $2",
  [newRefreshToken, user.id]
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

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json("Access denied");
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!)as any;
    (req as any).user = verified;
    next();
  } catch (err) {
    return res.status(401).json("Invalid token");
  }
}

app.get("/users", async (req: Request, res: Response,next: NextFunction) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.send("Error");
    }
});

app.get("/dashboard", verifyToken, (req: Request, res: Response) => {
    res.json({
        message: "Welcome to Dashboard",
        user: (req as any).user
    });
});

app.get("/profile", verifyToken, (req: Request, res: Response,next: NextFunction) => {
  res.json({
    message: "Protected Profile",
    user: (req as any).user
  });
});
app.get("/users", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
  "SELECT id, name, email, role FROM users"
);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch users",
    });
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

app.post("/notifications", verifyToken, async (req, res) => {
  try {
    const { userId, title, message } = req.body;
if (userId === "all") {
  const result = await pool.query(
    "SELECT id FROM users WHERE role != 'admin'"
  );

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
  await sendNotificationEmail(
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
const offset = (page -1) * limit;

const { isRead } = req.query;

let notifications;

if (isRead !== undefined) {
  notifications = await getNotificationsByStatus(
    userId,
    isRead === "true"
  );
} else {
  notifications = await getNotificationsByUser(
    userId,
    page,
    limit
  );
}

res.json({
  page,
  limit,
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
  61,
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
  61,
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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});