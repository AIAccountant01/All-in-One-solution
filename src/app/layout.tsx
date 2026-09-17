import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { HealthProvider } from "@/lib/store";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helia",
  description:
    "Mobile personal health assistant — Gabit, Ultrahuman, Google Fit, Apple Health, weekly summaries, and autonomous nudges.",
  applicationName: "Helia",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Helia",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f6b5c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <HealthProvider>{children}</HealthProvider>
      </body>
    </html>
  );
}
