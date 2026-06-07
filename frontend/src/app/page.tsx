import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <span className="text-xl font-bold text-gray-900">BillingBee</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-gray-600 hover:text-gray-900 font-medium transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto pt-20 pb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span>🇮🇳</span>
            <span>Built for Indian Freelancers & Businesses</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            GST Invoicing
            <br />
            <span className="text-amber-500">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Create professional GST invoices in 30 seconds. Track payments, manage clients,
            and stay tax-compliant — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition shadow-lg shadow-amber-200"
            >
              Start Free — No Card Required
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto text-gray-600 hover:text-gray-900 px-6 py-4 text-lg font-medium"
            >
              See How It Works →
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Free forever for up to 10 invoices/month
          </p>
        </div>

        {/* Features */}
        <div id="features" className="py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything You Need to Get Paid
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Stop struggling with Excel sheets and messy invoices. BillingBee handles it all.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: '30-Second Invoices',
                desc: 'Enter client details, add items, and generate a GST-compliant invoice in under 30 seconds.',
              },
              {
                icon: '📄',
                title: 'GST Compliant PDFs',
                desc: 'Auto-calculates CGST, SGST, IGST & UTGST. Includes HSN codes, GSTIN, and all required fields.',
              },
              {
                icon: '📊',
                title: 'Track Everything',
                desc: 'Dashboard shows unpaid invoices, monthly revenue, and client history at a glance.',
              },
              {
                icon: '🔒',
                title: 'Secure & Private',
                desc: 'Your data is encrypted and stored securely. Each user has isolated workspace.',
              },
              {
                icon: '📱',
                title: 'Works on Mobile',
                desc: 'Create and send invoices from your phone. No app needed — works in any browser.',
              },
              {
                icon: '💰',
                title: 'Free to Start',
                desc: 'Generate up to 10 invoices free every month. Upgrade only when you need more.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 text-center mb-12">Start free. Scale as you grow.</p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '₹0',
                period: '/mo',
                badge: null,
                features: [
                  '10 invoices/month',
                  '5 clients',
                  'GST-compliant PDF',
                  'Basic dashboard',
                ],
                cta: 'Get Started',
                highlight: false,
              },
              {
                name: 'Silver',
                price: '₹299',
                period: '/mo',
                badge: null,
                features: [
                  '50 invoices/month',
                  '25 clients',
                  'Custom invoice numbers',
                  'Revenue analytics',
                ],
                cta: 'Start Free Trial',
                highlight: false,
              },
              {
                name: 'Gold',
                price: '₹799',
                period: '/mo',
                badge: 'POPULAR',
                features: [
                  '200 invoices/month',
                  '100 clients',
                  'Remove BillingBee branding',
                  'Priority support',
                  'All analytics',
                ],
                cta: 'Start Free Trial',
                highlight: true,
              },
              {
                name: 'Diamond',
                price: '₹2,499',
                period: '/mo',
                badge: 'ENTERPRISE',
                features: [
                  'Unlimited invoices',
                  'Unlimited clients',
                  'All Gold features',
                  'Dedicated support',
                  'API access',
                ],
                cta: 'Contact Us',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-white p-6 rounded-2xl border-2 relative ${
                  plan.highlight
                    ? 'border-amber-400 shadow-lg shadow-amber-100'
                    : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 my-3">
                  {plan.price}
                  <span className="text-base text-gray-400 font-normal">{plan.period}</span>
                </div>
                <ul className="space-y-2 text-gray-600 text-sm mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`block w-full text-center py-3 rounded-xl font-semibold transition ${
                    plan.highlight
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 text-center">
          <div className="bg-amber-500 rounded-3xl p-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to simplify your invoicing?
            </h2>
            <p className="text-amber-100 mb-8 text-lg">
              Join thousands of Indian freelancers who trust BillingBee for their GST invoicing.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-white text-amber-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-50 transition"
            >
              Create Your First Invoice — It's Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐝</span>
            <span className="font-bold text-gray-900">BillingBee</span>
          </div>
          <p className="text-gray-400 text-sm">
            Made with ❤️ in India for Indian freelancers
          </p>
        </div>
      </footer>
    </div>
  );
}
