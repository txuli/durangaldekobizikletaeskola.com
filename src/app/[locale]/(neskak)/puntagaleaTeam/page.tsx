
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TopImage from "@/app/[locale]/components/mainPage/noticeComponents/topImageImage";
import NoticeContent from "../../components/mainPage/noticeComponents/noticeContent";
import { useTranslations } from "next-intl";
import { buildAlternates, withBrand } from "@/lib/seo";

type Params = Promise<{ locale: string }>;

// Route group has no title.template, so the brand suffix is added
// explicitly here rather than relying on layout-level merging.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "seo.puntagaleaTeam" });
    const title = t("title");
    const description = t("description");

    return {
        title: withBrand(title),
        description,
        alternates: buildAlternates(locale, "/puntagaleaTeam"),
        openGraph: { title: withBrand(title), description },
        twitter: { title: withBrand(title), description },
    };
}

export default function Page() {
// Fixed: this namespace didn't exist in messages/*.json (the real one is
// "puntagaleaTeamPage"), so the page was rendering raw translation keys.
const t = useTranslations("puntagaleaTeamPage");
    return (
        <>
         <TopImage image = "https://photos.txuli.com/duranguesa/notices/noticiaNeskak.JPG" alt={t("altImage")} title={t("title")} subTitle={t("subTitle")} colors="bg-custom-puntagalea-dark-orange"/>
        <NoticeContent 



        p1={t("p1")}
        p2={t("p2")}
        p3={t("p3")}
        p4={t("p4")}
        p5={t("p5")}
        p6={t("p6")}
        p7={t("p7")}
        
        />
        </>
    )
}