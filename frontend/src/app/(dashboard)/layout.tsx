'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, Users, Settings, LogOut,
  Menu, X, ChevronDown, Building2, Plus, Activity, Receipt,
  ClipboardList, Repeat, CreditCard, Bell, BarChart3, UserCog, FolderOpen, Package, Percent,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CommandPalette } from '@/components/CommandPalette';
import { cn, formatCurrency } from '@/lib/utils';
import { IBusiness } from '@/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/estimates', label: 'Estimates', icon: ClipboardList },
  { href: '/dashboard/recurring', label: 'Recurring', icon: Repeat },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/activity', label: 'Activity Log', icon: Activity },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/team', label: 'Team', icon: UserCog },
  { href: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/gst', label: 'GST Reports', icon: Percent },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, fetchProfile, fetchBusinesses, businesses, activeBusiness, setActiveBusiness } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);

  useEffect(() => { if (!isLoading && !isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, isLoading, router]);
  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (isAuthenticated) fetchBusinesses(); }, [isAuthenticated, fetchBusinesses]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;

  const handleLogout = () => { logout(); router.push('/'); };
  const handleBusinessSwitch = (business: IBusiness) => { setActiveBusiness(business); setBusinessMenuOpen(false); router.refresh(); };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn('fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform lg:translate-x-0 flex flex-col', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2"><span className="text-2xl">🐝</span><span className="text-xl font-bold text-gray-900">BillingBee</span></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Business Switcher */}
        <div className="p-3 border-b border-gray-100">
          <button onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={15} className="text-amber-600 shrink-0" />
              <span className="font-medium text-gray-900 truncate">{activeBusiness?.name || 'Select Business'}</span>
            </div>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </button>
          {businessMenuOpen && (
            <div className="mt-1 bg-white rounded-lg border border-gray-100 shadow-lg py-1 max-h-48 overflow-y-auto">
              {businesses.map((b) => (
                <button key={b.id} onClick={() => handleBusinessSwitch(b)}
                  className={cn('w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2', activeBusiness?.id === b.id && 'bg-amber-50 text-amber-700')}>
                  <Building2 size={13} className="shrink-0" /><span className="truncate">{b.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{b.plan}</span>
                </button>
              ))}
              <Link href="/dashboard/settings" onClick={() => setBusinessMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 border-t border-gray-100 mt-1 pt-1">
                <Plus size={13} /> Add Business
              </Link>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition', isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
                <item.icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Plan badge */}
        <div className="p-3 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Current Plan</p>
            <p className="text-sm font-semibold text-gray-900">{activeBusiness?.plan || 'FREE'}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900"><Menu size={24} /></button>
            <div className="flex-1 max-w-md mx-4 hidden sm:block"><CommandPalette /></div>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">{user.fullName.charAt(0).toUpperCase()}</div>
                <span className="hidden sm:block text-sm font-medium">{user.fullName}</span>
                <ChevronDown size={16} />
              </button>
              {userMenuOpen && (<>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100"><p className="text-sm font-medium text-gray-900">{user.fullName}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                  <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"><Settings size={16} /> Settings</Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"><LogOut size={16} /> Logout</button>
                </div>
              </>)}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
