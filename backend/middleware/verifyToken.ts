import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json("Access denied");
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as any).user = verified;
    next();
  } catch (err) {
    return res.status(401).json("Invalid token");
  }
}