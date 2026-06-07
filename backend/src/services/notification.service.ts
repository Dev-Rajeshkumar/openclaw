import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface INotificationPayload {
  title: string;
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
}

export class NotificationService {
  private webhookUrl: string | null = null;
  private environment: string;

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || null;
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Send exception notification to Discord webhook
   */
  async sendException(error: Error, context?: Record<string, unknown>): Promise<void> {
    if (!this.webhookUrl || this.environment === 'test') {
      console.error('[EXCEPTION]', error.message, context);
      return;
    }

    const payload = this.formatExceptionPayload(error, context);

    try {
      await this.sendWebhook(payload);
    } catch (err) {
      // Don't let notification failures crash the app
      console.error('[NOTIFICATION] Failed to send Discord alert:', err);
      console.error('[EXCEPTION_FALLBACK]', error.message, context);
    }
  }

  /**
   * Send general notification
   */
  async send(payload: INotificationPayload): Promise<void> {
    if (!this.webhookUrl || this.environment === 'test') {
      console.log('[NOTIFICATION]', payload.title, payload.message);
      return;
    }

    const discordPayload = {
      embeds: [
        {
          title: `${this.getSeverityEmoji(payload.severity)} ${payload.title}`,
          description: payload.message,
          color: this.getSeverityColor(payload.severity),
          timestamp: payload.timestamp,
          footer: {
            text: `BillingBee • ${this.environment}`,
          },
          ...(payload.error && {
            fields: [
              { name: 'Error', value: `\`\`\`${payload.error.message}\`\`\``, inline: false },
              ...(payload.error.stack
                ? [
                    {
                      name: 'Stack',
                      value: `\`\`\`${payload.error.stack.substring(0, 500)}\`\`\``,
                      inline: false,
                    },
                  ]
                : []),
            ],
          }),
          ...(payload.context && {
            fields: Object.entries(payload.context).map(([key, value]) => ({
              name: key,
              value: String(value).substring(0, 200),
              inline: true,
            })),
          }),
        },
      ],
    };

    try {
      await this.sendWebhook(discordPayload);
    } catch (err) {
      console.error('[NOTIFICATION] Failed to send:', err);
    }
  }

  /**
   * Format exception into a notification payload
   */
  private formatExceptionPayload(
    error: Error,
    context?: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      embeds: [
        {
          title: '🚨 Exception Alert',
          description: `\`\`\`${error.message}\`\`\``,
          color: 0xff0000,
          timestamp: new Date().toISOString(),
          footer: {
            text: `BillingBee • ${this.environment}`,
          },
          fields: [
            ...(error.stack
              ? [
                  {
                    name: 'Stack Trace',
                    value: `\`\`\`${error.stack.substring(0, 1000)}\`\`\``,
                    inline: false,
                  },
                ]
              : []),
            ...(context
              ? Object.entries(context).map(([key, value]) => ({
                  name: key,
                  value: `\`${String(value).substring(0, 500)}\``,
                  inline: true,
                }))
              : []),
          ],
        },
      ],
    };
  }

  /**
   * Send JSON payload to webhook URL
   */
  private sendWebhook(payload: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl!);
      const data = JSON.stringify(payload);

      const options: https.RequestOptions = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Webhook returned ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Webhook request timed out'));
      });

      req.write(data);
      req.end();
    });
  }

  private getSeverityEmoji(severity: string): string {
    const map: Record<string, string> = { error: '🚨', warning: '⚠️', info: 'ℹ️' };
    return map[severity] || 'ℹ️';
  }

  private getSeverityColor(severity: string): number {
    const map: Record<string, number> = { error: 0xff0000, warning: 0xffa500, info: 0x00aaff };
    return map[severity] || 0x00aaff;
  }
}

export const notificationService = new NotificationService();
