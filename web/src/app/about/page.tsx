import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — CMS Platform',
  description: 'Learn about CMS Platform, our mission, and the team behind it.',
};

const team = [
  { name: 'Alex Chen', role: 'Founder & CEO', avatar: 'AC', bio: 'Former tech lead at a major SaaS company. Passionate about open-source and developer tools.' },
  { name: 'Sarah Kim', role: 'CTO', avatar: 'SK', bio: 'Full-stack architect with 15 years of experience building scalable content platforms.' },
  { name: 'Marcus Johnson', role: 'Head of Product', avatar: 'MJ', bio: 'Product strategist focused on creating intuitive content management experiences.' },
  { name: 'Elena Rodriguez', role: 'Lead Designer', avatar: 'ER', bio: 'Award-winning UX designer who believes great tools should be beautiful and accessible.' },
];

const values = [
  {
    icon: '🔓',
    title: 'Open Source',
    description: 'Our core platform is free and open-source. We believe in transparency and community-driven development.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered',
    description: 'Smart content suggestions, automated SEO optimization, and intelligent analytics — all powered by AI.',
  },
  {
    icon: '🌍',
    title: 'Multi-Language',
    description: 'Built-in internationalization support. Create content in any language and reach a global audience.',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    description: 'Understand your audience with real-time analytics, content decay alerts, and engagement metrics.',
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
          Building the Future of Content Management
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          CMS Platform is a modern, open-source content management system designed for creators, developers, and teams who want to build amazing content experiences.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-16">
        <div className="card p-8 md:p-12 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-gray-900">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            We believe everyone deserves access to powerful content management tools — without the enterprise price tag.
            Our mission is to democratize content creation by providing a free, open-source platform that combines
            AI-powered writing assistance, deep analytics, and multi-language support in one beautiful package.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">What We Stand For</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value) => (
            <div key={value.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{value.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {team.map((member) => (
            <div key={member.name} className="card p-6 flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-lg font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
                {member.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mb-16">
        <div className="card p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '10K+', label: 'Active Users' },
            { value: '50K+', label: 'Posts Published' },
            { value: '99.9%', label: 'Uptime' },
            { value: '40+', label: 'Languages' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-primary-600">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Join thousands of creators building with CMS Platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="btn-primary text-lg px-6 py-3">
            Get Started Free
          </Link>
          <Link href="/posts" className="btn-secondary text-lg px-6 py-3">
            Read the Blog
          </Link>
        </div>
      </section>
    </div>
  );
}
