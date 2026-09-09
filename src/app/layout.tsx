import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Jua } from "next/font/google";
import AppShell from "@/components/AppShell";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: BRAND_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#003876",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${jua.variable} ${jua.className} h-dvh overflow-hidden antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-[#d6e4f2] text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
