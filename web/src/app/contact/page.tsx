import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact — CMS Platform',
  description: 'Get in touch with the CMS Platform team.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Have a question, feedback, or just want to say hi? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="card p-8">
            <h2 className="text-lg font-semibold mb-6">Send us a message</h2>
            <form action="/api/forms/contact/submit" method="POST" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <select id="contact-subject" name="subject" className="input">
                  <option value="">Select a topic...</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership</option>
                  <option value="press">Press & Media</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                  className="input resize-y"
                />
              </div>

              <button type="submit" className="btn-primary">
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:hello@cmsplatform.com" className="text-sm text-primary-600 hover:underline">hello@cmsplatform.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">San Francisco, CA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="space-y-2">
              {[
                { name: 'Twitter', href: 'https://twitter.com', handle: '@cmsplatform' },
                { name: 'GitHub', href: 'https://github.com', handle: 'cms-platform' },
                { name: 'LinkedIn', href: 'https://linkedin.com', handle: 'CMS Platform' },
                { name: 'Discord', href: 'https://discord.com', handle: 'Join our server' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-medium">{social.name}</span>
                  <span className="text-xs text-gray-500">{social.handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Link */}
          <div className="card p-6 bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold mb-2">Looking for help?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Check out our FAQ and documentation for quick answers.
            </p>
            <Link href="/faq" className="text-sm text-primary-600 hover:underline font-medium">
              Visit Help Center →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
