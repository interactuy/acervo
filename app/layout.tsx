import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
});

export const metadata: Metadata = {
  title: {
    default: "Acervo",
    template: "%s | Acervo",
  },
  description:
    "Base cultural publica para explorar museos, artistas, obras y exposiciones.",
  applicationName: "Acervo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-UY"
      className={`${dmSans.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
