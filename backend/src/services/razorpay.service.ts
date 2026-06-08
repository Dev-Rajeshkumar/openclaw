import crypto from 'crypto';
import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

interface RazorpayOrderOptions {
  amount: number; // in rupees
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  email: string;
  contact: string;
  notes: Record<string, string>;
  created_at: number;
}

function getAuthHeader(keyId: string, keySecret: string): string {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return `Basic ${token}`;
}

async function razorpayRequest(
  method: 'GET' | 'POST',
  endpoint: string,
  keyId: string,
  keySecret: string,
  body?: any
): Promise<any> {
  const url = `${RAZORPAY_API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': getAuthHeader(keyId, keySecret),
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AppError(
      (error as any)?.error?.description || `Razorpay API error: ${response.status}`,
      response.status
    );
  }
  return response.json();
}

export async function createRazorpayOrder(
  businessId: string,
  options: RazorpayOrderOptions
): Promise<RazorpayOrder> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });

  if (!business || !business.razorpayKeyId || !business.razorpayKeySecret) {
    throw new AppError('Razorpay not configured for this business. Add your API keys in Settings.', 400);
  }

  // Razorpay expects amount in paise
  const amountInPaise = Math.round(options.amount * 100);

  const order = await razorpayRequest(
    'POST',
    '/orders',
    business.razorpayKeyId,
    business.razorpayKeySecret,
    {
      amount: amountInPaise,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes || {},
      payment_capture: 1, // auto-capture
    }
  ) as RazorpayOrder;

  return order;
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

export async function verifyPayment(
  businessId: string,
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });

  if (!business || !business.razorpayKeySecret) {
    throw new AppError('Razorpay not configured', 400);
  }

  const isValid = verifyRazorpaySignature(
    orderId,
    paymentId,
    signature,
    business.razorpayKeySecret
  );

  if (!isValid) {
    throw new AppError('Invalid payment signature', 400);
  }

  return true;
}

export async function fetchRazorpayPayment(
  businessId: string,
  paymentId: string
): Promise<RazorpayPayment> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });

  if (!business || !business.razorpayKeyId || !business.razorpayKeySecret) {
    throw new AppError('Razorpay not configured', 400);
  }

  const payment = await razorpayRequest(
    'GET',
    `/payments/${paymentId}`,
    business.razorpayKeyId,
    business.razorpayKeySecret
  ) as RazorpayPayment;

  return payment;
}
