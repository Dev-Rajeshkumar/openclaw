import crypto from 'crypto';
import { Response, NextFunction, Request } from 'express';
import prisma from '../prisma/index.js';
import * as razorpayService from '../services/razorpay.service.js';
import { AppError, ApiResponse } from '../utils/response.js';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '../types/index.js';

// Create a Razorpay order for an invoice
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { publicAccessToken: token, deletedAt: null },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status === InvoiceStatus.Paid) {
      throw new AppError('Invoice already paid', 400);
    }

    const order = await razorpayService.createRazorpayOrder(
      invoice.businessId,
      {
        amount: invoice.total,
        currency: 'INR',
        receipt: invoice.invoiceNumber,
        notes: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      }
    );

    res.json(ApiResponse.success({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: (await prisma.business.findFirst({ where: { id: invoice.businessId } }))?.razorpayKeyId,
    }));
  } catch (error) {
    next(error);
  }
};

// Verify payment after Razorpay callback
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Missing payment details', 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: { publicAccessToken: token, deletedAt: null },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Verify signature
    await razorpayService.verifyPayment(
      invoice.businessId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    // Fetch payment details from Razorpay
    const payment = await razorpayService.fetchRazorpayPayment(
      invoice.businessId,
      razorpay_payment_id
    );

    // Record payment and update invoice
    const result = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          userId: invoice.userId,
          amount: payment.amount / 100, // Convert paise to rupees
          method: PaymentMethod.Online,
          reference: payment.id,
          status: PaymentStatus.Completed,
          paidAt: new Date(),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      });

      // Update invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.Paid,
          viewCount: invoice.viewCount, // keep existing
        },
      });

      return { payment: newPayment, invoice: updatedInvoice };
    });

    res.json(ApiResponse.success(result, 'Payment successful'));
  } catch (error) {
    next(error);
  }
};

// Razorpay webhook handler
export const webhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      throw new AppError('Missing webhook signature', 401);
    }

    // Verify webhook signature against all businesses with Razorpay configured
    // We need to find the business by matching the order/payment
    const event = req.body.event;
    const paymentData = req.body.payload?.payment?.entity;

    if (!paymentData) {
      res.json({ status: 'ok' });
      return;
    }

    // Find the business that owns this order by looking up the invoice
    const notes = paymentData.notes || {};
    const invoiceId = notes.invoiceId;

    if (!invoiceId) {
      // Can't verify without invoice context — still return 200 so Razorpay doesn't retry
      console.warn('[Webhook] No invoiceId in payment notes, skipping');
      res.json({ status: 'ok' });
      return;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
    });

    if (!invoice) {
      console.warn(`[Webhook] Invoice ${invoiceId} not found, skipping`);
      res.json({ status: 'ok' });
      return;
    }

    // Get the business and verify the webhook signature
    const business = await prisma.business.findFirst({
      where: { id: invoice.businessId, deletedAt: null },
    });

    if (!business?.razorpayKeySecret) {
      console.warn('[Webhook] Business or Razorpay secret not found');
      res.json({ status: 'ok' });
      return;
    }

    // Verify webhook signature using Razorpay's method
    // The raw body is available as a Buffer from express.raw() middleware
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      throw new AppError('Invalid webhook payload', 400);
    }

    // Re-attach parsed body so downstream code works
    req.body = parsedBody;
    const body = rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', business.razorpayKeySecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Webhook] Invalid signature — possible spoofing attempt');
      throw new AppError('Invalid webhook signature', 401);
    }

    console.log(`[Webhook] Verified signature for event: ${event}`);

    if (event === 'payment.captured' && invoice.status !== InvoiceStatus.Paid) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            userId: invoice.userId,
            amount: paymentData.amount / 100,
            method: PaymentMethod.Online,
            reference: paymentData.id,
            status: PaymentStatus.Completed,
            paidAt: new Date(),
            razorpayOrderId: paymentData.order_id,
            razorpayPaymentId: paymentData.id,
          },
        });

        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.Paid },
        });
      });

      console.log(`[Webhook] Invoice ${invoice.invoiceNumber} marked as Paid`);
    } else if (event === 'payment.failed') {
      console.log(`[Webhook] Payment failed for invoice ${invoice.invoiceNumber}`);
      // Could notify the user here
    }

    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

// Update Razorpay settings (authenticated)
export const updateSettings = async (
  req: { user: { userId: string }; params: { businessId: string }; body: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.userId;
    const { businessId } = req.params;
    const { razorpayKeyId, razorpayKeySecret, razorpayEnabled } = req.body;

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId, deletedAt: null },
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        razorpayKeyId: razorpayKeyId || business.razorpayKeyId,
        razorpayKeySecret: razorpayKeySecret || business.razorpayKeySecret,
        razorpayEnabled: razorpayEnabled ?? business.razorpayEnabled,
      },
    });

    // Don't return the secret key
    const safe = { ...updated, razorpayKeySecret: undefined };

    res.json(ApiResponse.success(safe, 'Razorpay settings updated'));
  } catch (error) {
    next(error);
  }
};
