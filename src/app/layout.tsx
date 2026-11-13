import type { Metadata } from "next";
import { SiteHeader } from "@/components/auth/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoopLab",
  description: "Make a lo-fi beat in your browser, save it, and share it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
