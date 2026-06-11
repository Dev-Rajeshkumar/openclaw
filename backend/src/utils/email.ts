import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const result = await getTransporter().sendMail(mailOptions);
    console.log(`[Email] Sent to ${options.to}: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${options.to}:`, error);
    return false;
  }
}

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  businessName: string,
  amount: number,
  dueDate: string,
  pdfBuffer?: Buffer
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3748;">Invoice from ${businessName}</h2>
      <p>Dear Customer,</p>
      <p>Please find the details of your invoice below:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Amount</strong></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Due Date</strong></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${dueDate}</td>
        </tr>
      </table>
      <p>Please make the payment by the due date to avoid any late fees.</p>
      <p>Thank you for your business!</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #718096; font-size: 12px;">
        This is an automated email from BillingBee. Please do not reply to this email.
      </p>
    </div>
  `;

  const attachments = pdfBuffer
    ? [{ filename: `Invoice-${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : undefined;

  return sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html,
    attachments,
  });
}

export async function sendPaymentReceiptEmail(
  to: string,
  invoiceNumber: string,
  amount: number,
  paymentMethod: string,
  businessName: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3748;">Payment Receipt from ${businessName}</h2>
      <p>Dear Customer,</p>
      <p>We have received your payment. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Amount Paid</strong></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Payment Method</strong></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${paymentMethod}</td>
        </tr>
      </table>
      <p>Thank you for your payment!</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #718096; font-size: 12px;">
        This is an automated email from BillingBee.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Payment Receipt - Invoice ${invoiceNumber}`,
    html,
  });
}

export async function sendInvitationEmail(
  to: string,
  businessName: string,
  inviterName: string,
  role: string,
  inviteLink: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3748;">You've been invited to ${businessName}</h2>
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> on BillingBee as a <strong>${role}</strong>.</p>
      <p>Click the button below to accept the invitation:</p>
      <a href="${inviteLink}" style="display: inline-block; background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Accept Invitation
      </a>
      <p style="color: #718096; font-size: 12px;">This link will expire in 7 days.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #718096; font-size: 12px;">
        This is an automated email from BillingBee.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Invitation to join ${businessName} on BillingBee`,
    html,
  });
}

/** Build invoice email HTML (exported for use with email queue). */
export function buildInvoiceEmailHTML(invoice: {
  invoiceNumber: string;
  business?: { name: string } | null;
  total: number;
  dueDate?: Date | string | null;
}): string {
  const businessName = invoice.business?.name || 'BillingBee';
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A';
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3748;">Invoice from ${businessName}</h2>
      <p>Dear Customer,</p>
      <p>Please find the details of your invoice below:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">${invoice.invoiceNumber}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Amount</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">INR ${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">${dueDate}</td></tr>
      </table>
      <p>Please make the payment by the due date to avoid any late fees.</p>
      <p>Thank you for your business!</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #718096; font-size: 12px;">This is an automated email from BillingBee. Please do not reply to this email.</p>
    </div>`;
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return false;
  }
}
