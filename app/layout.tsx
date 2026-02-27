import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickPatch — Automated Security for Vibe-Coded Apps",
  description:
    "QuickPatch scans your AI-generated repositories and opens a Pull Request with every security fix — automatically.",
  keywords: [
    "security",
    "vibe coding",
    "AI code",
    "automated security",
    "pull request",
    "code audit",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
