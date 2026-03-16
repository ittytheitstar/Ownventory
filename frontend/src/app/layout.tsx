import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Ownventory',
  description: 'Track and manage your home inventory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-50 min-h-screen">
        <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
