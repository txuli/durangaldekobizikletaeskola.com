"use client"
import Slideshow from "../../components/mainPage/eskola/slide";
import Section from "../../components/main/Section";
import P from "../../components/main/P";
// import Runner from "../../components/mainPage/drom/Runner";
// import { runner } from "./images";
import { images } from "./images";
import Line from "../../components/main/line0m";
import { useTranslations } from "next-intl";
export default function Page() {
    const t = useTranslations("PuntaGaleaMainPage");
    return (
        <>
            <Slideshow
                images={images}
                title="PUNTAGALEA OCCIDENT-DURANGALDEKO"
            />
            <Line color="bg-custom-puntagalea-dark-orange"/>
            {/* <Section >
            <Runner runner={runner} title={t("titleRunners")} color="bg-custom-puntagalea-orange" color2="bg-custom-puntagalea-blue" />
            </Section > */}
            <Section >
                <P>
                {t("p1")}
                </P>
                <P>
                {t("p2")}
                </P>
                <P>
                {t("p3")}
                </P>
            
               

                
            </Section>
            

        </>
    )
}