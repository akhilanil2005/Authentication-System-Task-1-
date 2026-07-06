import { Router, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import pool from "../config/db";
import { verifyToken } from "../middleware/verifyToken";
import { requirePermission } from "../middleware/requirePermission";
import { upload, UPLOAD_DIR, FileCategory } from "../config/upload";
import { createActivity } from "../repositories/activity.repository";

const router = Router();

interface FileRecord {
  id: number;
  owner_id: number;
  owner_name: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  file_type: FileCategory;
  storage_path: string;
  download_token: string;
  created_at: string;
}

// --- UPLOAD ---
router.post(
  "/upload",
  verifyToken,
  requirePermission("files:upload"),
  (req: Request, res: Response) => {
    upload.single("file")(req, res, async (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ message });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      try {
        const userId = (req as any).user.id;
        const downloadToken = crypto.randomBytes(32).toString("hex");

        const result = await pool.query(
          `INSERT INTO files
            (owner_id, original_name, stored_name, mime_type, size_bytes, file_type, storage_path, download_token)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, original_name, mime_type, size_bytes, file_type, download_token, created_at`,
          [
            userId,
            req.file.originalname,
            req.file.filename,
            req.file.mimetype,
            req.file.size,
            req.file.fileType,
            path.relative(UPLOAD_DIR, req.file.path),
            downloadToken,
          ]
        );

        await createActivity(userId, "FILE_UPLOAD", req.file.originalname);

        res.status(201).json(result.rows[0]);
      } catch (dbErr) {
        fs.unlink(req.file.path, () => {});
        console.error(dbErr);
        res.status(500).json({ message: "Failed to save file metadata" });
      }
    });
  }
);

// --- LIST ---
router.get(
  "/",
  verifyToken,
  requirePermission("files:view"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const hasViewAll = user.permissions.includes("files:view_all");

      const query = hasViewAll
        ? `SELECT f.id, f.owner_id, f.original_name, f.mime_type, f.size_bytes,
                  f.file_type, f.download_token, f.created_at, u.name AS owner_name
           FROM files f
           JOIN users u ON f.owner_id = u.id
           ORDER BY f.created_at DESC`
        : `SELECT f.id, f.owner_id, f.original_name, f.mime_type, f.size_bytes,
                  f.file_type, f.download_token, f.created_at, u.name AS owner_name
           FROM files f
           JOIN users u ON f.owner_id = u.id
           WHERE f.owner_id = $1
           ORDER BY f.created_at DESC`;
      const params = hasViewAll ? [] : [user.id];

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  }
);

// --- SECURE DOWNLOAD ---
router.get("/download/:token", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await pool.query(
      "SELECT * FROM files WHERE download_token = $1",
      [req.params.token]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ message: "File not found" });

    const isOwner = file.owner_id === user.id;
    const canViewAll = user.permissions.includes("files:view_all");
    if (!isOwner && !canViewAll) {
      return res.status(403).json({ message: "Not authorized to access this file" });
    }

    const filePath = path.join(UPLOAD_DIR, file.storage_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing from storage" });
    }

    res.download(filePath, file.original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download failed" });
  }
});

// --- DELETE ---
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await pool.query(
      "SELECT * FROM files WHERE id = $1",
      [req.params.id]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ message: "File not found" });

    const isOwner = file.owner_id === user.id;
    const canDelete = user.permissions.includes("files:delete");
    if (!isOwner && !canDelete) {
      return res.status(403).json({ message: "Not authorized to delete this file" });
    }

    await pool.query("DELETE FROM files WHERE id = $1", [req.params.id]);
    fs.unlink(path.join(UPLOAD_DIR, file.storage_path), (err) => {
      if (err) console.error("Failed to delete file from disk:", err);
    });

    await createActivity(user.id, "FILE_DELETE", file.original_name);

    res.json({ message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;