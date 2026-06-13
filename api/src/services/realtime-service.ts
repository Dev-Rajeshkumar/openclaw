/**
 * Real-Time Analytics Service
 *
 * WebSocket-based live analytics feed.
 * Broadcasts events to connected admin dashboard clients.
 *
 * Events: page_view, comment, reaction, share, subscriber, newsletter
 */

import { Server as WebSocketServer, Socket } from 'socket.io';
import prisma from '../lib/prisma';

interface RealtimeEvent {
  type: 'page_view' | 'comment' | 'reaction' | 'share' | 'subscriber' | 'newsletter' | 'user_registered';
  timestamp: string;
  data: Record<string, any>;
}

interface DashboardStats {
  activeVisitors: number;
  viewsLastMinute: number;
  commentsLastHour: number;
  reactionsLastHour: number;
  topActivePosts: { id: string; title: string; views: number }[];
}

class RealtimeService {
  private io: WebSocketServer | null = null;
  private connectedAdmins: Set<string> = new Set();
  private recentEvents: RealtimeEvent[] = [];
  private readonly MAX_RECENT_EVENTS = 100;

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    this.io = new WebSocketServer(server, {
      path: '/ws/analytics',
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use(async (socket: Socket, next: any) => {
      // Authenticate admin connections
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        // Verify JWT token
        const { verify } = require('jsonwebtoken');
        const decoded = verify(token, process.env.JWT_SECRET || 'change-me');
        if (!decoded || !['admin', 'editor'].includes(decoded.role?.type)) {
          return next(new Error('Admin access required'));
        }
        socket.data.user = decoded;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.user?.id;
      this.connectedAdmins.add(userId);

      console.log(`[Realtime] Admin connected: ${userId} (total: ${this.connectedAdmins.size})`);

      // Send recent events on connect
      socket.emit('recent_events', this.recentEvents);

      // Send current stats
      this.getDashboardStats().then(stats => {
        socket.emit('dashboard_stats', stats);
      });

      socket.on('disconnect', () => {
        this.connectedAdmins.delete(userId);
        console.log(`[Realtime] Admin disconnected: ${userId} (total: ${this.connectedAdmins.size})`);
      });
    });

    console.log('[Realtime] WebSocket analytics server initialized');
  }

  /**
   * Broadcast an event to all connected admin dashboards
   */
  broadcast(event: RealtimeEvent) {
    // Store in recent events buffer
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.MAX_RECENT_EVENTS) {
      this.recentEvents = this.recentEvents.slice(0, this.MAX_RECENT_EVENTS);
    }

    // Broadcast to connected admins
    if (this.io) {
      this.io.emit('event', event);
    }
  }

  /**
   * Track a page view and broadcast
   */
  trackPageView(postId: string, postTitle: string, visitorId?: string) {
    this.broadcast({
      type: 'page_view',
      timestamp: new Date().toISOString(),
      data: { postId, postTitle, visitorId },
    });
  }

  /**
   * Track a comment and broadcast
   */
  trackComment(postId: string, postTitle: string, authorName: string, commentId: string) {
    this.broadcast({
      type: 'comment',
      timestamp: new Date().toISOString(),
      data: { postId, postTitle, authorName, commentId },
    });
  }

  /**
   * Track a reaction and broadcast
   */
  trackReaction(postId: string, type: string, userId: string) {
    this.broadcast({
      type: 'reaction',
      timestamp: new Date().toISOString(),
      data: { postId, reactionType: type, userId },
    });
  }

  /**
   * Track a share and broadcast
   */
  trackShare(postId: string, platform: string) {
    this.broadcast({
      type: 'share',
      timestamp: new Date().toISOString(),
      data: { postId, platform },
    });
  }

  /**
   * Track a new subscriber and broadcast
   */
  trackSubscriber(email: string) {
    this.broadcast({
      type: 'subscriber',
      timestamp: new Date().toISOString(),
      data: { email },
    });
  }

  /**
   * Get current dashboard stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [viewsLastMinute, commentsLastHour, reactionsLastHour, topActivePosts] = await Promise.all([
      prisma.pageView.count({ where: { viewedAt: { gte: oneMinuteAgo } } }),
      prisma.comment.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.reaction.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.post.findMany({
        where: { status: 'published' },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, title: true, viewCount: true },
      }),
    ]);

    // Estimate active visitors (unique IPs in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeVisitors = await prisma.pageView.groupBy({
      by: ['ipAddress'],
      where: { viewedAt: { gte: fiveMinutesAgo } },
    }).then(rows => rows.length);

    return {
      activeVisitors,
      viewsLastMinute,
      commentsLastHour,
      reactionsLastHour,
      topActivePosts,
    };
  }

  /**
   * Get connected admin count
   */
  getConnectedAdminCount(): number {
    return this.connectedAdmins.size;
  }
}

// Singleton
let instance: RealtimeService | null = null;

export function getRealtimeService(): RealtimeService {
  if (!instance) instance = new RealtimeService();
  return instance;
}

export default RealtimeService;
