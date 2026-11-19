import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-next-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-next-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-next-mono",
  display: "swap",
});

const APP_TITLE = "Comedor Universitario — Portal de Reclamos";
const APP_DESCRIPTION =
  "Plataforma estudiantil de reclamos y reportes diarios para el comedor universitario.";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
