import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const service = new AnalyticsService();
    const dashboard = await service.getDashboard({
      dateFrom: from ? new Date(from) : undefined,
      dateTo: to ? new Date(to) : undefined,
    });

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, eventType, visitorId, userAgent, referrer, data } = body;

    switch (eventType) {
      case 'view':
        await prisma.pageView.create({
          data: {
            postId,
            visitorId: visitorId || null,
            ipAddress: '0.0.0.0', // Set by middleware in production
            userAgent: userAgent || null,
            referrer: referrer || null,
          },
        });
        break;

      case 'scroll':
        await prisma.scrollEvent.create({
          data: {
            postId,
            depth: data?.depth || 0,
            timeToReach: data?.timeToReach || 0,
            visitorId: visitorId || null,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
