"use client"
import { useTranslations } from "next-intl";
import { useLocale } from 'next-intl';
import { API_URL } from '@/lib/config';
import Slideshow from "../components/mainPage/eskola/slide";
import News from "../components/mainPage/noticeComponents/notices";
import SubTitle from "../components/mainPage/Titles/SubTitle";
import Line from "@/app/[locale]/components/main/line0m";
import ButtonNotice from '../components/mainPage/noticeComponents/Button';
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";

import { useState } from 'react';
interface Notice {
    slug: string;
    image: string;
    alt: string;
    date: string;
    title: string;
    category: string;
    titleKey: string;
    categoryKey: string;
    altKey: string;
    dateKey: string;
}

async function fetchNotices(locale: string): Promise<{ data: Notice[] }> {
    if (!API_URL) return { data: [] };
    try {
        const res = await fetch(`${API_URL}/api/notices/mainNotices`, {
            method: "POST",
            cache: "no-store",
            body: JSON.stringify({ path: "mainNotices", loc: locale }),
        });
        if (!res.ok) return { data: [] };
        return res.json();
    } catch {
        return { data: [] };
    }
}

function safeTranslate(t: (key: string) => string, key: string): string {
    try {
        return t(key);
    } catch {
        return key;
    }
}

export default function HomeView() {
    const [data, setData] = useState<Notice[]>([])
    const [session, setSession] = useState<Awaited<ReturnType<typeof authClient.getSession>>>();
    const locale = useLocale();
    useEffect(() => {
        const loadData = async () => {
            setSession(await authClient.getSession())
            const response = await fetchNotices(locale)
            setData(response.data)
        }
        loadData()
    }, [locale])
    const t = useTranslations("homePage");
    const tNotices = useTranslations("noticeComponent");
    const translatedNotices = data.map((item: Notice) => {
            let dateString = new Date(item.date).toLocaleDateString(locale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            if (locale === "eus") {
                dateString = dateString.replace(/\//g, "-");
            }

            return {
                ...item,
                title: safeTranslate(tNotices, item.titleKey),
                category: safeTranslate(tNotices, item.categoryKey),
                alt: safeTranslate(tNotices, item.altKey),
                date: dateString,
            };
    });
    const images = [
        { url: "https://photos.txuli.com/duranguesa/media/foto11.webp", alt: "Durangaldeko Bizikleta Eskolako txirrindulariak errepidean" },
        { url: "https://photos.txuli.com/duranguesa/media/foto3.webp", alt: "Eskolako gazteak entrenamenduan" },
        { url: "https://photos.txuli.com/duranguesa/media/foto9_alt.webp", alt: "Durangaldeko txirrindulari taldea" },
        { url: "https://photos.txuli.com/duranguesa/media/foto7.webp", alt: "Ziklokros entrenamendua Durangaldean" },
        { url: "https://photos.txuli.com/duranguesa/media/foto13.webp", alt: "Mendiko bizikleta ibilaldia" },

    ];

    const aboutusImages = [
        { url: 'https://photos.txuli.com/duranguesa/media/foto3.webp', title: t("title"), subtitle: t("subtitle") },
        { url: 'https://photos.txuli.com/duranguesa/media/foto16.webp', title: t("title2"), subtitle: t("subtitle2") },
        { url: 'https://photos.txuli.com/duranguesa/media/foto14.webp', title: t("title3"), subtitle: t("subtitle3") },
        { url: 'https://photos.txuli.com/duranguesa/media/foto15.webp', title: t("title4"), subtitle: t("subtitle4") },
    ];

    return (
        <div>
            <Slideshow images={images} title='DURANGALDEKO BIZIKLETA ESKOLA' />
            <Line />
            <SubTitle subTitle={t("componentSubtitle")} />
            <News items={translatedNotices} />
            <ButtonNotice />
            <Line />

            {aboutusImages.map((section, idx) => (
                <div key={idx} className="w-full relative" style={{ height: "400px" }}>
                    <div className="absolute inset-0 bg-cover bg-center filter brightness-50" style={{ backgroundImage: `url(${section.url})` }}></div>
                    <div className="absolute inset-0 z-5" style={{ background: "linear-gradient(to right, black 10%, transparent 70%)" }}></div>
                    <div className="absolute z-10 inset-0 flex items-center font-fredoka">
                        <div className="flex w-full p-4 justify-start ml-4">
                            <div className="w-full lg:w-1/4">
                                <h2 className="text-3xl font-bold text-white">{section.title}</h2>
                                <p className="mt-2 text-xl text-white">{section.subtitle}</p>
                            </div>
                        </div>
                    </div>

                </div>
            ))}
            <Line />
        </div>
    );
}
