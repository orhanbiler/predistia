import type { Metadata } from 'next';
import React from 'react';
import FirebaseAnalytics from './FirebaseAnalytics';
import Toaster from '@/components/Toaster';

export const metadata: Metadata = {
  title: 'Predistia',
  description: 'Incident-driven signals from news + EOD',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, Arial' }}>
        <FirebaseAnalytics />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
