import type { Metadata } from "next";
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
  title: "Helia — Personal Health Assistant",
  description:
    "Connect your health apps, track steps, food, and labs, get weekly summaries, and receive autonomous wellness nudges.",
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
