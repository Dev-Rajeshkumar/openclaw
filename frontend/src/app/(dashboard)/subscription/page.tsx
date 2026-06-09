'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Crown, Check, X, CreditCard, AlertTriangle, RefreshCw,
  FileText, Users, Building2, Zap, ArrowRight, Loader2,
  Calendar, Shield, Star, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionPlan, IInvoice, IClient, IBusiness } from '@/types';
import { getPlanColor } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ─── Plan definitions ─────────────────────────────────────
interface PlanDef {
  name: SubscriptionPlan;
  price: number;
  invoices: string;
  clients: string;
  templates: string;
  businesses: string;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanDef[] = [
  {
    name: SubscriptionPlan.Free,
    price: 0,
    invoices: '10',
    clients: '5',
    templates: '3',
    businesses: '1',
    features: ['GST PDF invoices', 'Basic templates', 'Email invoices'],
  },
  {
    name: SubscriptionPlan.Starter,
    price: 299,
    invoices: '50',
    clients: '25',
    templates: '6',
    businesses: '1',
    features: ['Everything in Free', 'Custom invoice numbers', 'Analytics dashboard', '6 invoice templates'],
  },
  {
    name: SubscriptionPlan.Professional,
    price: 799,
    invoices: '200',
    clients: '100',
    templates: '12',
    businesses: '3',
    features: ['Everything in Starter', 'No BillingBee branding', 'Priority support', 'API access', '3 businesses', 'Custom templates'],
    popular: true,
  },
  {
    name: SubscriptionPlan.Business,
    price: 2499,
    invoices: 'Unlimited',
    clients: 'Unlimited',
    templates: '22',
    businesses: '10',
    features: ['Everything in Professional', 'Dedicated support', 'Custom integrations', 'Team roles & permissions', '10 businesses', 'All premium templates'],
  },
];

// ─── Subscription API response ────────────────────────────
interface ISubscription {
  id: string;
  businessId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Usage stats ──────────────────────────────────────────
interface UsageStats {
  invoicesThisMonth: number;
  totalClients: number;
  totalBusinesses: number;
}

export default function SubscriptionPage() {
  const { activeBusiness, fetchBusinesses, user } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<ISubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentPlanName = activeBusiness?.plan || SubscriptionPlan.Free;
  const currentPlanDef = PLANS.find((p) => p.name === currentPlanName) || PLANS[0];

  // ─── Data fetching ────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      // Fetch subscription
      try {
        const { data: subRes } = await api.get('/v1/subscriptions');
        if (subRes.success && subRes.data) {
          setSubscription(subRes.data as ISubscription);
        }
      } catch {
        // No subscription yet — that's fine
      }

      // Fetch invoices for usage count and billing history
      try {
        const { data: invRes } = await api.get('/invoices?limit=5&page=1');
        if (invRes.success && invRes.data) {
          const invoices = invRes.data as IInvoice[];
          setRecentInvoices(invoices);
          // Count this month's invoices
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonth = invoices.filter((inv) => new Date(inv.createdAt) >= startOfMonth).length;
          setUsage((prev) => ({ ...prev, invoicesThisMonth: thisMonth }));
        }
      } catch { /* ignore */ }

      // Fetch clients count
      try {
        const { data: cliRes } = await api.get('/clients?limit=1&page=1');
        if (cliRes.success && cliRes.meta) {
          setUsage((prev) => ({ ...prev, totalClients: cliRes.meta.total }));
        }
      } catch { /* ignore */ }

      // Businesses count from auth
      try {
        const { data: bizRes } = await api.get('/businesses');
        if (bizRes.success && bizRes.data) {
          setUsage((prev) => ({ ...prev, totalBusinesses: (bizRes.data as IBusiness[]).length }));
        }
      } catch { /* ignore */ }

    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Actions ──────────────────────────────────────────
  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!activeBusiness) return;
    setActionLoading(plan);
    try {
      await api.put('/v1/subscriptions', { plan });
      toast.success(`Subscription changed to ${plan}!`);
      await fetchBusinesses();
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change plan';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await api.post('/v1/subscriptions/cancel');
      toast.success('Subscription cancelled. You can renew anytime.');
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel';
      toast.error(message);
    } finally {
      setActionLoading(null);
      setShowCancelConfirm(false);
    }
  };

  const handleRenew = async () => {
    setActionLoading('renew');
    try {
      await api.post('/v1/subscriptions/renew');
      toast.success('Subscription renewed!');
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to renew';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const isCancelled = subscription?.status === 'cancelled';
  const isActive = subscription?.status === 'active' || (!subscription && currentPlanName === SubscriptionPlan.Free);

  // ─── Usage bar component ──────────────────────────────
  function UsageBar({ label, current, max, icon: Icon }: { label: string; current: number; max: number; icon: React.ElementType }) {
    const pct = Math.min((current / max) * 100, 100);
    const isNearLimit = pct >= 80;
    const isAtLimit = pct >= 100;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Icon size={15} className="text-gray-400" />
            <span>{label}</span>
          </div>
          <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
            {current} / {max === Infinity ? '∞' : max}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-amber-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Crown className="text-amber-500" size={24} />
          Subscription
        </h1>
        <p className="text-gray-500 mt-1">Manage your plan, usage, and billing</p>
      </div>

      {/* ─── Current Plan + Usage ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <Card className={isCancelled ? 'border-red-200' : 'border-amber-200'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield size={18} className="text-amber-500" />
                Current Plan
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getPlanColor(currentPlanName)}>{currentPlanName}</Badge>
                {isCancelled && (
                  <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{currentPlanDef.price}
                <span className="text-base font-normal text-gray-400">/mo</span>
              </div>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar size={14} />
                  {isCancelled
                    ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}`
                    : `Next billing: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}`
                  }
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Included features</p>
              <ul className="space-y-1.5">
                {currentPlanDef.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              {isCancelled ? (
                <Button onClick={handleRenew} disabled={actionLoading !== null} className="bg-amber-500 hover:bg-amber-600">
                  {actionLoading === 'renew' ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                  Renew Subscription
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowCancelConfirm(true)} disabled={actionLoading !== null} className="text-red-600 border-red-200 hover:bg-red-50">
                  Cancel Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Usage This Month
            </CardTitle>
            <CardDescription>Your resource usage for the current billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              label="Invoices Created"
              current={usage?.invoicesThisMonth ?? 0}
              max={currentPlanDef.invoices === 'Unlimited' ? Infinity : parseInt(currentPlanDef.invoices)}
              icon={FileText}
            />
            <UsageBar
              label="Clients"
              current={usage?.totalClients ?? 0}
              max={currentPlanDef.clients === 'Unlimited' ? Infinity : parseInt(currentPlanDef.clients)}
              icon={Users}
            />
            <UsageBar
              label="Businesses"
              current={usage?.totalBusinesses ?? 0}
              max={currentPlanDef.businesses === 'Unlimited' ? Infinity : parseInt(currentPlanDef.businesses)}
              icon={Building2}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── Cancel Confirmation Modal ────────────────────── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                Cancel Subscription?
              </CardTitle>
              <CardDescription>
                Are you sure you want to cancel? You&apos;ll lose access to premium features at the end of your current billing period.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={actionLoading !== null}>
                Keep Plan
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={actionLoading !== null}>
                {actionLoading === 'cancel' ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Yes, Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* ─── Plan Comparison ──────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compare Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanName === plan.name;
            const isDowngrade = PLANS.findIndex((p) => p.name === currentPlanName) > PLANS.findIndex((p) => p.name === plan.name);

            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  isCurrent
                    ? 'border-amber-400 shadow-lg shadow-amber-100 ring-1 ring-amber-200'
                    : plan.popular
                    ? 'border-purple-200 shadow-md'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white text-xs px-3 py-0.5 flex items-center gap-1">
                      <Star size={10} className="fill-white" /> Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-3">
                    <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">Current</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-gray-400">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invoices</span>
                      <span className="font-medium">{plan.invoices}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Clients</span>
                      <span className="font-medium">{plan.clients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Templates</span>
                      <span className="font-medium">{plan.templates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Businesses</span>
                      <span className="font-medium">{plan.businesses}</span>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <Check size={12} className="text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isDowngrade ? 'outline' : 'default'}
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === plan.name ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Feature Comparison Table ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>See what&apos;s included in each plan</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.name} className="text-center py-3 px-2 font-medium text-gray-900">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Invoices per month', values: ['10', '50', '200', 'Unlimited'] },
                { feature: 'Clients', values: ['5', '25', '100', 'Unlimited'] },
                { feature: 'Invoice templates', values: ['3', '6', '12', '22'] },
                { feature: 'Businesses', values: ['1', '1', '3', '10'] },
                { feature: 'GST-compliant PDF', values: [true, true, true, true] },
                { feature: 'Email invoices', values: [true, true, true, true] },
                { feature: 'Custom invoice numbers', values: [false, true, true, true] },
                { feature: 'Analytics dashboard', values: [false, true, true, true] },
                { feature: 'Remove BillingBee branding', values: [false, false, true, true] },
                { feature: 'Priority support', values: [false, false, true, true] },
                { feature: 'API access', values: [false, false, true, true] },
                { feature: 'Custom templates', values: [false, false, true, true] },
                { feature: 'Team roles', values: [false, false, false, true] },
                { feature: 'Custom integrations', values: [false, false, false, true] },
                { feature: 'Dedicated support', values: [false, false, false, true] },
              ].map((row) => (
                <tr key={row.feature} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-2 text-gray-700">{row.feature}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className="text-center py-2.5 px-2">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <Check size={16} className="text-green-500 mx-auto" />
                        ) : (
                          <X size={16} className="text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-900 font-medium">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ─── Recent Invoices (Billing History) ────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} className="text-amber-500" />
              Recent Invoices
            </CardTitle>
            <CardDescription>Your latest invoice activity</CardDescription>
          </div>
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
              View All <ChevronRight size={14} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-400">
                        {inv.client?.name || 'No client'} • {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">₹{inv.total.toLocaleString('en-IN')}</p>
                    <Badge className={`text-xs ${inv.status === 'Paid' ? 'bg-green-50 text-green-700' : inv.status === 'Overdue' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
