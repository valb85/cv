import type { Metadata } from 'next';
import { Sacramento } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

/**
 * The handwritten overlay on the hero. Self-hosted by next/font rather than
 * linked from Google at runtime: no third-party request, no layout shift.
 */
const script = Sacramento({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-script',
});

export const metadata: Metadata = {
  title: 'Victor Albulescu',
  description: 'CV of Victor Albulescu, web developer based in Timisoara, Romania.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={script.variable}>
      <body>{children}</body>
    </html>
  );
}
