'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, changePasswordSchema, ProfileFormData, ChangePasswordFormData } from '@/lib/validations';
import { IUser, SubscriptionPlan, IPlanInfo } from '@/types';
import { getPlanColor } from '@/lib/utils';
import api from '@/lib/api';

const PLANS: IPlanInfo[] = [
  {
    name: SubscriptionPlan.FREE,
    price: 0,
    maxInvoices: 10,
    maxClients: 5,
    canCustomizeInvoiceNumber: false,
    canRemoveBranding: false,
    hasPrioritySupport: false,
    hasAnalytics: false,
    features: ['10 invoices/month', '5 clients', 'GST-compliant PDF', 'Basic dashboard'],
  },
  {
    name: SubscriptionPlan.SILVER,
    price: 299,
    maxInvoices: 50,
    maxClients: 25,
    canCustomizeInvoiceNumber: true,
    canRemoveBranding: false,
    hasPrioritySupport: false,
    hasAnalytics: true,
    features: ['50 invoices/month', '25 clients', 'Custom invoice numbers', 'Revenue analytics'],
  },
  {
    name: SubscriptionPlan.GOLD,
    price: 799,
    maxInvoices: 200,
    maxClients: 100,
    canCustomizeInvoiceNumber: true,
    canRemoveBranding: true,
    hasPrioritySupport: true,
    hasAnalytics: true,
    features: ['200 invoices/month', '100 clients', 'Remove branding', 'Priority support'],
  },
  {
    name: SubscriptionPlan.DIAMOND,
    price: 2499,
    maxInvoices: -1,
    maxClients: -1,
    canCustomizeInvoiceNumber: true,
    canRemoveBranding: true,
    hasPrioritySupport: true,
    hasAnalytics: true,
    features: ['Unlimited invoices', 'Unlimited clients', 'All features', 'API access', 'Dedicated support'],
  },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'plan'>('profile');
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      businessName: '',
      gstNumber: '',
      phone: '',
      address: '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || '',
        businessName: user.businessName || '',
        gstNumber: user.gstNumber || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const { data: response } = await api.put('/users/profile', data);
      if (response.success && response.data) {
        updateUser(response.data as Partial<IUser>);
        toast.success('Profile updated successfully');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setSaving(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChange = async (plan: SubscriptionPlan) => {
    if (plan === user?.plan) return;
    setSaving(true);
    try {
      const { data: response } = await api.put('/users/plan', { plan });
      if (response.success && response.data) {
        updateUser(response.data as Partial<IUser>);
        toast.success(`Plan changed to ${plan}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change plan';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'password' as const, label: 'Password' },
    { id: 'plan' as const, label: 'Plan & Billing' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  {...profileForm.register('fullName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                {profileForm.formState.errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  {...profileForm.register('businessName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  {...profileForm.register('gstNumber')}
                  placeholder="33AABCU9603R1ZM"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                {profileForm.formState.errors.gstNumber && (
                  <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.gstNumber.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  {...profileForm.register('phone')}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                {...profileForm.register('address')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                {...passwordForm.register('currentPassword')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                {...passwordForm.register('newPassword')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                {...passwordForm.register('confirmPassword')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getPlanColor(user?.plan || 'FREE')}`}>
                    {user?.plan}
                  </span>
                </div>
              </div>
              <Crown size={24} className="text-amber-500" />
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl border-2 p-6 transition ${
                  user?.plan === plan.name
                    ? 'border-amber-400 shadow-lg shadow-amber-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {user?.plan === plan.name && (
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  ₹{plan.price}
                  <span className="text-sm text-gray-400 font-normal">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanChange(plan.name)}
                  disabled={user?.plan === plan.name || saving}
                  className={`w-full py-2.5 rounded-xl font-medium transition ${
                    user?.plan === plan.name
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {user?.plan === plan.name ? 'Current Plan' : 'Switch Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
