import type { Metadata } from "next";
import {
  Alfa_Slab_One,
  Nunito,
  Rokkitt,
  Caveat,
} from "next/font/google";
import "./globals.css";

const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa-slab",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const rokkitt = Rokkitt({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rokkitt",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Center Pizza — Pizzaria em São Carlos, SP",
  description:
    "Pizzas, brotinhos, esfihas, pastéis, fogazzas e batatas recheadas. Delivery e retirada em São Carlos. Peça pelo WhatsApp!",
  keywords: [
    "pizzaria",
    "São Carlos",
    "delivery",
    "pizza",
    "brotinho",
    "esfiha",
    "Center Pizza",
  ],
  openGraph: {
    title: "Center Pizza — Pizzaria em São Carlos, SP",
    description:
      "Pizzas, brotinhos, esfihas, pastéis, fogazzas e batatas recheadas. Delivery e retirada.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${alfaSlabOne.variable} ${nunito.variable} ${rokkitt.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
