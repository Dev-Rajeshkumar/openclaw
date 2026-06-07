import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { UpdateProfileInput, ChangePasswordInput, UpdatePlanInput } from '../validators/user.validator.js';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        businessName: true,
        gstNumber: true,
        phone: true,
        address: true,
        plan: true,
        invoiceCount: true,
        clientCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
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
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Update subscription plan
   */
  async updatePlan(userId: string, input: UpdatePlanInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan: input.plan },
      select: {
        id: true,
        email: true,
        fullName: true,
        plan: true,
        updatedAt: true,
      },
    });

    return user;
  }
}

export const userService = new UserService();
