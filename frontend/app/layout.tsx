import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Master Dex Tracker',
  description: 'Track your Pokemon Master Dex challenge progress',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
