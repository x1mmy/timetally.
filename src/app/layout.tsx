import "~/styles/globals.css";

import { type Metadata } from "next";
import localFont from "next/font/local";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "TimeTally - Simple Timesheet Management",
  description:
    "Multi-tenant timesheet management with subdomain-based client isolation",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
