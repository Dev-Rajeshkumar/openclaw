import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { IAuthTokens, ITokenPayload, SubscriptionPlan } from '../types/index.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

const prisma = new PrismaClient();

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

export class AuthService {
  /**
   * Register a new user with email/password
   */
  async register(input: RegisterInput) {
    const { email, password, fullName, businessName, phone } = input;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    if (!password) {
      throw new AppError('Password is required for email registration', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with a default business
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone: phone || null,
        },
      });

      // Create default business for the user
      await tx.business.create({
        data: {
          userId: newUser.id,
          name: businessName || `${fullName}'s Business`,
          plan: SubscriptionPlan.FREE,
        },
      });

      return newUser;
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    const userResponse = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        googleId: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return { user: userResponse, tokens };
  }

  /**
   * Login user with email/password
   */
  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check account is not soft-deleted
    if (user.deletedAt) {
      throw new AppError('Account has been deactivated', 403);
    }

    // Google-auth users may not have a password
    if (!user.password) {
      throw new AppError('This account uses Google Sign-In. Please login with Google.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    const userResponse = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        googleId: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return { user: userResponse, tokens };
  }

  /**
   * Google OAuth login/signup
   */
  async googleAuth(idToken: string) {
    // Verify the Google ID token
    const googleUser = await this.verifyGoogleToken(idToken);

    if (!googleUser.email) {
      throw new AppError('Failed to get email from Google', 400);
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Account exists — check if soft-deleted
      if (user.deletedAt) {
        throw new AppError('Account has been deactivated', 403);
      }

      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            isEmailVerified: true,
            avatar: user.avatar || googleUser.picture,
          },
        });
      }
    } else {
      // New user — create account with default business
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: googleUser.email!,
            fullName: googleUser.name || googleUser.email!.split('@')[0],
            googleId: googleUser.sub,
            avatar: googleUser.picture,
            isEmailVerified: true,
          },
        });

        await tx.business.create({
          data: {
            userId: newUser.id,
            name: `${newUser.fullName}'s Business`,
            plan: SubscriptionPlan.FREE,
          },
        });

        return newUser;
      });
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    const userResponse = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        googleId: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return { user: userResponse, tokens };
  }

  /**
   * Verify Google ID token
   */
  private async verifyGoogleToken(idToken: Promise<string> | string): Promise<{
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  }> {
    try {
      const token = await idToken;
      const response = await axios.get(
        `${GOOGLE_TOKEN_INFO_URL}?id_token=${token}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new AppError('Invalid Google token. Please try again.', 401);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as ITokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, deletedAt: true },
      });

      if (!user || user.deletedAt) {
        throw new AppError('User not found or deactivated', 404);
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token expired. Please login again.', 401);
      }
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: ITokenPayload): IAuthTokens {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    });

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiry,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
