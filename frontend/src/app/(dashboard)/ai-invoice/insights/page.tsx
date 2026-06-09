'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, TrendingUp, TrendingDown, Users, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Insight {
  type: 'revenue' | 'payment' | 'client' | 'warning' | 'opportunity';
  title: string;
  description: string;
  metric?: string;
  priority: 'high' | 'medium' | 'low';
}

interface Metrics {
  totalInvoices: number;
  currentMonth: number;
  previousMonth: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  overdueCount: number;
  totalClients: number;
  avgPaymentDays: number;
  topClients: { name: string; total: number }[];
}

export default function AIInsightsPage() {
  const router = useRouter();
  const { activeBusiness } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    api.get(`/ai/insights/${activeBusiness.id}`).then(({ data }) => {
      if (data.success && data.data) {
        setInsights((data.data as any).insights || []);
        setMetrics((data.data as any).metrics || null);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [activeBusiness?.id]);

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    revenue: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    payment: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    client: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    warning: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    opportunity: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
  };

  const priorityBadge: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={24} className="text-amber-500" /> AI Business Insights
          </h1>
          <p className="text-gray-500">Powered by your data</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400">Total Invoices</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalInvoices}</p>
              <p className="text-xs text-gray-500">{metrics.currentMonth} this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.currentMonthRevenue)}</p>
              <p className="text-xs text-gray-500">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400">Overdue</p>
              <p className="text-xl font-bold text-red-600">{metrics.overdueCount}</p>
              <p className="text-xs text-gray-500">invoices pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400">Avg Payment</p>
              <p className="text-xl font-bold text-gray-900">{metrics.avgPaymentDays}d</p>
              <p className="text-xs text-gray-500">{metrics.totalClients} clients</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      {loading ? (
        <Card><CardContent className="py-12 text-center"><Loader2 size={24} className="animate-spin text-amber-500 mx-auto" /></CardContent></Card>
      ) : insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.type] || typeConfig.opportunity;
            const Icon = config.icon;
            return (
              <Card key={i} className="border-l-4" style={{ borderLeftColor: insight.type === 'warning' ? '#ef4444' : insight.type === 'revenue' ? '#22c55e' : insight.type === 'client' ? '#8b5cf6' : '#f59e0b' }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900">{insight.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityBadge[insight.priority]}`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{insight.description}</p>
                      {insight.metric && (
                        <p className={`text-sm font-semibold mt-1 ${config.color}`}>{insight.metric}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Not enough data for insights yet. Create more invoices!</p>
          </CardContent>
        </Card>
      )}

      {/* Top Clients */}
      {metrics && metrics.topClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users size={16} /> Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topClients.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-5">{i + 1}.</span>
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
