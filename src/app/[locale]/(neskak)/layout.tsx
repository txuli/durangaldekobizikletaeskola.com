// app/layout.tsx

import type { Metadata } from "next";
import fs from 'fs/promises';
import path from 'path';
import "../globals.css";
import Line from "@/app/[locale]/components/main/line";
import { Fredoka } from 'next/font/google';
import Footer from "../components/main/Footer";
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from "next-intl";
import NavBar from "../components/main/navBar";
import { SITE_URL } from "@/lib/config";

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

const PUNTAGALEA_DESCRIPTION =
  "PUNTAGALEA OCCIDENT - Batu gure tropelera! Bizikletaren munduan murgiltzeko aukera ezin hobea, errepide, mendi, ziklokros edo pista diziplinetan!";

// Fallback metadata for this route group; the /puntagalea and
// /puntagaleaTeam pages each export their own more specific title,
// description and alternates (canonical/hreflang).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PUNTAGALEA OCCIDENT",
  description: PUNTAGALEA_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Puntagalea Occident",
    title: "PUNTAGALEA OCCIDENT",
    description: PUNTAGALEA_DESCRIPTION,
    images: [{ url: "/media/logo.png" }],
  },
  twitter: {
    card: "summary",
    title: "PUNTAGALEA OCCIDENT",
    description: PUNTAGALEA_DESCRIPTION,
    images: ["/media/logo.png"],
  },
  icons: {
    icon: "/media/logo.png",
    shortcut: "/media/logo.png",
    apple: "/media/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  // Cargar mensajes desde JSON
  const messagesPath = path.join(process.cwd(), 'messages', `${locale}.json`);
  const raw = await fs.readFile(messagesPath, 'utf-8');
  const messages = JSON.parse(raw);

  return (
    <html lang={locale}>
      <body
        className={`${fredoka.className} antialiased page-specific absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <NavBar className="bg-custom-puntagalea-orange" color2="bg-custom-puntagalea-dark-orange" />
          <Line color="bg-custom-puntagalea-dark-orange" />
          {children}
          <Footer color="bg-custom-puntagalea-orange" color2="bg-custom-puntagalea-dark-orange" color3="bg-custom-puntagalea-darker-orange" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
