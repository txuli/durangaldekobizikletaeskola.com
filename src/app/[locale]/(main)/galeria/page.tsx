 import type { Metadata } from "next";
 import { getTranslations } from "next-intl/server";
 import Card from "@/app/[locale]/components/mainPage/gallery/Card";
 import { API_URL } from "@/lib/config";
 import { buildAlternates, withBrand } from "@/lib/seo";

 type Params = Promise<{ locale: string }>;

 export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
   const { locale } = await params;
   const t = await getTranslations({ locale, namespace: "seo.galeria" });
   const title = t("title");
   const description = t("description");

   return {
     title,
     description,
     alternates: buildAlternates(locale, "/galeria"),
     openGraph: { title: withBrand(title), description },
     twitter: { title: withBrand(title), description },
   };
 }

 async function fetchGalleryData() {
   try {
     

     if (!API_URL) {
       throw new Error("API URL no definida en las variables de entorno");
     }

     const response = await fetch(`${API_URL}/api/gallery`, {
       method: "POST",
       cache: "no-store", 
     });

     if (!response.ok) {
       throw new Error(`Error al obtener datos: ${response.status}`);
     }

     const responseData = await response.json();

     return responseData
       .filter((item: string) => !item.includes("../"))
       .map((item: string) => ({
        
         image: `https://photos.txuli.com/duranguesa/covers/${item.slice(0, -1)}.webp`,
         title: item.slice(0, -1),
         link: `/galeria/${item.slice(0, -1)}`,
       }));
   } catch (error) {
     console.error("Fetching error:", error);
     return [];
   }
 }

 export default async function Page() {
   const fetchData = await fetchGalleryData();

   return (
     <div className="mt-20 grid h-screen w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 px-6">
       <Card album={fetchData} />
     </div>
   );
 }


