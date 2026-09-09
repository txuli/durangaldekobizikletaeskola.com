import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, withBrand } from "@/lib/seo";
import ModalidadView from "./ModalidadView";

type Params = Promise<{ locale: string; modalidad: string }>;

function humanize(slug: string) {
  return decodeURIComponent(slug)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, modalidad } = await params;
  const t = await getTranslations({ locale, namespace: "seo.galeria" });
  const label = humanize(modalidad);
  const title = `${t("title")} — ${label}`;
  const description = t("description");

  return {
    title,
    description,
    alternates: buildAlternates(locale, `/galeria/${modalidad}`),
    openGraph: { title: withBrand(title), description },
    twitter: { title: withBrand(title), description },
  };
}

export default function Page() {
  return <ModalidadView />;
}
