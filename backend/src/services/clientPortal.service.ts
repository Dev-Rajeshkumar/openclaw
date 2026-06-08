/**
 * Client Portal authentication via magic links.
 * No password needed — client enters email, gets a link, clicks to log in.
 * Uses JWT for session management.
 */

import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const MAGIC_TOKEN_EXPIRY_MINUTES = 30;

export async function sendClientMagicLink(email: string) {
  // Find client by email
  const client = await prisma.client.findFirst({
    where: { email, deletedAt: null },
    include: { business: { select: { id: true, name: true } } },
  });

  if (!client) {
    // Don't reveal whether the email exists
    return { message: 'If an account exists, a login link has been sent.' };
  }

  // Generate a random token
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Store magic token on client record
  await prisma.client.update({
    where: { id: client.id },
    data: {
      magicToken: token,
      magicTokenExpires: expiresAt,
    } as any,
  });

  // Build magic link
  const portalUrl = process.env.CLIENT_PORTAL_URL || 'https://billingbee.app/portal';
  const magicLink = `${portalUrl}/auth?token=${token}`;

  // Send email
  const { sendEmail } = await import('../utils/email.js');
  await sendEmail({
    to: email,
    subject: `Login to ${client.business?.name || 'BillingBee'} Client Portal`,
    text: `Click this link to log in to the client portal: ${magicLink}\n\nThis link expires in ${MAGIC_TOKEN_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #1a1a2e;">Client Portal Login</h2>
        <p>Hello ${client.name},</p>
        <p>Click the button below to log in to your client portal. This link expires in ${MAGIC_TOKEN_EXPIRY_MINUTES} minutes.</p>
        <a href="${magicLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Login to Portal</a>
        <p style="font-size: 12px; color: #9ca3af;">Or copy this link: ${magicLink}</p>
        <p style="font-size: 12px; color: #9ca3af;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { message: 'Login link sent to your email.' };
}

export async function verifyClientMagicLink(token: string) {
  const client = await prisma.client.findFirst({
    where: {
      magicToken: token,
      deletedAt: null,
    } as any,
    include: { business: { select: { id: true, name: true } } },
  });

  if (!client) {
    throw new AppError('Invalid or expired login link', 401);
  }

  // Check expiry
  if ((client as any).magicTokenExpires && new Date((client as any).magicTokenExpires) < new Date()) {
    throw new AppError('Login link expired. Please request a new one.', 401);
  }

  // Clear magic token
  await prisma.client.update({
    where: { id: client.id },
    data: { magicToken: null, magicTokenExpires: null } as any,
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: client.id, businessId: client.businessId, role: 'client' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token: token,
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      businessId: client.businessId,
      businessName: client.business?.name,
    },
  };
}
