/**
 * File Upload Virus Scan Middleware
 *
 * Scans uploaded files using ClamAV (optional).
 * Falls through if ClamAV is not available.
 *
 * Requires: clamav-daemon running (docker-compose optional service)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const CLAMAV_HOST = process.env.CLAMAV_HOST || 'localhost';
const CLAMAV_PORT = process.env.CLAMAV_PORT || '3310';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Blocked file extensions
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
  '.jar', '.ps1', '.msi', '.dll', '.sh', '.php', '.asp', '.aspx',
  '.jsp', '.cgi', '.pl', '.py', '.rb',
];

interface ScanResult {
  clean: boolean;
  virus?: string;
  error?: string;
}

async function scanFile(filePath: string): Promise<ScanResult> {
  try {
    // Check if clamdscan is available
    const { stdout } = await execAsync(`clamdscan --no-summary --host=${CLAMAV_HOST} --port=${CLAMAV_PORT} "${filePath}"`, {
      timeout: 30000,
    });

    if (stdout.includes('OK')) {
      return { clean: true };
    }

    const match = stdout.match(/: (.+) FOUND/);
    return {
      clean: false,
      virus: match ? match[1] : 'Unknown threat',
    };
  } catch (err: any) {
    if (err.stdout?.includes('OK')) {
      return { clean: true };
    }
    // ClamAV not available — allow file (log warning)
    return { clean: true, error: 'ClamAV not available, skipped scan' };
  }
}

export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    // Only process file uploads
    if (ctx.request.method !== 'POST' || !ctx.request.files) {
      return next();
    }

    const files = ctx.request.files;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const tempDir = path.join(uploadsDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });

    for (const [field, file] of Object.entries(files)) {
      const fileObj = Array.isArray(file) ? file[0] : file;
      if (!fileObj) continue;

      // Check file extension
      const ext = path.extname(fileObj.name || '').toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        return ctx.badRequest(`File type "${ext}" is not allowed for security reasons`);
      }

      // Check file size
      if (fileObj.size > MAX_FILE_SIZE) {
        return ctx.badRequest(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Scan with ClamAV if available
      if (process.env.ENABLE_VIRUS_SCAN === 'true') {
        const tempPath = path.join(tempDir, `scan_${Date.now()}_${fileObj.name}`);
        try {
          fs.writeFileSync(tempPath, Buffer.from(await fileObj.arrayBuffer()));
          const result = await scanFile(tempPath);

          if (!result.clean) {
            strapi.log.warn(`[VirusScan] Threat detected: ${result.virus} in ${fileObj.name}`);
            return ctx.badRequest('File rejected: security threat detected');
          }

          if (result.error) {
            strapi.log.warn(`[VirusScan] ${result.error}`);
          }
        } finally {
          fs.unlinkSync(tempPath);
        }
      }
    }

    return next();
  };
};

export { scanFile, BLOCKED_EXTENSIONS };
