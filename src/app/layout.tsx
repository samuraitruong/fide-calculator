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
  title: "FIDE Chess Ratings",
  description: "The simple way to check FIDE chess ratings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const basePath = `${process.env.BASE_PATH || ""}/manifest.webmanifest`;
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href={basePath} />
        <meta name="theme-color" content="#0a1128" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div>{children}</div>
      </body>
    </html>
  );
}
