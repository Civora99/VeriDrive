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
  title: 'VeriDrive AI | Automotive Embedded Requirements-to-Validation Platform',
  description:
    'AI-powered requirements extraction, 10-category ISO 26262 test suite generation, adversarial critic review, HIL simulation & traceability for ECUs, CAN, and telematics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100 engineering-grid">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-[#060910] py-4 text-center font-mono text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>VERIDRIVE AI • AUTOMOTIVE EMBEDDED VALIDATION SYSTEM</div>
            <div className="text-[11px] text-slate-600">
              ISO 26262 Part 4 / AUTOSAR Classic & Adaptive / Vector CANoe HIL Architecture
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
