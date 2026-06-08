import Link from 'next/link';
import { ArrowRight, Check, FileText, Users, Receipt, BarChart3, Shield, Zap, Globe } from 'lucide-react';

const features = [
  { icon: FileText, title: 'GST Invoices', desc: 'Create professional GST-compliant invoices with auto tax calculation' },
  { icon: Users, title: 'Client Management', desc: 'Manage all your clients, track outstanding balances' },
  { icon: Receipt, title: 'Expense Tracking', desc: 'Track business expenses, categorize and monitor spending' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Revenue reports, cash flow, profit & loss insights' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Bank-level security with automatic backups' },
  { icon: Zap, title: 'Recurring Invoices', desc: 'Automate billing with recurring invoice schedules' },
];

const plans = [
  { name: 'Free', price: 0, features: ['10 invoices/mo', '5 clients', 'GST PDF export', 'Email support'] },
  { name: 'Starter', price: 299, features: ['50 invoices/mo', '25 clients', 'Custom invoice numbers', 'Analytics dashboard'], popular: true },
  { name: 'Professional', price: 799, features: ['200 invoices/mo', '100 clients', 'Remove branding', 'Priority support', 'API access'] },
  { name: 'Business', price: 2499, features: ['Unlimited invoices', 'Unlimited clients', 'Dedicated support', 'Custom integrations', 'Team roles'] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2"><span className="text-2xl">🐝</span><span className="text-xl font-bold text-gray-900">BillingBee</span></div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
            <Link href="/auth/register" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-medium mb-6">
            <Zap size={14} /> Built for Indian Businesses — GST Ready
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Invoicing made <span className="text-amber-500">simple</span> for small businesses
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Create GST-compliant invoices, track payments, manage clients, and grow your business — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-white rounded-xl text-lg font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2">
              Start Free <ArrowRight size={20} />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 border border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-50 transition text-center">
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need to get paid</h2>
            <p className="text-lg text-gray-500">Powerful features designed for Indian small businesses</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4"><f.icon size={24} className="text-amber-600" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500">Start free, scale as you grow. All prices in INR.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 border-2 ${plan.popular ? 'border-amber-400 shadow-lg shadow-amber-100 relative' : 'border-gray-100'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">Most Popular</span>}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <div className="mb-4"><span className="text-3xl font-bold text-gray-900">₹{plan.price}</span><span className="text-gray-400 text-sm">/mo</span></div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500 shrink-0" />{f}</li>)}
                </ul>
                <Link href="/auth/register" className={`block w-full py-3 rounded-xl text-center text-sm font-semibold transition ${plan.popular ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-amber-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to simplify your billing?</h2>
          <p className="text-lg text-amber-100 mb-8">Join thousands of small businesses using BillingBee.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-600 rounded-xl text-lg font-semibold hover:bg-amber-50 transition">
            Start Free Today <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><span className="text-xl">🐝</span><span className="text-lg font-bold text-gray-900">BillingBee</span></div>
          <p className="text-sm text-gray-400">© 2026 BillingBee. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
