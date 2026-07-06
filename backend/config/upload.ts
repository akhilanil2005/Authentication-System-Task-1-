import multer, { FileFilterCallback } from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export type FileCategory = 'image' | 'document' | 'attachment';

const ALLOWED_MIME_TYPES: Record<FileCategory, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  attachment: ['text/plain', 'application/zip', 'application/json']
};

// Extend Express.Multer.File so we can stash the classified type on it
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fileType?: FileCategory;
      }
    }
  }
}

export function classifyFile(mimeType: string): FileCategory | null {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES) as [FileCategory, string[]][]) {
    if (mimes.includes(mimeType)) return type;
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fileType = classifyFile(file.mimetype);
    const subfolder = fileType ? `${fileType}s` : "misc"; // images, documents, attachments
    const destDir = path.join(UPLOAD_DIR, subfolder);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    cb(null, destDir);
  },
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(24).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const fileType = classifyFile(file.mimetype);
  if (!fileType) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
  file.fileType = fileType;
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});