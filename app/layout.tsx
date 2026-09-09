import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Infomedia Monthly Facility and Asset Management Report",
    template: "%s | Infomedia FAMRS",
  },
  description:
    "Sistem pelaporan aset & fasilitas bulanan Infomedia — pengganti template Excel Monthly Report.",
  icons: {
    icon: [
      { url: "/logo/logo.png", type: "image/png" },
    ],
    shortcut: "/logo/logo.png",
    apple: "/logo/logo.png",
  },
};

import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/language-context";
import type { Locale } from "@/lib/i18n/types";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("app_locale")?.value;
  const initialLocale: Locale = localeCookie === "en" ? "en" : "id";

  return (
    <html
      lang={initialLocale}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

