import type { MetadataRoute } from "next";
import fs from "fs/promises";
import path from "path";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";

type StaticRoute = {
  path: string; // locale-agnostic, e.g. "/eskola" ("" = home)
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

// Every static, publicly indexable page. The internal (session) area
// (dashboard, login, user management, ...) is deliberately excluded and
// blocked in robots.ts instead.
const STATIC_ROUTES: StaticRoute[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/eskola", priority: 0.8, changeFrequency: "monthly" },
  { path: "/galeria", priority: 0.7, changeFrequency: "weekly" },
  { path: "/notices", priority: 0.7, changeFrequency: "weekly" },
  { path: "/contacto", priority: 0.6, changeFrequency: "yearly" },
  { path: "/clothes", priority: 0.5, changeFrequency: "monthly" },
  { path: "/cafedromedario", priority: 0.5, changeFrequency: "monthly" },
  { path: "/form", priority: 0.5, changeFrequency: "yearly" },
  { path: "/puntagalea", priority: 0.4, changeFrequency: "monthly" },
  { path: "/puntagaleaTeam", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms&use", priority: 0.1, changeFrequency: "yearly" },
];

interface NoticeMeta {
  slug: string;
  date?: string;
}

async function getNotices(): Promise<NoticeMeta[]> {
  try {
    const noticesPath = path.join(process.cwd(), "public", "notices.json");
    const raw = await fs.readFile(noticesPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function languageAlternates(pathname: string) {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = absoluteUrl(`/${loc}${pathname}`);
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: absoluteUrl(`/${locale}${route.path}`),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: languageAlternates(route.path) },
      });
    }
  }

  const notices = await getNotices();
  for (const locale of routing.locales) {
    for (const notice of notices) {
      if (!notice.slug) continue;
      const pathname = `/notice/${notice.slug}`;
      entries.push({
        url: absoluteUrl(`/${locale}${pathname}`),
        lastModified: notice.date ? new Date(notice.date) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: languageAlternates(pathname) },
      });
    }
  }

  return entries;
}
