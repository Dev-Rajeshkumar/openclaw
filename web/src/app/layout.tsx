import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'CMS Platform — Modern Content Management',
  description: 'A powerful, open-source CMS with AI-powered writing, deep analytics, and multi-language support.',
  keywords: ['CMS', 'blog', 'content management', 'open source', 'AI writing'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CMS Platform',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-surface text-gray-900 dark:bg-surface-dark dark:text-gray-100 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
