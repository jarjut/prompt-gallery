import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YANTRALOKA // Nano Banana Pro Archive",
  description: "Arsip formula prompt AI dengan penyuntingan variabel interaktif.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink font-body selection:bg-accent selection:text-accent-ink">
        {children}
      </body>
    </html>
  );
}
