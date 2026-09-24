import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const fuente = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fuente",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Preguntale a Jev",
  description:
    "Hacé una pregunta de sí o no y Jev te responde con probabilidades y nivel de confianza. Sin registro.",
  openGraph: {
    title: "Preguntale a Jev",
    description: "Una pregunta, un número. Sin registro, sin instalar nada.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f5" },
    { media: "(prefers-color-scheme: dark)", color: "#12152a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fuente.variable}>
      <body>{children}</body>
    </html>
  );
}
