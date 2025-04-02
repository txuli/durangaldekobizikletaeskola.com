"use client"
import { redirect } from '@/i18n/routing';
import { useTranslations } from "next-intl";
export default function ButtonNotice() {
    const t = useTranslations("noticePage");

    return(
        <div className="w-full flex justify-end mt-6 ">
        <button className="bg-customDarkBlue p-2 font-fredoka font-semibold text-xl rounded-lg mx-auto  lg:mr-32 mb-20" onClick={() => redirect({ href: "/notices", locale: "eus" })}>{t("button")}</button>
      </div> 
    )
}