import fs from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import { createTranslator } from "next-intl";
import NoticeTemplate from "@/app/[locale]/components/mainPage/noticeComponents/noticeTemplate";
import { NewsProps } from "@/app/[locale]/components/mainPage/noticeComponents/noticeTemplate";
import { API_URL } from "@/lib/config";
import { buildAlternates, withBrand } from "@/lib/seo";

type Params = Promise<{ slug: string; locale: string }>;

interface NoticeMeta {
  slug: string;
  translationKey: string;
  imagePage?: string;
  image?: string;
}

async function findNotice(slug: string): Promise<NoticeMeta | undefined> {
  try {
    const noticesPath = path.join(process.cwd(), "public", "notices.json");
    const raw = await fs.readFile(noticesPath, "utf-8");
    const notices: NoticeMeta[] = JSON.parse(raw);
    return notices.find((notice) => notice.slug === slug);
  } catch {
    return undefined;
  }
}

function safeTranslate(t: (key: string) => string, key: string): string | undefined {
  try {
    const value = t(key);
    return value === key ? undefined : value;
  } catch {
    return undefined;
  }
}

// Each notice gets its own title/description (pulled from the article's
// own translation strings) instead of inheriting the generic site-wide
// fallback from the layout.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const alternates = buildAlternates(locale, `/notice/${slug}`);
  const notice = await findNotice(slug);
  if (!notice) return { alternates };

  const messagesPath = path.join(process.cwd(), "messages", `${locale}.json`);
  const raw = await fs.readFile(messagesPath, "utf-8");
  const messages = JSON.parse(raw);
  const t = createTranslator({ locale, messages, namespace: notice.translationKey });

  const title = safeTranslate(t, "title");
  const description = safeTranslate(t, "subTitle") ?? safeTranslate(t, "p1")?.slice(0, 160);
  const image = notice.imagePage ?? notice.image;

  const socialTitle = title ? withBrand(title) : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "article",
      title: socialTitle,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page(props: { params: Params }) {
  const params = await props.params;
  const slug= await params.slug;
  
  const res = await fetch(`${API_URL}/api/notices/RenderNews`,{
    cache: "no-store",
    method: "POST",
    body: JSON.stringify({slug: slug}),
  });
  if (!res.ok) {
    throw new Error("Error al cargar la noticia");
  }
  const {data} = await res.json();
  
  
  const noticia: NewsProps = {
    translation: data.translationKey, 
    idImage: data.imagePage,
    urls: data.urls,
    
  };
 


  return (
   
    <NoticeTemplate NewsProps={noticia} />

  );
}