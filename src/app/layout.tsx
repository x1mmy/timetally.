import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import localFont from "next/font/local";

export const metadata: Metadata = {
  title: "TimeTally — Timesheets and payroll, already added up",
  description:
    "Staff clock in with a four-digit PIN. TimeTally deducts breaks, applies weekday, Saturday and Sunday rates, and exports a payroll-ready CSV. Built by Stash Labs.",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
    { rel: "icon", url: "/favicon.ico", sizes: "any" }, // Fallback
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${satoshi.variable}`}>
      <body>{children}</body>
    </html>
  );
}
