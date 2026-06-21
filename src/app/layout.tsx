import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operacao 12S",
  description: "Plataforma digital de emagrecimento guiado por 12 semanas."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
