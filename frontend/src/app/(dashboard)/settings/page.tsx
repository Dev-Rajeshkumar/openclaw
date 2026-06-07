'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2, Crown, Building2, Plus, Check, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, changePasswordSchema, ProfileFormData, ChangePasswordFormData } from '@/lib/validations';
import { IUser, SubscriptionPlan, IPlanInfo, IBusiness } from '@/types';
import { getPlanColor } from '@/lib/utils';
import api from '@/lib/api';

const PLANS: IPlanInfo[] = [
  { name: SubscriptionPlan.FREE, price: 0, maxInvoices: 10, maxClients: 5, canCustomizeInvoiceNumber: false, canRemoveBranding: false, hasPrioritySupport: false, hasAnalytics: false, features: ['10 invoices/month', '5 clients', 'GST-compliant PDF', 'Basic dashboard'] },
  { name: SubscriptionPlan.SILVER, price: 299, maxInvoices: 50, maxClients: 25, canCustomizeInvoiceNumber: true, canRemoveBranding: false, hasPrioritySupport: false, hasAnalytics: true, features: ['50 invoices/month', '25 clients', 'Custom invoice numbers', 'Revenue analytics'] },
  { name: SubscriptionPlan.GOLD, price: 799, maxInvoices: 200, maxClients: 100, canCustomizeInvoiceNumber: true, canRemoveBranding: true, hasPrioritySupport: true, hasAnalytics: true, features: ['200 invoices/month', '100 clients', 'Remove branding', 'Priority support'] },
  { name: SubscriptionPlan.DIAMOND, price: 2499, maxInvoices: -1, maxClients: -1, canCustomizeInvoiceNumber: true, canRemoveBranding: true, hasPrioritySupport: true, hasAnalytics: true, features: ['Unlimited invoices', 'Unlimited clients', 'All features', 'API access', 'Dedicated support'] },
];

export default function SettingsPage() {
  const { user, updateUser, businesses, activeBusiness, setActiveBusiness, fetchBusinesses } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'businesses' | 'plan'>('profile');
  const [saving, setSaving] = useState(false);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', avatar: '' },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (user) profileForm.reset({ fullName: user.fullName || '', avatar: user.avatar || '' });
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const { data: response } = await api.put('/users/profile', data);
      if (response.success && response.data) { updateUser(response.data as Partial<IUser>); toast.success('Profile updated'); }
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setSaving(true);
    try {
      await api.put('/users/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed'); passwordForm.reset();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleAddBusiness = async () => {
    if (!newBusinessName.trim()) return;
    setSaving(true);
    try {
      await api.post('/businesses', { name: newBusinessName.trim(), invoicePrefix: newBusinessName.substring(0, 3).toUpperCase() });
      toast.success('Business created');
      setNewBusinessName('');
      setShowAddBusiness(false);
      await fetchBusinesses();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Are you sure? All invoices and clients for this business will be soft-deleted.')) return;
    setSaving(true);
    try {
      await api.delete(`/businesses/${businessId}`);
      toast.success('Business deleted');
      await fetchBusinesses();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handlePlanChange = async (plan: SubscriptionPlan) => {
    if (!activeBusiness || plan === activeBusiness.plan) return;
    setSaving(true);
    try {
      await api.put(`/businesses/${activeBusiness.id}/plan`, { plan });
      toast.success(`Plan changed to ${plan}`);
      await fetchBusinesses();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'password' as const, label: 'Password' },
    { id: 'businesses' as const, label: 'Businesses' },
    { id: 'plan' as const, label: 'Plan' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500">Manage your account and businesses</p></div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...profileForm.register('fullName')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
              {profileForm.formState.errors.fullName && <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.fullName.message}</p>}
            </div>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save
            </button>
          </form>
        </div>
      )}

      {/* PASSWORD TAB */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" {...passwordForm.register('currentPassword')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
              {passwordForm.formState.errors.currentPassword && <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" {...passwordForm.register('newPassword')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" {...passwordForm.register('confirmPassword')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
              {passwordForm.formState.errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Change Password
            </button>
          </form>
        </div>
      )}

      {/* BUSINESSES TAB */}
      {activeTab === 'businesses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Businesses</h2>
              <button onClick={() => setShowAddBusiness(!showAddBusiness)}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                <Plus size={16} /> Add Business
              </button>
            </div>

            {showAddBusiness && (
              <div className="flex gap-2 mb-4 p-3 bg-amber-50 rounded-xl">
                <input value={newBusinessName} onChange={(e) => setNewBusinessName(e.target.value)} placeholder="Business name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                <button onClick={handleAddBusiness} disabled={saving}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50">
                  Create
                </button>
                <button onClick={() => { setShowAddBusiness(false); setNewBusinessName(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            )}

            <div className="space-y-3">
              {businesses.map((b) => (
                <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${activeBusiness?.id === b.id ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Building2 size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{b.name}</p>
                        {activeBusiness?.id === b.id && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={10} /> Active</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{b.plan} Plan • {b.invoicePrefix}-XXXXX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeBusiness?.id !== b.id && (
                      <button onClick={() => setActiveBusiness(b)}
                        className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-100 rounded-lg transition">
                        Switch
                      </button>
                    )}
                    {businesses.length > 1 && (
                      <button onClick={() => handleDeleteBusiness(b.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLAN TAB */}
      {activeTab === 'plan' && activeBusiness && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Plan — {activeBusiness.name}</h2>
                <span className={`text-sm font-medium px-3 py-1 rounded-full mt-1 inline-block ${getPlanColor(activeBusiness.plan)}`}>{activeBusiness.plan}</span>
              </div>
              <Crown size={24} className="text-amber-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl border-2 p-6 transition ${activeBusiness.plan === plan.name ? 'border-amber-400 shadow-lg shadow-amber-100' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {activeBusiness.plan === plan.name && <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-4">₹{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
                <ul className="space-y-2 mb-6">{plan.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{f}</li>))}</ul>
                <button onClick={() => handlePlanChange(plan.name)} disabled={activeBusiness.plan === plan.name || saving}
                  className={`w-full py-2.5 rounded-xl font-medium transition ${activeBusiness.plan === plan.name ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                  {activeBusiness.plan === plan.name ? 'Current Plan' : 'Switch Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
