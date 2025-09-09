import { fontClassName } from "@/lib/fonts";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proten - 仲間と繋がる筋トレアプリ",
  description: "筋トレとSNSを組み合わせたトレーニング仲間を見つけるアプリ",
  robots: "index,follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={fontClassName}>
        {children}
      </body>
    </html>
  );
}
