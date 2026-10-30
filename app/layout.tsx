import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Printa Studio — AI Design Tool Anyone Can Use",
  description:
    "Canva-like design tool with AI: describe your design in plain words, edit with drag & drop, export print-quality PNG. Embeddable in Magento with one script tag.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Design fonts used on canvases — loaded once, all weights */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Poppins:wght@300;400;600;700;800&family=Montserrat:wght@300;400;600;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Oswald:wght@300;400;500;600;700&family=Bebas+Neue&family=Anton&family=Pacifico&family=Dancing+Script:wght@400;600;700&family=Caveat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0c0c0f] text-white">{children}</body>
    </html>
  );
}
