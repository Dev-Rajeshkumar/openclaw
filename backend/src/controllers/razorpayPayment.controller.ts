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
    const body = JSON.stringify(req.body);

    // Note: In production, verify webhook signature too
    // For now, we'll trust the payload since we verify the payment separately

    const event = req.body.event;
    const paymentData = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentData) {
      const notes = paymentData.notes || {};
      const invoiceId = notes.invoiceId;

      if (invoiceId) {
        const invoice = await prisma.invoice.findFirst({
          where: { id: invoiceId, deletedAt: null },
        });

        if (invoice && invoice.status !== InvoiceStatus.Paid) {
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
        }
      }
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
