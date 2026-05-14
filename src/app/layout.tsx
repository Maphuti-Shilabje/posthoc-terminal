import type { Metadata } from "next";
import { Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Posthoc Terminal",
  description: "High-performance financial visualization and forensic trade reconstruction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", "dark", geistMono.variable, "font-sans", geist.variable)}>
      <body className="m-0 p-0 overflow-hidden bg-gray-950 font-mono">
        {children}
      </body>
    </html>
  );
}