import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { brand, brandId } from "@/config/brand";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

export const metadata: Metadata = {
  title: `${brand.name} - Quản lý Doanh nghiệp`,
  description: `${brand.name} - Hệ thống quản lý nhân sự và chấm công`,
  icons: {
    icon: [
      { url: `${baseUrl}${brand.favicon}` },
      { url: `${baseUrl}${brand.favicon}`, sizes: "32x32" },
    ],
    apple: [{ url: `${baseUrl}${brand.favicon}` }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-brand={brandId}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
