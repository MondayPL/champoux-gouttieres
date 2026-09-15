import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
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
  title: "Champoux Gouttières — Ops",
  description:
    "Liste de suivi, compte rendu, couleurs, réparations, villes et calendrier",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CA">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <Nav />
        <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
