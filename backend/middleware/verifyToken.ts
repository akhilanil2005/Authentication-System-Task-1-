import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import  pool  from "../config/db"; // adjust to your actual db import

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json("Access denied");
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Only trust the user ID from the token; fetch fresh role/permissions from DB
    const result = await pool.query(
      `SELECT u.id, u.email, r.name AS role, r.id AS "roleId",
              COALESCE(array_agg(p.name) FILTER (WHERE p.name IS NOT NULL), '{}') AS permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1
       GROUP BY u.id, r.name, r.id`,
      [verified.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json("User not found");
    }

    (req as any).user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json("Invalid token");
  }
}