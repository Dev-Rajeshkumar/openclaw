import prisma from '../prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { AppError } from '../utils/response.js';
import { JwtPayload, Plan } from '../types/index.js';
import { notifyNewUser } from './notification.service.js';
import { sendEmail } from '../utils/email.js';
import { logStatusChange } from './statusLog.service.js';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface GoogleAuthInput {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export async function register(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      plan: Plan.Free,
    },
  });

  // Create subscription
  const subEndDate = new Date();
  subEndDate.setFullYear(subEndDate.getFullYear() + 100);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: Plan.Free,
      status: 'Active',
      currentPeriodEnd: subEndDate,
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    plan: user.plan as Plan,
  });

  // Fire and forget notifications
  notifyNewUser(user.email, user.fullName).catch(() => {});

  await logStatusChange({
    entity: 'User',
    entityId: user.id,
    action: 'REGISTER',
    newValue: 'Active',
    description: 'User registered',
    changedBy: user.id,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      plan: user.plan,
      isEmailVerified: user.isEmailVerified,
    },
  };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { subscription: true },
  });

  if (!user || !user.password) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.deletedAt) {
    throw new AppError('Account has been deactivated', 403);
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    plan: user.plan as Plan,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      plan: user.plan,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      currency: user.currency,
      language: user.language,
      timezone: user.timezone,
    },
  };
}

export async function loginWithGoogle(data: GoogleAuthInput) {
  let user = await prisma.user.findUnique({
    where: { googleId: data.googleId },
  });

  if (user && user.deletedAt) {
    throw new AppError('Account has been deactivated', 403);
  }

  if (!user) {
    // Check if email already exists
    const existingByEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingByEmail) {
      // Link Google account to existing email account
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: data.googleId, avatar: data.avatar || existingByEmail.avatar },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          googleId: data.googleId,
          avatar: data.avatar,
          isEmailVerified: true,
          plan: Plan.Free,
        },
      });

      const subEndDate = new Date();
      subEndDate.setFullYear(subEndDate.getFullYear() + 100);

      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: Plan.Free,
          status: 'Active',
          currentPeriodEnd: subEndDate,
        },
      });

      notifyNewUser(user.email, user.fullName).catch(() => {});
    }
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    plan: user.plan as Plan,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      plan: user.plan,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
    },
  };
}

export async function resetPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal whether the email exists
    return { message: 'If this email exists, a reset link has been sent.' };
  }

  const resetToken = uuidv4();
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // In production, store reset token in DB or Redis and send email
  // For now, we just send the email if SMTP is configured
  if (config.smtp.user) {
    await sendEmail({
      to: email,
      subject: 'Password Reset - BillingBee',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your BillingBee account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${config.frontendUrl}/reset-password?token=${resetToken}"
             style="display: inline-block; background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
          <p style="color: #718096;">This link expires in 1 hour.</p>
        </div>
      `,
    });
  }

  return { message: 'If this email exists, a reset link has been sent.' };
}
