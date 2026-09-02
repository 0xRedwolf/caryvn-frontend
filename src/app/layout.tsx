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
  title: "Caryvn - Buy Instagram & Tiktok Followers, Views & Likes",
  description: "Boost your social media accounts with Caryvn. Safe, fast, and reliable SMM services for Instagram, TikTok, YouTube, Twitter, Facebook, Audiomack, and more. Over 80 countries supported with instant delivery and 24/7 support.",
  keywords: [
    "SMM Panel", 
    "Social Media Marketing", 
    "Instagram Followers", 
    "TikTok Views",
    "TikTok Followers",
    "TikTok Likes",
    "Instagram Followers",
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
    "Caryvn"
  ],
  openGraph: {
    title: "Caryvn - Buy Instagram & Tiktok Followers, Views & Likes",
    description: "Boost your social media accounts with Caryvn. Safe, fast, and reliable SMM services. Over 80 countries supported with instant delivery and 24/7 support.",
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
    title: "Caryvn - Buy Instagram & Tiktok Followers, Views & Likes",
    description: "Boost your social media accounts with Caryvn. Safe, fast, and reliable SMM services. Over 80 countries supported with instant delivery and 24/7 support.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-display antialiased`}>
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

