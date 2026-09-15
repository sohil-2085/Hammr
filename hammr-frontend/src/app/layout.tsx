import type { Metadata } from 'next';
import './globals.css';

import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: 'Hammr',
  description: 'Seller Listed Auction Marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}