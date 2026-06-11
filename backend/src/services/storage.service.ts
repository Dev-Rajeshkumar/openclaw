/**
 * Multi-provider file storage service.
 * Supports local disk (default), AWS S3/MinIO, and Cloudinary.
 * Configure via UPLOAD_PROVIDER env var: 'local' | 's3' | 'cloudinary'
 */

import { config } from '../config/index.js';
import { AppError } from '../utils/response.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  url: string;
  key: string;
  mimeType: string;
  size: number;
  originalName: string;
}

/** Ensure local upload directory exists. */
function ensureLocalDir(): void {
  if (!fs.existsSync(config.upload.dir)) {
    fs.mkdirSync(config.upload.dir, { recursive: true });
  }
}

/** Save file to local disk. */
async function saveLocal(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadedFile> {
  ensureLocalDir();
  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const filePath = path.join(config.upload.dir, filename);

  await fs.promises.writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    key: filename,
    mimeType,
    size: buffer.length,
    originalName,
  };
}

/** Save file to AWS S3 or MinIO. */
async function saveS3(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadedFile> {
  const { bucket, region, accessKeyId, secretAccessKey, endpoint, cdnUrl } = config.upload.s3;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new AppError('S3 credentials not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.', 500);
  }

  // Dynamic import to avoid requiring AWS SDK when not using S3
  let S3Client: any, PutObjectCommand: any;
  try {
    const awsMod = await import('@aws-sdk/client-s3');
    S3Client = awsMod.S3Client;
    PutObjectCommand = awsMod.PutObjectCommand;
  } catch {
    throw new AppError('AWS SDK not installed. Run: npm install @aws-sdk/client-s3', 500);
  }

  const ext = path.extname(originalName);
  const key = `uploads/${uuidv4()}${ext}`;

  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: { accessKeyId, secretAccessKey },
    // For MinIO, path-style addressing is required
    forcePathStyle: !!endpoint,
  });

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  }));

  const url = cdnUrl
    ? `${cdnUrl.replace(/\/$/, '')}/${key}`
    : endpoint
      ? `${endpoint}/${bucket}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { url, key, mimeType, size: buffer.length, originalName };
}

/** Save file to Cloudinary. */
async function saveCloudinary(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadedFile> {
  const { cloudName, apiKey, apiSecret } = config.upload.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.', 500);
  }

  // Dynamic import to avoid requiring cloudinary when not using it
  let v2: any;
  try {
    const cloudinaryMod = await import('cloudinary');
    v2 = cloudinaryMod.v2;
  } catch {
    throw new AppError('Cloudinary SDK not installed. Run: npm install cloudinary', 500);
  }

  v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const resourceType = mimeType.startsWith('image/') ? 'image'
    : mimeType === 'application/pdf' ? 'raw'
    : 'auto';

  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = v2.uploader.upload_stream(
      { resource_type: resourceType, folder: 'billingbee' },
      (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

  return {
    url: result.secure_url,
    key: result.public_id,
    mimeType,
    size: result.bytes,
    originalName,
  };
}

/** Upload a file buffer to the configured storage provider. */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadedFile> {
  switch (config.upload.provider) {
    case 's3':
      return saveS3(buffer, originalName, mimeType);
    case 'cloudinary':
      return saveCloudinary(buffer, originalName, mimeType);
    case 'local':
    default:
      return saveLocal(buffer, originalName, mimeType);
  }
}

/** Delete a file from the configured storage provider. */
export async function deleteFile(key: string, mimeType?: string): Promise<void> {
  switch (config.upload.provider) {
    case 's3': {
      const { bucket, region, accessKeyId, secretAccessKey, endpoint } = config.upload.s3;
      if (!bucket || !accessKeyId || !secretAccessKey) return;
      try {
        const awsMod = await import('@aws-sdk/client-s3');
        const client = new awsMod.S3Client({
          region, endpoint: endpoint || undefined,
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: !!endpoint,
        });
        await client.send(new awsMod.DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (err) {
        console.error('[Storage] S3 delete failed:', err);
      }
      break;
    }
    case 'cloudinary': {
      const { cloudName, apiKey, apiSecret } = config.upload.cloudinary;
      if (!cloudName || !apiKey || !apiSecret) return;
      try {
        const cloudinaryMod = await import('cloudinary');
        cloudinaryMod.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
        await cloudinaryMod.v2.uploader.destroy(key);
      } catch (err) {
        console.error('[Storage] Cloudinary delete failed:', err);
      }
      break;
    }
    case 'local':
    default: {
      const filePath = path.join(config.upload.dir, key);
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error('[Storage] Local delete failed:', err);
      }
      break;
    }
  }
}
