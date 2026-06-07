import axios from 'axios';
import { config } from '../config/index.js';
import { DiscordEmbed } from '../types/index.js';

/**
 * Send a notification to Discord via webhook
 */
export async function sendDiscordNotification(
  embed: DiscordEmbed
): Promise<boolean> {
  if (!config.discord.notificationsEnabled || !config.discord.webhookUrl) {
    return false;
  }

  try {
    await axios.post(config.discord.webhookUrl, {
      username: 'BillingBee',
      avatar_url: 'https://billingbee.com/logo.png',
      embeds: [
        {
          title: embed.title,
          description: embed.description,
          color: embed.color,
          fields: embed.fields || [],
          timestamp: embed.timestamp || new Date().toISOString(),
          footer: {
            text: 'BillingBee v2',
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('[Discord] Failed to send notification:', error);
    return false;
  }
}

/**
 * Send a new user signup notification
 */
export async function notifyNewUser(
  email: string,
  name: string
): Promise<void> {
  await sendDiscordNotification({
    title: '🎉 New User Signup',
    description: `A new user has joined BillingBee!`,
    color: 0x00ff00,
    fields: [
      { name: 'Name', value: name, inline: true },
      { name: 'Email', value: email, inline: true },
    ],
  });
}

/**
 * Send a new invoice notification
 */
export async function notifyNewInvoice(
  invoiceNumber: string,
  amount: number,
  clientName: string
): Promise<void> {
  await sendDiscordNotification({
    title: '📄 New Invoice Created',
    description: `Invoice **${invoiceNumber}** has been created`,
    color: 0x3498db,
    fields: [
      { name: 'Amount', value: `INR ${amount.toLocaleString('en-IN')}`, inline: true },
      { name: 'Client', value: clientName, inline: true },
    ],
  });
}

/**
 * Send a payment received notification
 */
export async function notifyPaymentReceived(
  invoiceNumber: string,
  amount: number,
  method: string
): Promise<void> {
  await sendDiscordNotification({
    title: '💰 Payment Received',
    description: `Payment received for invoice **${invoiceNumber}**`,
    color: 0x2ecc71,
    fields: [
      { name: 'Amount', value: `INR ${amount.toLocaleString('en-IN')}`, inline: true },
      { name: 'Method', value: method, inline: true },
    ],
  });
}

/**
 * Send a subscription change notification
 */
export async function notifySubscriptionChange(
  email: string,
  oldPlan: string,
  newPlan: string
): Promise<void> {
  await sendDiscordNotification({
    title: '⭐ Subscription Updated',
    description: `A user has changed their subscription plan`,
    color: 0xf1c40f,
    fields: [
      { name: 'Email', value: email, inline: true },
      { name: 'Plan Change', value: `${oldPlan} → ${newPlan}`, inline: true },
    ],
  });
}
