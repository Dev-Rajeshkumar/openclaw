'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2, User, Lock, Building2, Crown, FileText, Mail, Palette, Star, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, ProfileFormData, changePasswordSchema, ChangePasswordFormData } from '@/lib/validations';
import { IUser, IBusiness, SubscriptionPlan, CurrencyCode, IInvoiceTemplate } from '@/types';
import { getPlanColor, CURRENCY_SYMBOLS } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TEMPLATE_PREVIEWS: { slug: string; name: string; colors: string[]; premium: boolean; tier?: string }[] = [
  { slug: 'classic', name: 'Classic', colors: ['#1a1a2e', '#e94560'], premium: false },
  { slug: 'modern', name: 'Modern', colors: ['#6366f1', '#818cf8'], premium: false },
  { slug: 'minimal', name: 'Minimal', colors: ['#111827', '#6b7280'], premium: false },
  { slug: 'professional', name: 'Professional', colors: ['#0f172a', '#0ea5e9'], premium: true, tier: 'starter' },
  { slug: 'elegant', name: 'Elegant', colors: ['#7c3aed', '#a78bfa'], premium: true, tier: 'starter' },
  { slug: 'bold', name: 'Bold', colors: ['#000000', '#f59e0b'], premium: true, tier: 'starter' },
  { slug: 'gradient-blue', name: 'Gradient Blue', colors: ['#2563eb', '#3b82f6'], premium: true, tier: 'professional' },
  { slug: 'forest-green', name: 'Forest Green', colors: ['#166534', '#22c55e'], premium: true, tier: 'professional' },
  { slug: 'sunset-orange', name: 'Sunset Orange', colors: ['#ea580c', '#fb923c'], premium: true, tier: 'professional' },
  { slug: 'rose-gold', name: 'Rose Gold', colors: ['#9f1239', '#fb7185'], premium: true, tier: 'professional' },
  { slug: 'tech-cyan', name: 'Tech Cyan', colors: ['#0e7490', '#22d3ee'], premium: true, tier: 'professional' },
  { slug: 'arctic-white', name: 'Arctic White', colors: ['#1e40af', '#93c5fd'], premium: true, tier: 'professional' },
  { slug: 'midnight-purple', name: 'Midnight Purple', colors: ['#3b0764', '#d97706'], premium: true, tier: 'business' },
  { slug: 'coral-reef', name: 'Coral Reef', colors: ['#0d9488', '#f472b6'], premium: true, tier: 'business' },
  { slug: 'slate-pro', name: 'Slate Pro', colors: ['#334155', '#475569'], premium: true, tier: 'business' },
  { slug: 'espresso', name: 'Espresso', colors: ['#78350f', '#d97706'], premium: true, tier: 'business' },
  { slug: 'neon-edge', name: 'Neon Edge', colors: ['#18181b', '#a3e635'], premium: true, tier: 'business' },
  { slug: 'ocean-breeze', name: 'Ocean Breeze', colors: ['#0369a1', '#67e8f9'], premium: true, tier: 'business' },
  { slug: 'cherry-blossom', name: 'Cherry Blossom', colors: ['#be185d', '#fda4af'], premium: true, tier: 'business' },
  { slug: 'gunmetal', name: 'Gunmetal', colors: ['#1c1917', '#b45309'], premium: true, tier: 'business' },
  { slug: 'lavender-dreams', name: 'Lavender Dreams', colors: ['#6d28d9', '#c4b5fd'], premium: true, tier: 'business' },
  { slug: 'monochrome', name: 'Monochrome', colors: ['#000000', '#525252'], premium: true, tier: 'business' },
];

export default function SettingsPage() {
  const { user, updateUser, businesses, activeBusiness, setActiveBusiness, fetchBusinesses } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('classic');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName || '', avatar: user?.avatar || '' },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const businessForm = useForm({
    defaultValues: {
      name: activeBusiness?.name || '',
      gstNumber: activeBusiness?.gstNumber || '',
      phone: activeBusiness?.phone || '',
      address: activeBusiness?.address || '',
      invoicePrefix: activeBusiness?.invoicePrefix || 'INV',
    },
  });

  useEffect(() => {
    if (activeBusiness) {
      businessForm.reset({
        name: activeBusiness.name || '',
        gstNumber: activeBusiness.gstNumber || '',
        phone: activeBusiness.phone || '',
        address: activeBusiness.address || '',
        invoicePrefix: activeBusiness.invoicePrefix || 'INV',
      });
    }
  }, [activeBusiness, businessForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const { data: r } = await api.put('/users/profile', data);
      if (r.success && r.data) { updateUser(r.data as Partial<IUser>); toast.success('Profile updated'); }
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setSaving(false); }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setSaving(true);
    try {
      await api.put('/users/password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed');
      passwordForm.reset();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setSaving(false); }
  };

  const onBusinessSubmit = async (data: any) => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      await api.put(`/businesses/${activeBusiness.id}`, data);
      toast.success('Business updated');
      await fetchBusinesses();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleAddBusiness = async () => {
    if (!newBusinessName.trim()) return;
    setSaving(true);
    try {
      await api.post('/businesses', { name: newBusinessName.trim() });
      toast.success('Business created');
      setNewBusinessName('');
      setShowAddBusiness(false);
      await fetchBusinesses();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setSaving(false); }
  };

  const handlePlanChange = async (plan: SubscriptionPlan) => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      await api.put(`/businesses/${activeBusiness.id}/plan`, { plan });
      toast.success(`Plan changed to ${plan}`);
      await fetchBusinesses();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleSetDefaultTemplate = async (slug: string) => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      await api.post(`/businesses/${activeBusiness.id}/invoice-templates/default`, { slug });
      setDefaultTemplate(slug);
      toast.success(`Default template set to ${slug}`);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setSaving(false); }
  };

  const isPremiumTemplate = (slug: string) => {
    const t = TEMPLATE_PREVIEWS.find((p) => p.slug === slug);
    if (!t || !t.premium) return false;
    const tier = (t as any).tier;
    if (!tier) return false;
    if (activeBusiness?.plan === SubscriptionPlan.Free) return tier === 'starter' || tier === 'professional' || tier === 'business';
    if (activeBusiness?.plan === SubscriptionPlan.Starter) return tier === 'professional' || tier === 'business';
    if (activeBusiness?.plan === SubscriptionPlan.Professional) return tier === 'business';
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500">Manage your account and businesses</p></div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          <TabsTrigger value="password" className="text-xs sm:text-sm">Password</TabsTrigger>
          <TabsTrigger value="businesses" className="text-xs sm:text-sm">Business</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
          <TabsTrigger value="plan" className="text-xs sm:text-sm">Plan</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm">Payments</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User size={18} /> Profile</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input {...profileForm.register('fullName')} />
                  {profileForm.formState.errors.fullName && <p className="text-red-500 text-sm">{profileForm.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={user?.email || ''} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-400">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={user?.phone || ''} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select
                    value={user?.currency || 'INR'}
                    onChange={async (e) => {
                      const currency = e.target.value as CurrencyCode;
                      try {
                        const { data: r } = await api.put('/users/profile', { currency });
                        if (r.success && r.data) updateUser(r.data as Partial<IUser>);
                        toast.success('Currency updated');
                      } catch { toast.error('Failed'); }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                  >
                    {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => <option key={code} value={code}>{symbol} {code}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input value={user?.timezone || 'Asia/Kolkata'} disabled className="bg-gray-50" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock size={18} /> Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && <p className="text-red-500 text-sm">{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && <p className="text-red-500 text-sm">{passwordForm.formState.errors.newPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && <p className="text-red-500 text-sm">{passwordForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2"><Building2 size={18} /> Your Businesses</CardTitle>
              <Button size="sm" onClick={() => setShowAddBusiness(!showAddBusiness)}>+ Add</Button>
            </CardHeader>
            <CardContent>
              {showAddBusiness && (
                <div className="flex gap-2 mb-4 p-3 bg-amber-50 rounded-lg">
                  <Input value={newBusinessName} onChange={(e) => setNewBusinessName(e.target.value)} placeholder="Business name..." />
                  <Button size="sm" onClick={handleAddBusiness} disabled={saving}>Create</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddBusiness(false); setNewBusinessName(''); }}>Cancel</Button>
                </div>
              )}
              <div className="space-y-3">
                {businesses.map((b) => (
                  <div key={b.id} className={`flex items-center justify-between p-4 rounded-lg border-2 ${activeBusiness?.id === b.id ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Building2 size={18} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.plan} Plan • {b.invoicePrefix} prefix</p>
                      </div>
                      {activeBusiness?.id === b.id && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Active</span>}
                    </div>
                    {activeBusiness?.id !== b.id && <Button size="sm" variant="outline" onClick={() => setActiveBusiness(b)} className="shrink-0">Switch</Button>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {activeBusiness && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18} /> Business Details — {activeBusiness.name}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Business Name</Label><Input {...businessForm.register('name')} /></div>
                    <div className="space-y-2"><Label>GST Number</Label><Input {...businessForm.register('gstNumber')} placeholder="33AABCU9603R1ZM" /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input {...businessForm.register('phone')} /></div>
                    <div className="space-y-2"><Label>Invoice Prefix</Label><Input {...businessForm.register('invoicePrefix')} placeholder="INV" /></div>
                  </div>
                  <div className="space-y-2"><Label>Address</Label><Textarea {...businessForm.register('address')} rows={3} /></div>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Save Business Details
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {activeBusiness && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Palette size={18} /> Invoice Templates</CardTitle>
                  <p className="text-sm text-gray-500">Choose your default template. Premium templates require Professional or higher.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[420px] overflow-y-auto pr-1">
                    {TEMPLATE_PREVIEWS.map((tp) => {
                      const locked = isPremiumTemplate(tp.slug);
                      const isDefault = defaultTemplate === tp.slug;
                      return (
                        <button
                          key={tp.slug}
                          onClick={() => !locked && handleSetDefaultTemplate(tp.slug)}
                          disabled={locked || saving}
                          className={`relative flex flex-col rounded-xl border-2 transition-all overflow-hidden ${
                            isDefault ? 'border-amber-400 ring-2 ring-amber-200' :
                            locked ? 'border-gray-100 opacity-50 cursor-not-allowed' :
                            'border-gray-200 hover:border-amber-300 cursor-pointer'
                          }`}
                        >
                          <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${tp.colors[0]}, ${tp.colors[1]})` }}>
                            <div className="absolute inset-2 bg-white/90 rounded-sm p-1.5">
                              <div className="w-6 h-1 rounded-sm mb-1" style={{ backgroundColor: tp.colors[0] }} />
                              <div className="space-y-0.5">
                                <div className="w-full h-px bg-gray-200" />
                                <div className="w-3/4 h-px bg-gray-200" />
                                <div className="w-5/6 h-px bg-gray-100" />
                              </div>
                              <div className="flex justify-end mt-1">
                                <div className="w-4 h-1 rounded-sm" style={{ backgroundColor: tp.colors[1] }} />
                              </div>
                            </div>
                            {isDefault && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                                <Star size={8} className="text-white fill-white" />
                              </div>
                            )}
                            {locked && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="text-[8px] bg-white/90 px-1.5 py-0.5 rounded font-medium text-gray-600">PRO</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-semibold text-gray-900">{tp.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-6">
          {activeBusiness && (
            <>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Crown size={18} /> Current Plan — {activeBusiness.name}</CardTitle></CardHeader>
                <CardContent>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getPlanColor(activeBusiness.plan)}`}>{activeBusiness.plan}</span>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{activeBusiness.nextInvoiceNo - 1}</p>
                      <p className="text-xs text-gray-500">Invoices Created</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{businesses.length}</p>
                      <p className="text-xs text-gray-500">Businesses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: SubscriptionPlan.Free, price: 0, features: ['10 invoices/mo', '5 clients', '3 templates', 'GST PDF', '1 business'] },
                  { name: SubscriptionPlan.Starter, price: 299, features: ['50 invoices/mo', '25 clients', '6 templates', 'Custom numbers', 'Analytics', '1 business'] },
                  { name: SubscriptionPlan.Professional, price: 799, features: ['200 invoices/mo', '100 clients', '12 templates', 'No branding', 'Priority support', 'API access', '3 businesses', 'Custom templates'] },
                  { name: SubscriptionPlan.Business, price: 2499, features: ['Unlimited invoices', 'Unlimited clients', '22 templates', 'Dedicated support', 'Custom integrations', 'Team roles', '10 businesses', 'Custom templates'] },
                ].map((plan) => (
                  <Card key={plan.name} className={activeBusiness.plan === plan.name ? 'border-amber-400 shadow-lg shadow-amber-100' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{plan.name}</CardTitle>
                        {activeBusiness.plan === plan.name && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-4">₹{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{f}</li>)}
                      </ul>
                      <Button className="w-full" variant={activeBusiness.plan === plan.name ? 'outline' : 'default'} onClick={() => handlePlanChange(plan.name)} disabled={activeBusiness.plan === plan.name || saving}>
                        {activeBusiness.plan === plan.name ? 'Current Plan' : 'Switch Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard size={20} /> Payment Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Configure Razorpay to accept online payments from clients. Clients can pay directly from the invoice page.</p>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Razorpay Key ID</Label>
                  <Input id="razorpayKeyId" placeholder="rzp_live_..." type="text" />
                  <p className="text-xs text-gray-400">Your Razorpay Key ID (starts with rzp_live_ or rzp_test_)</p>
                </div>
                <div className="space-y-2">
                  <Label>Razorpay Key Secret</Label>
                  <Input id="razorpayKeySecret" placeholder="Enter your secret key" type="password" />
                  <p className="text-xs text-gray-400">Your Razorpay Key Secret — stored securely</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="razorpayEnabled" className="rounded" />
                  <Label htmlFor="razorpayEnabled" className="text-sm">Enable online payments</Label>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button id="saveRazorpaySettings" onClick={async () => {
                  const keyId = (document.getElementById('razorpayKeyId') as HTMLInputElement).value;
                  const keySecret = (document.getElementById('razorpayKeySecret') as HTMLInputElement).value;
                  const enabled = (document.getElementById('razorpayEnabled') as HTMLInputElement).checked;
                  try {
                    const { activeBusiness } = (await import('@/hooks/useAuth')).useAuth.getState();
                    await api.put('/payments/settings/' + activeBusiness?.id, { razorpayKeyId: keyId, razorpayKeySecret: keySecret, razorpayEnabled: enabled });
                    toast.success('Payment settings saved!');
                  } catch { toast.error('Failed to save settings'); }
                }}>
                  <Save size={16} className="mr-2" /> Save Settings
                </Button>
                <span id="razorpayStatus" className="text-xs text-gray-400 flex items-center gap-1">
                  <Check size={12} className="text-green-500" /> Configure to enable "Pay Now" on invoices
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
