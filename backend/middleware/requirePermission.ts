import { Request, Response, NextFunction } from "express";

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  roleId: number;
  permissions: string[];
}

export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser | undefined;

    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }

    if (!user.permissions || !user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: `Forbidden: missing permission '${requiredPermission}'`,
      });
    }

    next();
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser | undefined;

    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Forbidden: requires one of roles [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
}