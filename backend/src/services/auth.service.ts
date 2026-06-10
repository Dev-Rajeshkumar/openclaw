import prisma from '../prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { AppError } from '../utils/response.js';
import { JwtPayload, Plan } from '../types/index.js';
import { notifyNewUser } from './notification.service.js';
import { sendEmail } from '../utils/email.js';
import { logStatusChange } from './statusLog.service.js';

interface RegisterInput { email: string; password: string; fullName: string; }
interface LoginInput { email: string; password: string; }
interface GoogleAuthInput { googleId: string; email: string; fullName: string; avatar?: string; }

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

/** Hash a refresh token for secure storage. */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Issue a new refresh token and store it in the DB. */
async function issueRefreshToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const payload: JwtPayload = { userId, email: '', plan: Plan.Free };
  const token = generateRefreshToken(payload);
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt, ipAddress, userAgent },
  });

  return token;
}

/** Rotate a refresh token: verify old, revoke it, issue new. */
export async function rotateRefreshToken(
  oldToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  // Verify the old token signature
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const oldHash = hashToken(oldToken);

  // Check if token exists and is not revoked/expired
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: oldHash, revokedAt: null },
  });

  if (!stored || stored.expiresAt < new Date()) {
    // Token reuse detected — revoke ALL tokens for this user (possible theft)
    if (stored?.expiresAt && stored.expiresAt < new Date()) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new AppError('Refresh token expired or revoked', 401);
  }

  // Get user data
  const user = await prisma.user.findUnique({ where: { id: payload.userId, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404);

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Issue new tokens
  const jwtPayload: JwtPayload = { userId: user.id, email: user.email, plan: user.plan as Plan };
  const accessToken = generateToken(jwtPayload);
  const newRefreshToken = await issueRefreshToken(user.id, ipAddress, userAgent);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id, email: user.email, fullName: user.fullName,
      plan: user.plan, isEmailVerified: user.isEmailVerified,
      avatar: user.avatar, currency: user.currency,
      language: user.language, timezone: user.timezone,
    },
  };
}

/** Revoke all refresh tokens for a user (logout everywhere). */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function register(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new AppError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { email: data.email, password: hashedPassword, fullName: data.fullName, plan: Plan.Free },
  });

  const subEndDate = new Date();
  subEndDate.setFullYear(subEndDate.getFullYear() + 100);
  await prisma.subscription.create({
    data: { userId: user.id, plan: Plan.Free, status: 'Active', currentPeriodEnd: subEndDate },
  });

  const token = generateToken({ userId: user.id, email: user.email, plan: user.plan as Plan });
  notifyNewUser(user.email, user.fullName).catch(() => {});
  await logStatusChange({ entity: 'User', entityId: user.id, action: 'REGISTER', newValue: 'Active', description: 'User registered', changedBy: user.id });

  return {
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, plan: user.plan, isEmailVerified: user.isEmailVerified },
  };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email }, include: { subscription: true } });
  if (!user || !user.password) throw new AppError('Invalid email or password', 401);
  if (user.deletedAt) throw new AppError('Account has been deactivated', 403);

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) throw new AppError('Invalid email or password', 401);

  const token = generateToken({ userId: user.id, email: user.email, plan: user.plan as Plan });

  return {
    token,
    user: {
      id: user.id, email: user.email, fullName: user.fullName, plan: user.plan,
      isEmailVerified: user.isEmailVerified, avatar: user.avatar,
      currency: user.currency, language: user.language, timezone: user.timezone,
    },
  };
}

export async function loginWithGoogle(data: GoogleAuthInput) {
  let user = await prisma.user.findUnique({ where: { googleId: data.googleId } });
  if (user && user.deletedAt) throw new AppError('Account has been deactivated', 403);

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: data.googleId, avatar: data.avatar || existingByEmail.avatar },
      });
    } else {
      user = await prisma.user.create({
        data: { email: data.email, fullName: data.fullName, googleId: data.googleId, avatar: data.avatar, isEmailVerified: true, plan: Plan.Free },
      });
      const subEndDate = new Date();
      subEndDate.setFullYear(subEndDate.getFullYear() + 100);
      await prisma.subscription.create({ data: { userId: user.id, plan: Plan.Free, status: 'Active', currentPeriodEnd: subEndDate } });
      notifyNewUser(user.email, user.fullName).catch(() => {});
    }
  }

  const token = generateToken({ userId: user.id, email: user.email, plan: user.plan as Plan });
  return {
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, plan: user.plan, isEmailVerified: user.isEmailVerified, avatar: user.avatar },
  };
}

export async function resetPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { message: 'If this email exists, a reset link has been sent.' };

  const resetToken = uuidv4();
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  if (config.smtp.user) {
    await sendEmail({
      to: email, subject: 'Password Reset - BillingBee',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your BillingBee account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${config.frontendUrl}/reset-password?token=${resetToken}" style="display: inline-block; background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p style="color: #718096;">This link expires in 1 hour.</p>
      </div>`,
    });
  }

  return { message: 'If this email exists, a reset link has been sent.' };
}
