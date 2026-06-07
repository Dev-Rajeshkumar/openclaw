import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { config } from '../config/index.js';
import { AppError } from '../utils/response.js';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed.`, 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 5,
  },
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 5);
export const uploadLogo = upload.single('logo');
export const uploadReceipt = upload.single('receipt');

export const handleUploadError = (
  err: Error,
  _req: Express.Request,
  _res: Express.Response,
  next: Express.NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(
        new AppError(
          `File too large. Maximum size is ${config.upload.maxSize / 1024 / 1024}MB.`,
          400
        )
      );
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      next(new AppError('Too many files. Maximum is 5 files.', 400));
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      next(new AppError('Unexpected field name for file upload.', 400));
    } else {
      next(new AppError(`Upload error: ${err.message}`, 400));
    }
  } else {
    next(err);
  }
};
