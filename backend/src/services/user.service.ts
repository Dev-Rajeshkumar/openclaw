import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/user.validator.js';

const prisma = new PrismaClient();

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    if (!user || user.deletedAt) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        googleId: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (!user.password) {
      throw new AppError('This account uses Google Sign-In. Set a password first.', 400);
    }

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isPasswordValid) throw new AppError('Current password is incorrect', 401);

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    return { message: 'Password changed successfully' };
  }
}

export const userService = new UserService();
