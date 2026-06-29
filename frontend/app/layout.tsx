import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import ThemeRegistry from '@/components/ThemeRegistry';

// GeistSans/GeistMono define the --font-geist-sans / --font-geist-mono CSS
// variables the design tokens reference (see @orchard-cde/design/tokens/typography).
// The `geist` package self-hosts the font files, so the static-export build
// never fetches from Google Fonts at build time (works offline / in CI).

export const metadata: Metadata = {
  title: 'Canopy — Orchard',
  description: 'Orchard Cloud Development Environment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
