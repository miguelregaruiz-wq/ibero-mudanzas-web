import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ibero Mudanzas | Mudanzas y transporte nacional e internacional",
  description:
    "Mudanzas, transporte de mercancías, portes, retirada y vaciado. Servicios nacionales e internacionales para particulares y empresas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}