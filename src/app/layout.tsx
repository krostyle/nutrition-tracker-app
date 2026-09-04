import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nutrition Tracker",
  description: "Personal nutrition tracking app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <body className="flex min-h-screen flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
