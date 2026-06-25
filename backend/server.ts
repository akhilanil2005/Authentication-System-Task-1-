import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import pool from "./config/db";
import rateLimit from "express-rate-limit";
import express, { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
} from "./validation/authValidation";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.send("Database connection failed");
    }
});

app.post(
  "/register",
  async (
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

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

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

        res.json({
            message: "Login Successful",
            token,
            refreshToken,
            role: user.role,
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
app.use((
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});