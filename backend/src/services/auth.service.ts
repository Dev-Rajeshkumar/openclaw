import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { IAuthTokens, ITokenPayload, SubscriptionPlan } from '../types/index.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    const { email, password, fullName, businessName, phone } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        businessName: businessName || null,
        phone: phone || null,
        plan: SubscriptionPlan.FREE,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        businessName: true,
        gstNumber: true,
        phone: true,
        address: true,
        plan: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      plan: user.plan as SubscriptionPlan,
    });

    return { user, tokens };
  }

  /**
   * Login user
   */
  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      plan: user.plan as SubscriptionPlan,
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      gstNumber: user.gstNumber,
      phone: user.phone,
      address: user.address,
      plan: user.plan,
      createdAt: user.createdAt,
    };

    return { user: userResponse, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as ITokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, plan: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        plan: user.plan as SubscriptionPlan,
      });

      return tokens;
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
