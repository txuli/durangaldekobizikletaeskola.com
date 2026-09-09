import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// Path segments that live behind the internal login/dashboard — replaces
// the old static robots.txt (which only had an ambiguous, empty
// "Allow:" line) and keeps crawl budget off admin-only routes.
const SESSION_SEGMENTS = [
  "carreras",
  "codigos",
  "dashboard",
  "deportistas",
  "entrenadores",
  "historial",
  "imageFolders",
  "imageSubmit",
  "login",
  "noticeCreator",
  "perfil",
  "photoManagement",
  "sign-up",
  "usuarios",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    ...SESSION_SEGMENTS.flatMap((segment) => [
      `/es/${segment}`,
      `/eus/${segment}`,
    ]),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
