import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import { LocaleProvider } from "@/components/client/locale-provider";
import { SiteChrome } from "@/components/client/site-chrome";
import "@/app/globals.css";

const headingFont = Outfit({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: {
    default: "AI Workflow Website",
    template: "%s | AI Workflow Website"
  },
  description: "Marketing and documentation website scaffold for the AI Agent Workflow project."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} font-sans`}>
        <LocaleProvider>
          <SiteChrome>{children}</SiteChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
