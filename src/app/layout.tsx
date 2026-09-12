import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.caryvn.com'),
  alternates: {
    canonical: '/',
  },
  title: "Caryvn - SMM Panel & Instant Virtual Numbers (SMS OTP Verification)",
  description: "Boost your social media growth and receive instant SMS OTP verification online with Caryvn. Buy real Instagram & TikTok followers, views, likes, and rent temporary virtual phone numbers for WhatsApp, Telegram, Google, OpenAI & 500+ services with 100% auto-refund guarantee.",
  keywords: [
    "SMM Panel", 
    "Social Media Marketing", 
    "Instagram Followers", 
    "TikTok Views",
    "TikTok Followers",
    "TikTok Likes",
    "Instagram Likes",
    "Instagram Views",
    "YouTube Subscribers",
    "Cheap SMM Services",
    "Social Media Boosting",
    "Social Media Growth",
    "Twitter likes",
    "Twitter followers",
    "Buy Followers",
    "Digital Marketing",
    "Virtual Numbers",
    "Receive SMS Online",
    "SMS Verification",
    "OTP Verification",
    "Temporary Phone Numbers",
    "Virtual SMS Number",
    "Buy OTP Online",
    "WhatsApp Virtual Number",
    "Telegram OTP Verification",
    "ZapOTP Alternative",
    "Caryvn"
  ],
  openGraph: {
    title: "Caryvn - SMM Panel & Instant Virtual Numbers (SMS OTP Verification)",
    description: "Boost social media accounts and receive instant SMS OTP codes for WhatsApp, Telegram, Google, OpenAI & 500+ services with 100% auto-refund guarantee.",
    url: "https://www.caryvn.com",
    siteName: "Caryvn",
    images: [
      {
        url: "/logo-full.png",
        width: 1200,
        height: 630,
        alt: "Caryvn Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caryvn - SMM Panel & Instant Virtual Numbers (SMS OTP Verification)",
    description: "Boost social media accounts and receive instant SMS OTP codes for WhatsApp, Telegram, Google, OpenAI & 500+ services with 100% auto-refund guarantee.",
    images: ["/logo-full.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${inter.variable} font-display antialiased bg-slate-50 text-slate-900`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <SessionTimeoutModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

