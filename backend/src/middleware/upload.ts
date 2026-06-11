import multer from 'multer';
import { config } from '../config/index.js';
import { AppError } from '../utils/response.js';

/**
 * Memory storage multer config.
 * Files are stored in memory as Buffers, then uploaded to the configured
 * storage provider (local/S3/Cloudinary) by the storage service.
 * This ensures consistent behavior across all storage backends.
 */
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
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
      next(new AppError(`File too large. Maximum size is ${config.upload.maxSize / 1024 / 1024}MB.`, 400));
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
