import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TestPilot — AI Web Testing',
  description: 'Auto-generate and run E2E tests with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
