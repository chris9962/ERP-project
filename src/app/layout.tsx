import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

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
  title: "LegiFood - Quản lý Doanh nghiệp",
  description: "LegiFood - Hệ thống quản lý nhân sự và chấm công",
  icons: {
    icon: [
      { url: `${baseUrl}/logo/logo.jpeg`, type: "image/jpeg" },
      { url: `${baseUrl}/logo/logo.jpeg`, type: "image/jpeg", sizes: "32x32" },
    ],
    apple: [{ url: `${baseUrl}/logo/logo.jpeg`, type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
