import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/shared/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VeriDrive AI | Requirements → Validation Intelligence',
  description:
    'AI-powered Requirements-to-Validation Intelligence platform for embedded automotive software (ECUs, telematics, CAN/J1939 systems).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#0b0f17] text-slate-100 subtle-grid">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-[#080c13] py-4 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>VeriDrive AI • Automotive Requirements Validation Intelligence</div>
            <div className="text-[11px] text-slate-600">
              Developed for PACCAR India Hackathon • ISO 26262 & ASPICE Alignment
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
