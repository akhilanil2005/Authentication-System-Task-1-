const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const express = require("express");
const pool = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.send("Database connection failed");
    }
});

app.post("/register", async (req, res) => {
    try {
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
    console.log(err);
    console.log(err.response);
    res.status(500).send(err.message);
}
});
app.post("/login", async (req, res) => {
    try {
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
            return res.status(400).send("Invalid Password");
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, },
             process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login Successful",
            token,
            role: user.role,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Login failed");
    }
});

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json("Access denied");
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    return res.status(401).json("Invalid token");
  }
}
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.send("Error");
    }
});

app.get("/dashboard", verifyToken, (req, res) => {
    res.json({
        message: "Welcome to Dashboard",
        user: req.user
    });
});

app.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Protected Profile",
    user: req.user
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});