import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, withBrand } from "@/lib/seo";
import CafeDromedarioView from "./CafeDromedarioView";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.cafedromedario" });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: buildAlternates(locale, "/cafedromedario"),
    openGraph: { title: withBrand(title), description },
    twitter: { title: withBrand(title), description },
  };
}

export default function Page() {
  return <CafeDromedarioView />;
}
