import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { landingFonts } from "~/app/_components/landing/fonts";

const title = "TimeTally: timesheets and payroll for Australian small businesses";
const description =
  "Timesheets and payroll for Australian small businesses. PIN clock-in, automatic breaks, weekend rates, CSV export.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary" },
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={landingFonts}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
