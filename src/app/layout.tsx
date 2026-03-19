import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import SessionProvider from "@/components/SessionProvider";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinanceMap — Money Flow Tracker",
  description: "Visual money flow tracker for dental clinics. Built by Nasser F. from Lightfusion.be",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
