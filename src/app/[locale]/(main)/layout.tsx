import type { Metadata } from "next";
import "../globals.css";

import NavBar from "../components/main/navBar";
import Sponsor from "../components/mainPage/sponsors/sponsors";
import Footer from "../components/main/Footer";
import { Fredoka } from "next/font/google";
import Line from "@/app/[locale]/components/main/line";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { InfoProvider } from "@/context/infoContext";
import GlobalInfoHandler from "../components/handler/GlobalInfoHandler";
import { ErrorProvider } from "@/context/ErrorContext";
import GlobalErrorHandler from "@/app/[locale]/components/handler/GlobalErrorHandler";
import LocalBusinessSchema from "@/app/[locale]/components/main/LocalBusinessSchema";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { buildAlternates } from "@/lib/seo";
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const DEFAULT_DESCRIPTION =
  "Durangaldeko Bizikleta Eskola - Batu gure tropelera! Bizikletaren munduan murgiltzeko aukera ezin hobea, errepide, mendi, ziklokros edo pista diziplinetan!";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Pages under this route group inherit these defaults unless they export
// their own `generateMetadata`/`metadata` (title/description/alternates).
// `metadataBase` also resolves every relative OG/Twitter image URL below.
// This is `generateMetadata` (not a static object) purely so the
// `alternates` fallback below can be locale-correct for whichever page
// happens not to override it.
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} - Ziklismo eskola Durangaldean`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    alternates: buildAlternates(locale),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${SITE_NAME} - Ziklismo eskola Durangaldean`,
      description: DEFAULT_DESCRIPTION,
      images: [{ url: "/media/logo.png" }],
    },
    twitter: {
      card: "summary",
      title: `${SITE_NAME} - Ziklismo eskola Durangaldean`,
      description: DEFAULT_DESCRIPTION,
      images: ["/media/logo.png"],
    },
    icons: {
      icon: "/media/logo.png",
      shortcut: "/media/logo.png",
      apple: "/media/logo.png",
    },
  };
}

export const runtime = "nodejs";

export default async function LocaleLayout(props: Props) {
  const { children } = props;
  const { locale } = await props.params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${fredoka} antialiased pageNO-specific absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]`}
      >
        <LocalBusinessSchema />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <InfoProvider>
          <ErrorProvider>
          <NavBar />
          <Line />
          {children}
          <Sponsor />
          <Line />
          <Footer color="bg-customblue" />
          <GlobalInfoHandler/>
          <GlobalErrorHandler/>
          </ErrorProvider>
          </InfoProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}