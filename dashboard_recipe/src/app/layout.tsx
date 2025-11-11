import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800", "900"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foodiee | Cinematic AI Sous Chef",
  description:
    "Crave it. Cook it. Love it. Foodiee is your cinematic AI sous chef with immersive steps, visuals, and glowing guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-black text-white antialiased">
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.35)_0%,_rgba(30,30,30,0.95)_60%,_rgba(10,10,10,1)_100%)]">
          <span className="pointer-events-none absolute inset-0 -z-10 opacity-70 mix-blend-screen [background:radial-gradient(circle_at_20%_20%,rgba(255,208,127,0.35)_0%,transparent_65%),radial-gradient(circle_at_80%_10%,rgba(255,90,47,0.22)_0%,transparent_55%)]" />
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
