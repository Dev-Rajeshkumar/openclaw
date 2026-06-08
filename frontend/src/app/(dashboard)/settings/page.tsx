'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2, User, Lock, Building2, Crown, FileText, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, ProfileFormData, changePasswordSchema, ChangePasswordFormData, newBusinessSchema, NewBusinessFormData } from '@/lib/validations';
import { IUser, IBusiness, SubscriptionPlan } from '@/types';
import { getPlanColor } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { user, updateUser, businesses, activeBusiness, setActiveBusiness, fetchBusinesses } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500">Manage your account and businesses</p></div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
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
                  <Input value={user?.currency || 'INR'} disabled className="bg-gray-50" />
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
          {/* Active Business List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
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
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.plan} Plan • {b.invoicePrefix} prefix</p>
                      </div>
                      {activeBusiness?.id === b.id && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Active</span>}
                    </div>
                    {activeBusiness?.id !== b.id && <Button size="sm" variant="outline" onClick={() => setActiveBusiness(b)}>Switch</Button>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Details Form */}
          {activeBusiness && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18} /> Business Details — {activeBusiness.name}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input {...businessForm.register('name')} />
                    </div>
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input {...businessForm.register('gstNumber')} placeholder="33AABCU9603R1ZM" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input {...businessForm.register('phone')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Prefix</Label>
                      <Input {...businessForm.register('invoicePrefix')} placeholder="INV" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea {...businessForm.register('address')} rows={3} />
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Save Business Details
                  </Button>
                </form>
              </CardContent>
            </Card>
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
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: SubscriptionPlan.Free, price: 0, features: ['10 invoices/mo', '5 clients', 'GST PDF', '1 business'] },
                  { name: SubscriptionPlan.Starter, price: 299, features: ['50 invoices/mo', '25 clients', 'Custom numbers', 'Analytics', '1 business'] },
                  { name: SubscriptionPlan.Professional, price: 799, features: ['200 invoices/mo', '100 clients', 'No branding', 'Priority support', 'API access', '3 businesses'] },
                  { name: SubscriptionPlan.Business, price: 2499, features: ['Unlimited invoices', 'Unlimited clients', 'Dedicated support', 'Custom integrations', 'Team roles', '10 businesses'] },
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
      </Tabs>
    </div>
  );
}
