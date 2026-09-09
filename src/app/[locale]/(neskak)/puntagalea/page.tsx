import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, withBrand } from "@/lib/seo";
import PuntagaleaView from "./PuntagaleaView";

type Params = Promise<{ locale: string }>;

// This route group has no title.template, so the brand suffix is added
// explicitly here rather than relying on layout-level merging.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.puntagalea" });
  const title = t("title");
  const description = t("description");

  return {
    title: withBrand(title),
    description,
    alternates: buildAlternates(locale, "/puntagalea"),
    openGraph: { title: withBrand(title), description },
    twitter: { title: withBrand(title), description },
  };
}

export default function Page() {
  return <PuntagaleaView />;
}
