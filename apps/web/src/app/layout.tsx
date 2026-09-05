import type { Metadata } from 'next';
import './globals.css';
import { MerchantProvider } from '@/lib/MerchantContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Merchant AI Control Center | Razorpay AI Track 01',
  description: 'Teach an AI what makes your business win. Authoritative control, evaluation, and observability for autonomous policy decisions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-[#061b31]">
        <MerchantProvider>
          <AppShell>{children}</AppShell>
        </MerchantProvider>
      </body>
    </html>
  );
}
