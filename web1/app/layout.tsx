import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VoiceProvider } from "./providers/VoiceProvider";

const font = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Tecktal Tutor",
  description: "Voice-driven AI learning platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={font.className}>
        <VoiceProvider>{children}</VoiceProvider>
      </body>
    </html>
  );
}
