import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sostituzioni docenti — CPIA",
  description: "Modulo sostituzioni docenti: slot, visto, assegnazione e budget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
